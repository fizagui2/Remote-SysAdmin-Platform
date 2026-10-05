from django.conf import settings
from django.db import models


class Computer(models.Model):
    """One row per machine running the Windows agent, keyed on hostname.

    Each latest_* column holds the most recent payload the agent sent to the
    matching endpoint, stored exactly as received. A new payload replaces that
    machine's previous one; no history is kept.

    owner is the account the machine belongs to. Only that account sees it on
    the dashboard. Machines that reported before they had an owner have none,
    and only superusers see those until one is assigned in the admin.
    """

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        # Deleting an account deletes its machines, and their commands with them.
        on_delete=models.CASCADE,
        related_name="computers",
    )
    hostname = models.CharField(max_length=255, unique=True)
    last_seen = models.DateTimeField(null=True, blank=True)

    latest_report = models.JSONField(null=True, blank=True)
    latest_heartbeat = models.JSONField(null=True, blank=True)
    latest_performance = models.JSONField(null=True, blank=True)
    latest_processes = models.JSONField(null=True, blank=True)
    latest_services = models.JSONField(null=True, blank=True)

    def __str__(self):
        return self.hostname


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