from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
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