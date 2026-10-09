from django.conf import settings
from django.db import models

class Computer(models.Model):
    """One row per machine running the Windows agent.

    Each latest_* column holds the most recent payload the agent sent to the
    matching endpoint, stored exactly as received. A new payload replaces that
    machine's previous one; no history is kept.

    owner is the account the machine belongs to. Only that account sees it on
    the dashboard, superusers included. Machines that reported before they had
    an owner have none, and show up on nobody's dashboard until one is assigned
    in the admin.

    A machine is enrolled once it has a device token (see enrollment.py). Only
    the SHA-256 of the token is stored, so a leaked database doesn't hand out
    working tokens. An enrolled machine is identified by its token alone. A
    machine that hasn't enrolled is identified by hostname, which is why a
    hostname can belong to only one machine that hasn't enrolled.
    """

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        # Deleting an account deletes its machines, and their commands with them.
        on_delete=models.CASCADE,
        related_name="computers",
    )
    # Unique per account rather than across the site, so two accounts can each
    # have a DESKTOP-1. See the constraints below.
    hostname = models.CharField(max_length=255)
    token_hash = models.CharField(max_length=64, unique=True, null=True, blank=True, editable=False)
    last_seen = models.DateTimeField(null=True, blank=True)

    latest_report = models.JSONField(null=True, blank=True)
    latest_heartbeat = models.JSONField(null=True, blank=True)
    latest_performance = models.JSONField(null=True, blank=True)
    latest_processes = models.JSONField(null=True, blank=True)
    latest_services = models.JSONField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["owner", "hostname"], name="unique_hostname_per_owner"),
            models.UniqueConstraint(
                fields=["hostname"],
                condition=models.Q(token_hash__isnull=True),
                name="unique_hostname_until_enrolled",
            ),
        ]

    @property
    def is_enrolled(self):
        return self.token_hash is not None

    def __str__(self):
        return self.hostname


class EnrollmentCode(models.Model):
    """A short, single-use code that ties a new agent to the account that made it.

    The Add device page creates one; the agent trades it for a device token at
    /api/agent/enroll/. computer records which machine used it.
    """

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="enrollment_codes",
    )
    # Stored without the dash it's displayed with.
    code = models.CharField(max_length=8, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    computer = models.ForeignKey(
        Computer, null=True, blank=True, on_delete=models.SET_NULL, related_name="+",
    )

    def __str__(self):
        return f"{self.code} for {self.owner}"


class Command(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("sent", "Sent"),
        ("success", "Success"),
        ("failed", "Failed"),
    ]

    computer = models.ForeignKey(Computer, on_delete=models.CASCADE, related_name="commands")
    command = models.CharField(max_length=50)
    pid = models.IntegerField(null=True, blank=True)
    service_name = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.command} on {self.computer.hostname} ({self.status})"