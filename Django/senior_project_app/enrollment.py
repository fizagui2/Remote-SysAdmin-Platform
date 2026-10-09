"""Enrollment codes and device tokens: how a new agent gets tied to an account.

1. A logged-in user asks the Add device page for a code, like K7QF-2M9P.
2. The agent sends that code and its hostname to /api/agent/enroll/.
3. The server marks the code used and answers with a device token, once.
4. The agent sends "Authorization: Token <token>" on every request after that.

The full agent-side contract is in Project-Documents/Agent-Enrollment.md.
"""

import hashlib
import secrets
from datetime import timedelta

from django.db import IntegrityError, transaction
from django.utils import timezone

from .models import Computer, EnrollmentCode

CODE_LIFETIME = timedelta(minutes=15)

# No 0/O or 1/I/L, so a code read off a screen can't be mistyped as a
# different valid one, and no U (Crockford's base32 drops it too). 30 symbols
# over 8 places is about 656 billion codes.
CODE_ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789"
CODE_LENGTH = 8


def normalize_code(raw):
    """K7QF-2m9p, "k7qf 2m9p" and K7QF2M9P all mean the same code."""
    return "".join(ch for ch in str(raw).upper() if ch.isalnum())


def format_code(code):
    """Show a stored code as two groups of four: K7QF-2M9P."""
    return f"{code[:4]}-{code[4:]}"


def hash_token(token):
    # Tokens are long and random, so a plain SHA-256 is enough. Passwords
    # need a slow salted hash; these don't.
    return hashlib.sha256(token.encode()).hexdigest()


def create_enrollment_code(owner):
    """Make a new single-use code for owner that expires after CODE_LIFETIME."""
    for _ in range(5):
        code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LENGTH))
        try:
            with transaction.atomic():
                return EnrollmentCode.objects.create(
                    owner=owner, code=code, expires_at=timezone.now() + CODE_LIFETIME,
                )
        except IntegrityError:
            # The code was already taken. At this size, practically never.
            continue
    raise RuntimeError("Could not generate a unique enrollment code.")


def active_code_for(owner):
    """The owner's newest code that's still usable, or None."""
    return (
        EnrollmentCode.objects
        .filter(owner=owner, used_at__isnull=True, expires_at__gt=timezone.now())
        .order_by("-created_at")
        .first()
    )


def redeem_enrollment_code(raw_code, hostname):
    """Use up a code and return (computer, device_token), or None if the code is no good.

    The machine joins the code owner's account. If that account already has a
    machine with this hostname, it's reused and gets a new token, so the old
    token stops working. That's how a reinstalled agent re-enrolls. Enrolling
    never takes over a machine that belongs to another account or to nobody.
    """
    code = normalize_code(raw_code)
    now = timezone.now()
    with transaction.atomic():
        # Checking the code and marking it used in one UPDATE means two agents
        # racing with the same code can't both get a token.
        claimed = (
            EnrollmentCode.objects
            .filter(code=code, used_at__isnull=True, expires_at__gt=now)
            .update(used_at=now)
        )
        if not claimed:
            return None
        enrollment = EnrollmentCode.objects.select_related("owner").get(code=code)

        computer = Computer.objects.filter(owner=enrollment.owner, hostname=hostname).first()
        if computer is None:
            computer = Computer(owner=enrollment.owner, hostname=hostname)
        token = secrets.token_urlsafe(32)
        computer.token_hash = hash_token(token)
        computer.save()

        enrollment.computer = computer
        enrollment.save(update_fields=["computer"])
    return computer, token
