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

# Models & Forms
from .models import Computer, Command
from django.shortcuts import render, redirect
from .forms import RegisterForm

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
    if request.method == "POST":
        form = RegisterForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("login")
    else:
        form = RegisterForm()
    return render(request, 'register.html', {"form":form})

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
    hostname = request.GET.get("hostname")
    pending = Command.objects.filter(computer__hostname=hostname, status="pending")

    result = [
        {
            "CommandId": c.id,
            "Command": c.command,
            "Hostname": hostname,
            "Pid": c.pid,
            "ServiceName": c.service_name,
        }
        for c in pending
    ]
    pending.update(status="sent")
    return JsonResponse(result, safe=False)

@csrf_exempt
def agent_command_result(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    Command.objects.filter(id=data["CommandId"]).update(
        status=data["Status"],
        message=data["Message"],
        completed_at=timezone.now(),
    )
    print("Received command result:", data)
    return JsonResponse({"status": "received"})

def debug_queue_command(request):
    hostname = request.GET.get("hostname")
    computer, _ = Computer.objects.get_or_create(hostname=hostname)

    pid = request.GET.get("pid")
    command = Command.objects.create(
        computer=computer,
        command=request.GET.get("command"),
        pid=int(pid) if pid else None,
        service_name=request.GET.get("service_name") or None,
    )
    if request.GET.get("redirect"):
        return redirect("view_report")
    return JsonResponse({"queued_id": command.id})

def _queue_form(hostname, command, label, *, pid=None, service_name=None):
    #a small get method form that queues a command and comes back to this page
    hidden = [
        ("hostname", hostname),
        ("command", command),
        ("pid", pid),
        ("service_name", service_name),
        ("redirect", "1"),
    ]
    inputs = "".join(
        f"<input type='hidden' name='{name}' value='{escape(str(value))}'>"
        for name, value in hidden
        if value is not None
    )
    return (
        "<form method='get' action='/debug/queue-command/' style='display:inline'>"
        f"{inputs}<button type='submit'>{label}</button></form>"
    )

def view_report(request):
    # Agent payloads are untrusted input, so everything is escaped before it
    # goes into the page.
    parts = ["<h1>Latest Agent Reports</h1>"]
    for computer in Computer.objects.order_by("hostname"):
        hostname = computer.hostname
        parts.append(f"<h2>{escape(hostname)}</h2><p>Last seen: {computer.last_seen}</p>")
        for label, field in (
            ("System Info", "latest_report"),
            ("Heartbeat", "latest_heartbeat"),
            ("Performance", "latest_performance"),
        ):
            parts.append(f"<h3>{label}</h3><pre>{escape(getattr(computer, field))}</pre>")

        parts.append("<h3>Processes</h3>")
        processes = (computer.latest_processes or {}).get("Processes", [])
        if processes:
            parts.append("<table border='1' cellpadding='4'><tr><th>Name</th><th>PID</th><th>Memory (MB)</th><th></th></tr>")
            for p in processes:
                pid = p.get("Pid")
                parts.append(
                    f"<tr><td>{escape(str(p.get('Name')))}</td><td>{escape(str(pid))}</td>"
                    f"<td>{escape(str(p.get('MemoryMb')))}</td>"
                    f"<td>{_queue_form(hostname, 'terminate_process', 'Terminate', pid=pid)}</td></tr>"
                )
            parts.append("</table>")
        else:
            parts.append("<p>No process data yet.</p>")

        parts.append("<h3>Services</h3>")
        services = (computer.latest_services or {}).get("Services", [])
        if services:
            parts.append("<table border='1' cellpadding='4'><tr><th>Name</th><th>Display Name</th><th>Status</th><th></th></tr>")
            for s in services:
                name = s.get("Name")
                buttons = "".join(
                    _queue_form(hostname, cmd, label, service_name=name)
                    for cmd, label in (
                        ("start_service", "Start"),
                        ("stop_service", "Stop"),
                        ("restart_service", "Restart"),
                    )
                )
                parts.append(
                    f"<tr><td>{escape(str(name))}</td><td>{escape(str(s.get('DisplayName')))}</td>"
                    f"<td>{escape(str(s.get('Status')))}</td><td>{buttons}</td></tr>"
                )
            parts.append("</table>")
        else:
            parts.append("<p>No service data yet.</p>")

        commands = list(computer.commands.order_by("-created_at")[:10].values())
        parts.append(f"<h3>Recent Commands</h3><pre>{escape(commands)}</pre>")
    return HttpResponse("".join(parts))
# //////////////////////// Franks Testing Code ///////////////////////////////////////////////////