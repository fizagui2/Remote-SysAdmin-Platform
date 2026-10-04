from django import forms
from django.contrib.auth import get_user_model, password_validation
from django.contrib.auth.forms import AuthenticationForm
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

DUPLICATE_EMAIL = "An account with this email already exists."


class LoginForm(AuthenticationForm):
    """Django's login form plus the login page's "Remember me" checkbox."""

    remember = forms.BooleanField(required=False)

    error_messages = {
        **AuthenticationForm.error_messages,
        "invalid_login": "Incorrect email or password.",
    }


class RegisterForm(forms.Form):
    """Creates an account from the register page's name, email and password.

    The email address doubles as the username. That keeps Django's default
    user model, and lets the login page ask for an email.
    """

    full_name = forms.CharField(max_length=150)
    email = forms.EmailField(max_length=150)
    password = forms.CharField(strip=False, widget=forms.PasswordInput)
    terms = forms.BooleanField(
        error_messages={"required": "You must agree to the terms to create an account."},
    )

    def clean_email(self):
        email = self.cleaned_data["email"].lower()
        if get_user_model()._default_manager.filter(username__iexact=email).exists():
            raise ValidationError(DUPLICATE_EMAIL)
        return email

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        if password:
            # Passing the would-be user lets the similarity validator reject
            # passwords that are just the person's name or email.
            try:
                password_validation.validate_password(password, self._build_user())
            except ValidationError as error:
                self.add_error("password", error)
        return cleaned_data

    def _build_user(self):
        email = self.cleaned_data.get("email", "")
        first_name, _, last_name = self.cleaned_data.get("full_name", "").partition(" ")
        return get_user_model()(
            username=email, email=email, first_name=first_name, last_name=last_name.strip(),
        )

    def save(self):
        """Create the account, or return None if the email was taken meanwhile."""
        user = self._build_user()
        user.set_password(self.cleaned_data["password"])
        try:
            # clean_email checked, but two signups can race past that check.
            with transaction.atomic():
                user.save()
        except IntegrityError:
            self.add_error("email", DUPLICATE_EMAIL)
            return None
        return user
