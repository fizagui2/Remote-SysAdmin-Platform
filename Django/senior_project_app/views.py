from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt

latest_report = {}

def home(request):
    return render(request, 'home.html', {})

def login(request):
    return render(request, 'login.html', {})

@login_required
def dashboard(request):
    return render(request, 'dashboard.html', {})

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

def view_report(request):
    return HttpResponse(f"<h1>Latest Agent Report</h1><pre>{latest_report}</pre>")