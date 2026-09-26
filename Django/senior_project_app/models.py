from django.db import models


class Computer(models.Model):
    """One row per machine running the Windows agent, keyed on hostname.

    Each latest_* column holds the most recent payload the agent sent to the
    matching endpoint, stored exactly as received. A new payload replaces that
    machine's previous one; no history is kept.
    """

    hostname = models.CharField(max_length=255, unique=True)
    last_seen = models.DateTimeField(null=True, blank=True)

    latest_report = models.JSONField(null=True, blank=True)
    latest_heartbeat = models.JSONField(null=True, blank=True)
    latest_performance = models.JSONField(null=True, blank=True)
    latest_processes = models.JSONField(null=True, blank=True)
    latest_services = models.JSONField(null=True, blank=True)

    def __str__(self):
        return self.hostname
