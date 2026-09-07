from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
def home(request):
    return render(request, 'home.html', {})

def login(request):
    return render(request, 'login.html', {})

@login_required
def dashboard(request):
    return render(request, 'dashboard.html', {})