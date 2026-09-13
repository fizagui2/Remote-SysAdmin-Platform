from django.urls import path
from django.contrib.auth.views import LogoutView
from . import views

urlpatterns = [
    path('', views.home, name="home"),
    path('api/agent/report/', views.agent_report, name="agent_report"),
    path('agent/', views.view_report, name="view_report"),
]