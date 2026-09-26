from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login as auth_login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.views import LoginView

# FOR APIs
import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import F
from django.utils import timezone
from django.utils.html import escape

from .models import Computer

# Commands are still held in memory. Agent snapshots are stored per machine
# on the Computer model.
pending_commands = []
command_history = {}

def _save_snapshot(data, field):
    """Store data as the latest `field` payload for the machine that sent it.

    Returns False when the payload has no Hostname, since there is no machine
    to store it under.
    """
    hostname = data.get("Hostname") if isinstance(data, dict) else None
    if not isinstance(hostname, str) or not hostname:
        return False
    Computer.objects.update_or_create(
        hostname=hostname,
        defaults={field: data, "last_seen": timezone.now()},
    )
    return True

def _section(computer, field):
    value = getattr(computer, field) if computer else None
    return {"has_data": bool(value), "data": value or {}}

# ==================== MAIN/HOME STUFF ====================
def home(request):
    return render(request, 'home.html', {})

def login(request):
    return render(request, 'login.html', {})

def register(request):
    return render(request, 'register.html', {})

def plans_view(request):
    return render(request, 'plans.html', {})

def about_us(request):
    return render(request, 'about.html', {})

# ==================== DASHBOARD SHIT ====================
# @login_required
def dashboard(request):
    return render(request, 'dashboard.html', {})

def device_roll_call(request):
    return render(request, 'devices_showcase.html', {})

def device_results(request):
    return render(request, 'device_results.html', {})

def individual_device(request):
    return render(request, '', {})
# =========================================================

def agent_status(request):
    hostname = request.GET.get("hostname")
    if hostname:
        computer = Computer.objects.filter(hostname=hostname).first()
        if computer is None:
            return JsonResponse({"error": "Unknown hostname"}, status=404)
    else:
        # No hostname: fall back to the machine that checked in most recently,
        # so callers written before per-machine storage keep working.
        computer = Computer.objects.order_by(F("last_seen").desc(nulls_last=True)).first()

    return JsonResponse({
        "hostname": computer.hostname if computer else None,
        "report": _section(computer, "latest_report"),
        "heartbeat": _section(computer, "latest_heartbeat"),
        "performance": _section(computer, "latest_performance"),
        "processes": _section(computer, "latest_processes"),
        "services": _section(computer, "latest_services"),
    })

def agent_computers(request):
    computers = Computer.objects.order_by("hostname").only("hostname", "last_seen", "latest_report")
    return JsonResponse({
        "computers": [
            {
                "hostname": computer.hostname,
                "last_seen": computer.last_seen,
                "report": computer.latest_report,
            }
            for computer in computers
        ]
    })


# //////////////////////// Franks Testing Code ///////////////////////////////////////////////////
@csrf_exempt
def agent_report(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    if not _save_snapshot(data, "latest_report"):
        return JsonResponse({"error": "Hostname required"}, status=400)
    print("Received agent report:", data)

    return JsonResponse({"status": "received"})

@csrf_exempt
def agent_heartbeat(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    if not _save_snapshot(data, "latest_heartbeat"):
        return JsonResponse({"error": "Hostname required"}, status=400)
    print("Received heartbeat:", data)
    return JsonResponse({"status": "received"})

@csrf_exempt
def agent_performance(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    if not _save_snapshot(data, "latest_performance"):
        return JsonResponse({"error": "Hostname required"}, status=400)
    print("Received performance:", data)
    return JsonResponse({"status": "received"})

@csrf_exempt
def agent_processes(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    if not _save_snapshot(data, "latest_processes"):
        return JsonResponse({"error": "Hostname required"}, status=400)
    print("Received process report:", data)
    return JsonResponse({"status": "received"})

@csrf_exempt
def agent_services(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    if not _save_snapshot(data, "latest_services"):
        return JsonResponse({"error": "Hostname required"}, status=400)
    print("Received service report:", data)
    return JsonResponse({"status": "received"})

@csrf_exempt
def agent_commands(request):
    global pending_commands
    hostname = request.GET.get("hostname")
    matching = [c for c in pending_commands if c.get("Hostname") == hostname]
    pending_commands = [c for c in pending_commands if c.get("Hostname") != hostname]
    return JsonResponse(matching, safe=False)

@csrf_exempt
def agent_command_result(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    command_history[data["CommandId"]] = data
    print("Received command result:", data)
    return JsonResponse({"status": "received"})

def debug_queue_command(request):
    command = {
        "CommandId": len(pending_commands) + len(command_history) + 1,
        "Command": request.GET.get("command"),
        "Hostname": request.GET.get("hostname"),
    }
    if request.GET.get("pid"):
        command["Pid"] = int(request.GET.get("pid"))
    if request.GET.get("service_name"):
        command["ServiceName"] = request.GET.get("service_name")
    pending_commands.append(command)
    return JsonResponse({"queued": command})

def view_report(request):
    # Agent payloads are untrusted input, so everything is escaped before it
    # goes into the page.
    parts = ["<h1>Latest Agent Reports</h1>"]
    for computer in Computer.objects.order_by("hostname"):
        parts.append(f"<h2>{escape(computer.hostname)}</h2><p>Last seen: {computer.last_seen}</p>")
        for label, field in (
            ("System Info", "latest_report"),
            ("Heartbeat", "latest_heartbeat"),
            ("Performance", "latest_performance"),
            ("Processes", "latest_processes"),
            ("Services", "latest_services"),
        ):
            parts.append(f"<h3>{label}</h3><pre>{escape(getattr(computer, field))}</pre>")
    parts.append(f"<h2>Pending Commands</h2><pre>{escape(pending_commands)}</pre>")
    parts.append(f"<h2>Command History</h2><pre>{escape(command_history)}</pre>")
    return HttpResponse("".join(parts))
# //////////////////////// Franks Testing Code ///////////////////////////////////////////////////