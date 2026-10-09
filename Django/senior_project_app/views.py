from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login as auth_login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.views import LoginView
from django.middleware.csrf import get_token

# FOR APIs
import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.db.models import F
from django.utils import timezone
from django.utils.html import escape

from .decorators import agent_token, login_required_json
from .enrollment import active_code_for, create_enrollment_code, format_code, redeem_enrollment_code
from .forms import LoginForm, RegisterForm
from .models import Computer, Command
from django.shortcuts import render, redirect
from .forms import RegisterForm

def _save_snapshot(data, field, computer=None):
    """Store data as the latest `field` payload for the machine that sent it.

    computer is the enrolled machine a device token identified (see the
    agent_token decorator). The payload is stored on it, whatever Hostname the
    payload claims.

    Without one, the payload's Hostname picks the machine. Only machines that
    haven't enrolled can be written this way, so a request without a device
    token can never change an enrolled machine; it creates or updates a
    separate, unenrolled machine with that hostname instead.

    Returns False when the payload isn't a JSON object, or has no Hostname and
    no token says which machine sent it.
    """
    if not isinstance(data, dict):
        return False
    if computer is not None:
        # update() rather than save(), so two reports landing at once can't
        # overwrite each other's field with a stale copy.
        Computer.objects.filter(pk=computer.pk).update(**{field: data, "last_seen": timezone.now()})
        return True

    hostname = data.get("Hostname")
    if not isinstance(hostname, str) or not hostname:
        return False
    Computer.objects.update_or_create(
        hostname=hostname,
        token_hash=None,
        defaults={field: data, "last_seen": timezone.now()},
    )
    return True

def _section(computer, field):
    value = getattr(computer, field) if computer else None
    return {"has_data": bool(value), "data": value or {}}

def _visible_computers(user):
    """The machines a logged-in user may see: the ones their account owns.

    This holds for superusers too. The dashboard is the product, and admins
    see other accounts' machines only through /admin/, not in normal use.

    Every dashboard read should start from this rather than Computer.objects,
    so a hostname in the URL can never reach another account's machine.
    """
    return Computer.objects.filter(owner=user)

# ==================== MAIN/HOME STUFF ====================
def home(request):
    return render(request, 'home.html', {})

class SiteLoginView(LoginView):
    template_name = 'login.html'
    authentication_form = LoginForm
    redirect_authenticated_user = True

    def form_valid(self, form):
        response = super().form_valid(form)
        if not form.cleaned_data.get('remember'):
            # Without "Remember me", the session ends when the browser closes.
            self.request.session.set_expiry(0)
        return response

def register(request):
    if request.user.is_authenticated:
        return redirect('dashboard')

    form = RegisterForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        user = form.save()
        if user is not None:
            auth_login(request, user)
            return redirect('dashboard')
    return render(request, 'register.html', {'form': form})

def plans_view(request):
    return render(request, 'plans.html', {})

def about_us(request):
    return render(request, 'about.html', {})

def reviews(request):
    return render(request, 'user_reviews.html', {})

def contacts(request):
    return render(request, 'contacts.html', {})

def location(request):
    return render(request, 'location.html', {})

# ==================== DASHBOARD :V ====================
@login_required
def dashboard(request):
    return render(request, 'dashboard.html', {})

@login_required
def device_roll_call(request):
    return render(request, 'devices_showcase.html', {})

@login_required
def device_details(request, hostname):
    computer = get_object_or_404(Computer, hostname=hostname)
    return render(request, 'device_details.html', {"computer":computer})

@login_required
def device_results(request):
    return render(request, 'device_results.html', {})

@login_required
def individual_device(request):
    return render(request, '', {})

@login_required
def add_device(request):
    """Hands out enrollment codes and lists the user's machines."""
    if request.method == 'POST':
        create_enrollment_code(request.user)
        # Redirect so a page refresh shows the code instead of making another.
        return redirect('add_device')
    code = active_code_for(request.user)
    return render(request, 'add_device.html', {
        'code': format_code(code.code) if code else None,
        'expires_at': code.expires_at if code else None,
        'devices': _visible_computers(request.user).order_by('hostname'),
    })

@login_required
@require_POST
def remove_device(request, pk):
    """Delete one of the user's machines. Its device token stops working with it."""
    get_object_or_404(_visible_computers(request.user), pk=pk).delete()
    return redirect('add_device')
# =========================================================

@login_required_json
def agent_status(request):
    computers = _visible_computers(request.user)
    hostname = request.GET.get("hostname")
    if hostname:
        computer = computers.filter(hostname=hostname).first()
        if computer is None:
            # Same answer for "no such machine" and "not your machine", so the
            # response doesn't reveal which hostnames other accounts own.
            return JsonResponse({"error": "Unknown hostname"}, status=404)
    else:
        # No hostname: fall back to the machine that checked in most recently,
        # so callers written before per-machine storage keep working.
        computer = computers.order_by(F("last_seen").desc(nulls_last=True)).first()

    return JsonResponse({
        "hostname": computer.hostname if computer else None,
        "report": _section(computer, "latest_report"),
        "heartbeat": _section(computer, "latest_heartbeat"),
        "performance": _section(computer, "latest_performance"),
        "processes": _section(computer, "latest_processes"),
        "services": _section(computer, "latest_services"),
    })

@login_required_json
def agent_computers(request):
    computers = _visible_computers(request.user).order_by("hostname").only("hostname", "last_seen", "latest_report")
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

@csrf_exempt
def agent_enroll(request):
    """Trade a one-time enrollment code for a device token.

    Request: {"EnrollmentCode": "K7QF-2M9P", "Hostname": "LAB-PC-01"}
    Response: {"DeviceToken": "...", "Hostname": "LAB-PC-01"}

    The token is only ever sent here, once. The full contract is in
    Project-Documents/Agent-Enrollment.md.
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    code = data.get("EnrollmentCode") if isinstance(data, dict) else None
    hostname = data.get("Hostname") if isinstance(data, dict) else None
    if not isinstance(code, str) or not isinstance(hostname, str):
        return JsonResponse({"error": "EnrollmentCode and Hostname required"}, status=400)
    hostname = hostname.strip()
    if not hostname or len(hostname) > 255:
        return JsonResponse({"error": "EnrollmentCode and Hostname required"}, status=400)

    enrolled = redeem_enrollment_code(code, hostname)
    if enrolled is None:
        # Same answer for wrong, expired and already-used codes.
        return JsonResponse({"error": "Invalid or expired enrollment code"}, status=403)
    computer, token = enrolled
    return JsonResponse({"DeviceToken": token, "Hostname": computer.hostname})


# //////////////////////// Franks Testing Code ///////////////////////////////////////////////////
@csrf_exempt
@agent_token
def agent_report(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    if not _save_snapshot(data, "latest_report", request.agent_computer):
        return JsonResponse({"error": "Hostname required"}, status=400)
    print("Received agent report:", data)

    return JsonResponse({"status": "received"})

@csrf_exempt
@agent_token
def agent_heartbeat(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    if not _save_snapshot(data, "latest_heartbeat", request.agent_computer):
        return JsonResponse({"error": "Hostname required"}, status=400)
    print("Received heartbeat:", data)
    return JsonResponse({"status": "received"})

@csrf_exempt
@agent_token
def agent_performance(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    if not _save_snapshot(data, "latest_performance", request.agent_computer):
        return JsonResponse({"error": "Hostname required"}, status=400)
    print("Received performance:", data)
    return JsonResponse({"status": "received"})

@csrf_exempt
@agent_token
def agent_processes(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    if not _save_snapshot(data, "latest_processes", request.agent_computer):
        return JsonResponse({"error": "Hostname required"}, status=400)
    print("Received process report:", data)
    return JsonResponse({"status": "received"})

@csrf_exempt
@agent_token
def agent_services(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    if not _save_snapshot(data, "latest_services", request.agent_computer):
        return JsonResponse({"error": "Hostname required"}, status=400)
    print("Received service report:", data)
    return JsonResponse({"status": "received"})

@csrf_exempt
@agent_token
def agent_commands(request):
    if request.agent_computer is not None:
        hostname = request.agent_computer.hostname
        pending = list(Command.objects.filter(computer=request.agent_computer, status="pending"))
    else:
        # No token: only commands for machines that haven't enrolled, so a
        # request naming an enrolled machine's hostname can't take its commands.
        hostname = request.GET.get("hostname")
        pending = list(Command.objects.filter(
            computer__hostname=hostname, computer__token_hash__isnull=True, status="pending",
        ))

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
    ids = [c.id for c in pending]
    Command.objects.filter(id__in=ids).update(status="sent")
    return JsonResponse(result, safe=False)

@csrf_exempt
@agent_token
def agent_command_result(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    commands = Command.objects.filter(id=data["CommandId"])
    if request.agent_computer is not None:
        commands = commands.filter(computer=request.agent_computer)
    else:
        commands = commands.filter(computer__token_hash__isnull=True)
    commands.update(
        status=data["Status"],
        message=data["Message"],
        completed_at=timezone.now(),
    )
    print("Received command result:", data)
    return JsonResponse({"status": "received"})

@login_required
def debug_queue_command(request):
    if request.method != "POST":
        return HttpResponse(status=405)

    hostname = request.POST.get("hostname")
    # Only the user's own machines. A hostname that's missing, unknown, or
    # someone else's gets the same 404, and nothing is created.
    computer = get_object_or_404(_visible_computers(request.user), hostname=hostname)

    pid = request.POST.get("pid")
    command = Command.objects.create(
        computer=computer,
        command=request.POST.get("command"),
        pid=int(pid) if pid else None,
        service_name=request.POST.get("service_name") or None,
    )
    if request.POST.get("redirect"):
        return redirect("view_report")
    return JsonResponse({"queued_id": command.id})

def _queue_form(request, hostname, command, label, *, pid=None, service_name=None):
    # a small POST method, CSRF protected form that queues a command and comes back to this page
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
    csrf_input = f"<input type='hidden' name='csrfmiddlewaretoken' value='{get_token(request)}'>"
    return (
        "<form method='post' action='/debug/queue-command/' style='display:inline'>"
        f"{csrf_input}{inputs}<button type='submit'>{label}</button></form>"
    )

@login_required
def view_report(request):
    # Agent payloads are untrusted input, so everything is escaped before it
    # goes into the page.
    parts = ["<h1>Latest Agent Reports</h1>"]
    for computer in _visible_computers(request.user).order_by("hostname"):
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
                    f"<td>{_queue_form(request, hostname, 'terminate_process', 'Terminate', pid=pid)}</td></tr>"
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
                    _queue_form(request, hostname, cmd, label, service_name=name)
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