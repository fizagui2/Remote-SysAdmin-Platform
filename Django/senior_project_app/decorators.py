from functools import wraps

from django.http import JsonResponse


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
