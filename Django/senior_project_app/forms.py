from django import forms
from django.contrib.auth.forms import AuthenticationForm


class LoginForm(AuthenticationForm):
    """Django's login form plus the login page's "Remember me" checkbox."""

    remember = forms.BooleanField(required=False)

    error_messages = {
        **AuthenticationForm.error_messages,
        "invalid_login": "Incorrect email or password.",
    }
