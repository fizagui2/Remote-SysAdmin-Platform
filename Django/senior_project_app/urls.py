from django.urls import path
from django.contrib.auth.views import LogoutView
from . import views

urlpatterns = [
    path('', views.home, name="home"),
    path('login/', views.login, name="login"),
    path('plans/', views.plans_view, name="plans"),
    path('aboutus/', views.about_us, name='aboutus'),
    path('dashboard/', views.dashboard, name="dashboard"),
    path('devices/', views.device_results, name="devices"),
    path('', views.home, name="home"),
    path('api/agent/report/', views.agent_report, name="agent_report"),
    path('agent/', views.view_report, name="view_report"),
    path('api/agent/heartbeat/', views.agent_heartbeat, name="agent_heartbeat"),
    path('api/agent/performance/', views.agent_performance, name="agent_performance"),
    path('api/agent/processes/', views.agent_processes, name="agent_processes"),
]
