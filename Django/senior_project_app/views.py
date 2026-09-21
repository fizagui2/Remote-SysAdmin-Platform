from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt

def home(request):
    return render(request, 'home.html', {})

def login(request):
    return render(request, 'login.html', {})

def plans_view(request):
    return render(request, 'plans.html', {})

def about_us(request):
    return render(request, 'about.html', {})

def device_results(request):
    return render(request, 'device_results.html', {})

# @login_required
def dashboard(request):
    return render(request, 'dashboard.html', {})

def agent_status(request):
    return JsonResponse({
        "report": {
            "has_data": bool(latest_report),
            "data": latest_report
        },
        "heartbeat": {
            "has_data": bool(latest_heartbeat),
            "data": latest_heartbeat
        },
        "performance": {
            "has_data": bool(latest_performance),
            "data": latest_performance
        },
        "processes": {
            "has_data": bool(latest_processes),
            "data": latest_processes
        }
    })

@csrf_exempt
def agent_report(request):
    global latest_report
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    latest_report = data
    print("Received agent report:", data)

    return JsonResponse({"status": "received"})

@csrf_exempt
def agent_heartbeat(request):
    global latest_heartbeat
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    latest_heartbeat = data
    print("Received heartbeat:", data)
    return JsonResponse({"status": "received"})

@csrf_exempt
def agent_performance(request):
    global latest_performance
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    latest_performance = data
    print("Received performance:", data)
    return JsonResponse({"status": "received"})

@csrf_exempt
def agent_processes(request):
    global latest_processes
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    latest_processes = data
    print("Received process report:", data)
    return JsonResponse({"status": "received"})

def view_report(request):
    return HttpResponse(
        "<h1>Latest Agent Report</h1>"
        f"<h2>System Info</h2><pre>{latest_report}</pre>"
        f"<h2>Heartbeat</h2><pre>{latest_heartbeat}</pre>"
        f"<h2>Performance</h2><pre>{latest_performance}</pre>"
        f"<h2>Processes</h2><pre>{latest_processes}</pre>"
    )