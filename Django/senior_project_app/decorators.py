from functools import wraps

from django.conf import settings
from django.http import JsonResponse

from .enrollment import hash_token
from .models import Computer


def login_required_json(view):
    """Like login_required, but answers a logged-out request with a 401.

    The dashboard reads these endpoints with fetch(). login_required would
    redirect it to the login page, and fetch() would follow the redirect and
    try to parse that page's HTML as JSON.
    """

    @wraps(view)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Login required"}, status=401)
        return view(request, *args, **kwargs)

    return wrapper


def _unauthorized(message):
    response = JsonResponse({"error": message}, status=401)
    response["WWW-Authenticate"] = "Token"
    return response


def agent_token(view):
    """Works out which enrolled machine an agent request comes from.

    With "Authorization: Token <device token>", request.agent_computer is that
    machine, and an unknown token or a malformed header gets a 401.

    Without the header, request.agent_computer is None and the view falls back
    to the Hostname in the payload, which can only reach machines that haven't
    enrolled. That fallback keeps agents that predate enrollment working. Set
    AGENT_TOKEN_REQUIRED to turn it off, and requests without a token get a 401.
    """

    @wraps(view)
    def wrapper(request, *args, **kwargs):
        header = request.headers.get("Authorization")
        if header is None:
            if settings.AGENT_TOKEN_REQUIRED:
                return _unauthorized("Device token required")
            request.agent_computer = None
            return view(request, *args, **kwargs)

        scheme, _, token = header.partition(" ")
        token = token.strip()
        computer = None
        if scheme == "Token" and token:
            computer = Computer.objects.filter(token_hash=hash_token(token)).first()
        if computer is None:
            return _unauthorized("Invalid device token")
        request.agent_computer = computer
        return view(request, *args, **kwargs)

    return wrapper
