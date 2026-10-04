import json
from datetime import timedelta

from django.contrib.auth import get_user_model
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


class LoginTests(TestCase):
    """The login page signs people in by email, and logout signs them out."""

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="ana@example.com", email="ana@example.com", password="correct-horse-42",
        )

    def log_in(self, username="ana@example.com", password="correct-horse-42", **extra):
        return self.client.post("/login/", {"username": username, "password": password, **extra})

    def assertLoggedIn(self):
        self.assertEqual(self.client.session.get("_auth_user_id"), str(self.user.pk))

    def assertLoggedOut(self):
        self.assertNotIn("_auth_user_id", self.client.session)

    def test_login_page_has_a_submittable_form(self):
        response = self.client.get("/login/")
        self.assertContains(response, 'method="post"')
        self.assertContains(response, 'name="username"')
        self.assertContains(response, 'name="password"')
        self.assertContains(response, "csrfmiddlewaretoken")

    def test_correct_login_goes_to_dashboard(self):
        response = self.log_in()
        self.assertRedirects(response, "/dashboard/", fetch_redirect_response=False)
        self.assertLoggedIn()

    def test_email_is_matched_without_regard_to_case(self):
        self.log_in(username="Ana@Example.COM")
        self.assertLoggedIn()

    def test_plain_username_still_works(self):
        # Superusers made with createsuperuser often have a plain username.
        get_user_model().objects.create_superuser("luis", "luis@example.com", "admin-pass-99")
        response = self.log_in(username="luis", password="admin-pass-99")
        self.assertRedirects(response, "/dashboard/", fetch_redirect_response=False)

    def test_wrong_password_stays_on_page_with_error(self):
        response = self.log_in(password="wrong-password")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Incorrect email or password.")
        self.assertLoggedOut()

    def test_unknown_email_is_rejected(self):
        response = self.log_in(username="nobody@example.com")
        self.assertContains(response, "Incorrect email or password.")
        self.assertLoggedOut()

    def test_inactive_account_cannot_log_in(self):
        self.user.is_active = False
        self.user.save()
        self.log_in()
        self.assertLoggedOut()

    def test_login_returns_to_next_page(self):
        response = self.log_in(next="/devices/")
        self.assertRedirects(response, "/devices/", fetch_redirect_response=False)

    def test_login_ignores_offsite_next(self):
        response = self.log_in(next="https://evil.example.com/")
        self.assertRedirects(response, "/dashboard/", fetch_redirect_response=False)

    def test_without_remember_me_session_ends_with_browser(self):
        self.log_in()
        self.assertTrue(self.client.session.get_expire_at_browser_close())

    def test_remember_me_keeps_session_after_browser_closes(self):
        self.log_in(remember="on")
        self.assertFalse(self.client.session.get_expire_at_browser_close())

    def test_logged_in_user_skips_login_page(self):
        self.client.force_login(self.user)
        response = self.client.get("/login/")
        self.assertRedirects(response, "/dashboard/", fetch_redirect_response=False)

    def test_logout_signs_out_and_goes_home(self):
        self.client.force_login(self.user)
        response = self.client.post("/logout/")
        self.assertRedirects(response, "/", fetch_redirect_response=False)
        self.assertLoggedOut()

    def test_logout_rejects_get(self):
        # A GET logout could be triggered by any link or <img> on another site.
        self.client.force_login(self.user)
        self.assertEqual(self.client.get("/logout/").status_code, 405)
        self.assertLoggedIn()

    def test_navbar_shows_logout_when_logged_in(self):
        self.assertNotContains(self.client.get("/"), 'action="/logout/"')
        self.client.force_login(self.user)
        self.assertContains(self.client.get("/"), 'action="/logout/"')


class RegisterTests(TestCase):
    """Anyone can create an account; the email address becomes the username."""

    def register(self, **overrides):
        data = {
            "full_name": "Ana Lopez",
            "email": "ana@example.com",
            "password": "correct-horse-42",
            "terms": "on",
            **overrides,
        }
        return self.client.post("/register/", data)

    def test_register_page_shows_the_form(self):
        # The form once sat outside {% block content %}, which Django drops,
        # so the page rendered without it.
        response = self.client.get("/register/")
        self.assertContains(response, 'id="signupForm"')
        self.assertContains(response, 'name="email"')

    def test_register_creates_account_and_logs_in(self):
        response = self.register()
        self.assertRedirects(response, "/dashboard/", fetch_redirect_response=False)

        user = get_user_model().objects.get()
        self.assertEqual(user.username, "ana@example.com")
        self.assertEqual(user.email, "ana@example.com")
        self.assertEqual((user.first_name, user.last_name), ("Ana", "Lopez"))
        self.assertTrue(user.check_password("correct-horse-42"))
        self.assertEqual(self.client.session.get("_auth_user_id"), str(user.pk))

    def test_new_account_can_log_in_again(self):
        self.register()
        self.client.post("/logout/")
        response = self.client.post("/login/", {"username": "ana@example.com", "password": "correct-horse-42"})
        self.assertRedirects(response, "/dashboard/", fetch_redirect_response=False)

    def test_email_is_stored_lowercase(self):
        self.register(email="Ana@Example.COM")
        self.assertEqual(get_user_model().objects.get().username, "ana@example.com")

    def test_full_name_splits_at_first_space(self):
        self.register(full_name="Ana Maria Lopez")
        user = get_user_model().objects.get()
        self.assertEqual((user.first_name, user.last_name), ("Ana", "Maria Lopez"))

    def test_duplicate_email_is_rejected_regardless_of_case(self):
        self.register()
        self.client.post("/logout/")
        response = self.register(email="ANA@example.com")
        self.assertContains(response, "An account with this email already exists.")
        self.assertEqual(get_user_model().objects.count(), 1)

    def test_weak_password_is_rejected(self):
        response = self.register(password="12345678")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "is-invalid")
        self.assertFalse(get_user_model().objects.exists())

    def test_password_resembling_the_email_is_rejected(self):
        response = self.register(email="analopez@example.com", password="analopez1")
        self.assertContains(response, "too similar")
        self.assertFalse(get_user_model().objects.exists())

    def test_terms_must_be_accepted(self):
        data = {"full_name": "Ana Lopez", "email": "ana@example.com", "password": "correct-horse-42"}
        response = self.client.post("/register/", data)
        self.assertContains(response, "You must agree to the terms")
        self.assertFalse(get_user_model().objects.exists())

    def test_password_is_not_echoed_back_after_an_error(self):
        response = self.register(email="not-an-email", password="secret-value-77")
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "secret-value-77")
        self.assertContains(response, 'value="Ana Lopez"')

    def test_logged_in_user_skips_register_page(self):
        user = get_user_model().objects.create_user("bo@example.com", "bo@example.com", "correct-horse-42")
        self.client.force_login(user)
        response = self.client.get("/register/")
        self.assertRedirects(response, "/dashboard/", fetch_redirect_response=False)