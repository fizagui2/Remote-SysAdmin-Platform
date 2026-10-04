from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend


class CaseInsensitiveUsernameBackend(ModelBackend):
    """Django's ModelBackend, but the username match ignores case.

    Accounts created on the register page use the email address as the
    username, and people type addresses with whatever capitalization their
    phone or browser gives them. If two accounts differ only by case (possible
    through createsuperuser), the exact match wins so both stay reachable.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        field = UserModel.USERNAME_FIELD
        if username is None:
            username = kwargs.get(field)
        if username is None or password is None:
            return None

        try:
            user = UserModel._default_manager.get(**{f"{field}__iexact": username})
        except UserModel.MultipleObjectsReturned:
            user = UserModel._default_manager.filter(**{field: username}).first()
        except UserModel.DoesNotExist:
            user = None

        if user is None:
            # Hash anyway, so a missing account takes as long to reject as a
            # wrong password. ModelBackend does the same.
            UserModel().set_password(password)
            return None
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
