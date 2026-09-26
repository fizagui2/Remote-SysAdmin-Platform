import json
from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from .models import Computer
 
class AgentEndpointTests(TestCase):
    """
    Example requests against the Windows Agent ingestion endpoints
    (senior_project_app.views.agent_report / agent_heartbeat /
    agent_performance / agent_processes / agent_status).
 
    Each test POSTs a small sample payload — the kind of thing the
    Windows Agent would actually send — and then checks that
    /api/agent/status/ (and /agent/) reflect it back correctly.
 
    Run these with:
        python manage.py test senior_project_app
    """
 
    def test_agent_report_stores_and_reflects_data(self):
        sample_report = {
            "Hostname": "TEST-PC-01",
            "os_version": "Windows 11 Pro 23H2",
            "cpu": "Intel Core i7-12700K",
            "ram_gb": 32,
        }
 
        response = self.client.post(
            "/api/agent/report/",
            data=json.dumps(sample_report),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "received"})
 
        status_data = self.client.get("/api/agent/status/").json()
        self.assertTrue(status_data["report"]["has_data"])
        self.assertEqual(status_data["report"]["data"], sample_report)
 
    def test_agent_report_with_real_system_info_payload(self):
        # This mirrors the actual shape the Windows Agent sends: it's the
        # JSON.NET serialization of WindowsAgent.Models.SystemInfo, POSTed
        # once at agent startup via ApiClient.SendSystemInfoAsync().
        system_info_payload = {
            "Hostname": "FRANKYSLAPTOP",
            "WindowsVersion": "Windows 11 Home 25H2 (Build 26200)",
            "CpuModel": "Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz",
            "CpuCores": 8,
            "TotalRamGb": 15.92,
            "Drives": [
                {"DriveLetter": "C:\\", "TotalGb": 476.94, "FreeGb": 128.31},
                {"DriveLetter": "D:\\", "TotalGb": 931.51, "FreeGb": 500.02},
            ],
            "IpAddress": "192.168.1.25",
            "UptimeHours": 37.5,
            "LoggedInUser": "fjiza",
            "NetworkAdapter": "Ethernet",
            "MacAddress": "00-15-5D-12-34-56",
        }
 
        response = self.client.post(
            "/api/agent/report/",
            data=json.dumps(system_info_payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "received"})
 
        # /api/agent/status/ should hand this back exactly as posted.
        status_data = self.client.get("/api/agent/status/").json()
        self.assertTrue(status_data["report"]["has_data"])
        self.assertEqual(status_data["report"]["data"], system_info_payload)
        self.assertEqual(status_data["report"]["data"]["Hostname"], "FRANKYSLAPTOP")
        self.assertEqual(len(status_data["report"]["data"]["Drives"]), 2)
 
        # /agent/ should render it too.
        report_page = self.client.get("/agent/")
        self.assertEqual(report_page.status_code, 200)
        self.assertContains(report_page, "FRANKYSLAPTOP")
 
    def test_agent_heartbeat_stores_and_reflects_data(self):
        sample_heartbeat = {
            "Hostname": "TEST-PC-01",
            "status": "online",
            "uptime_seconds": 3600,
        }
 
        response = self.client.post(
            "/api/agent/heartbeat/",
            data=json.dumps(sample_heartbeat),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
 
        status_data = self.client.get("/api/agent/status/").json()
        self.assertTrue(status_data["heartbeat"]["has_data"])
        self.assertEqual(status_data["heartbeat"]["data"], sample_heartbeat)
 
    def test_agent_performance_stores_and_reflects_data(self):
        sample_performance = {
            "Hostname": "TEST-PC-01",
            "cpu_percent": 42.5,
            "memory_percent": 63.1,
            "disk_percent": 78.0,
        }
 
        response = self.client.post(
            "/api/agent/performance/",
            data=json.dumps(sample_performance),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
 
        status_data = self.client.get("/api/agent/status/").json()
        self.assertTrue(status_data["performance"]["has_data"])
        self.assertEqual(status_data["performance"]["data"], sample_performance)
 
    def test_agent_processes_stores_and_reflects_data(self):
        sample_processes = {
            "Hostname": "TEST-PC-01",
            "processes": [
                {"pid": 1234, "name": "chrome.exe", "memory_mb": 512},
                {"pid": 5678, "name": "explorer.exe", "memory_mb": 128},
            ],
        }
 
        response = self.client.post(
            "/api/agent/processes/",
            data=json.dumps(sample_processes),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
 
        status_data = self.client.get("/api/agent/status/").json()
        self.assertTrue(status_data["processes"]["has_data"])
        self.assertEqual(status_data["processes"]["data"], sample_processes)
 
    def test_agent_status_shape_when_nothing_posted_yet(self):
        # Guards the JSON shape agent_status always returns, independent
        # of whatever other tests in this run have already posted.
        status_data = self.client.get("/api/agent/status/").json()
        for key in ("report", "heartbeat", "performance", "processes"):
            self.assertIn(key, status_data)
            self.assertIn("has_data", status_data[key])
            self.assertIn("data", status_data[key])
 
    def test_agent_endpoints_reject_get(self):
        for url in (
            "/api/agent/report/",
            "/api/agent/heartbeat/",
            "/api/agent/performance/",
            "/api/agent/processes/",
        ):
            response = self.client.get(url)
            self.assertEqual(response.status_code, 405, msg=f"{url} should reject GET")
 
    def test_agent_report_rejects_invalid_json(self):
        response = self.client.post(
            "/api/agent/report/",
            data="not valid json",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
 
    def test_view_report_renders_after_data_posted(self):
        sample_report = {"Hostname": "TEST-PC-01", "os_version": "Windows 11 Pro"}
        self.client.post(
            "/api/agent/report/",
            data=json.dumps(sample_report),
            content_type="application/json",
        )
 
        response = self.client.get("/agent/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "TEST-PC-01")
 
 
class MultipleComputerTests(TestCase):
    """
    Several agents reporting at once must each keep their own data.

    Before per-machine storage, every agent wrote into one shared slot per
    endpoint, so the second machine to report replaced the first.
    """

    def post_json(self, url, payload):
        return self.client.post(url, data=json.dumps(payload), content_type="application/json")

    def test_two_computers_do_not_overwrite_each_other(self):
        self.post_json("/api/agent/performance/", {"Hostname": "PC-A", "CpuUsagePercent": 12.5})
        self.post_json("/api/agent/performance/", {"Hostname": "PC-B", "CpuUsagePercent": 87.0})

        pc_a = self.client.get("/api/agent/status/?hostname=PC-A").json()
        pc_b = self.client.get("/api/agent/status/?hostname=PC-B").json()
        self.assertEqual(pc_a["performance"]["data"]["CpuUsagePercent"], 12.5)
        self.assertEqual(pc_b["performance"]["data"]["CpuUsagePercent"], 87.0)

    def test_new_payload_replaces_only_that_computers_data(self):
        self.post_json("/api/agent/performance/", {"Hostname": "PC-A", "CpuUsagePercent": 12.5})
        self.post_json("/api/agent/performance/", {"Hostname": "PC-B", "CpuUsagePercent": 87.0})
        self.post_json("/api/agent/performance/", {"Hostname": "PC-A", "CpuUsagePercent": 55.0})

        pc_a = self.client.get("/api/agent/status/?hostname=PC-A").json()
        pc_b = self.client.get("/api/agent/status/?hostname=PC-B").json()
        self.assertEqual(pc_a["performance"]["data"]["CpuUsagePercent"], 55.0)
        self.assertEqual(pc_b["performance"]["data"]["CpuUsagePercent"], 87.0)
        self.assertEqual(Computer.objects.count(), 2)

    def test_computers_endpoint_lists_every_machine(self):
        self.post_json("/api/agent/report/", {"Hostname": "PC-B", "WindowsVersion": "Windows 11 Pro"})
        self.post_json("/api/agent/report/", {"Hostname": "PC-A", "WindowsVersion": "Windows 10 Home"})

        computers = self.client.get("/api/agent/computers/").json()["computers"]
        self.assertEqual([c["hostname"] for c in computers], ["PC-A", "PC-B"])
        self.assertEqual(computers[0]["report"]["WindowsVersion"], "Windows 10 Home")
        self.assertIsNotNone(computers[0]["last_seen"])

    def test_payload_without_hostname_is_rejected(self):
        response = self.post_json("/api/agent/performance/", {"CpuUsagePercent": 12.5})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Computer.objects.count(), 0)

    def test_status_for_unknown_hostname_returns_404(self):
        response = self.client.get("/api/agent/status/?hostname=NOT-A-PC")
        self.assertEqual(response.status_code, 404)

    def test_status_without_hostname_returns_most_recent_computer(self):
        # last_seen is set directly rather than relying on two requests
        # landing at measurably different times.
        now = timezone.now()
        Computer.objects.create(hostname="NEWER-PC", last_seen=now, latest_heartbeat={"Hostname": "NEWER-PC"})
        Computer.objects.create(
            hostname="OLDER-PC",
            last_seen=now - timedelta(minutes=5),
            latest_heartbeat={"Hostname": "OLDER-PC"},
        )

        status_data = self.client.get("/api/agent/status/").json()
        self.assertEqual(status_data["hostname"], "NEWER-PC")


class PageViewSmokeTests(TestCase):
    """Basic checks that the main (non-API) pages still render without errors."""
 
    def test_home_page_loads(self):
        self.assertEqual(self.client.get("/").status_code, 200)
 
    def test_login_page_loads(self):
        self.assertEqual(self.client.get("/login/").status_code, 200)
 
    def test_plans_page_loads(self):
        self.assertEqual(self.client.get("/plans/").status_code, 200)
 
    def test_about_page_loads(self):
        self.assertEqual(self.client.get("/aboutus/").status_code, 200)
 
    def test_dashboard_page_loads(self):
        self.assertEqual(self.client.get("/dashboard/").status_code, 200)
 
    def test_devices_page_loads(self):
        self.assertEqual(self.client.get("/devices/").status_code, 200)