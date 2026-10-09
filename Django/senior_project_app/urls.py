from django.urls import path
from django.contrib.auth.views import LogoutView
from . import views

urlpatterns = [
    path('', views.home, name="home"),
    path('login/', views.SiteLoginView.as_view(), name="login"),
    path('logout/', LogoutView.as_view(), name="logout"),
    path('register/', views.register, name="register"),
    path('plans/', views.plans_view, name="plans"),
    path('aboutus/', views.about_us, name="aboutus"),
    path('contacts/', views.contacts, name="contacts"),
    path('dashboard/', views.dashboard, name="dashboard"),
    path('devices/', views.device_results, name="devices"),
    path('offices/', views.location, name="offices"),
    path('device-details-<str:hostname>/', views.device_details, name="device_details"),
    path('device-ind/', views.individual_device, name="individual_device"),
    path('add-device/', views.add_device, name="add_device"),
    path('devices/<int:pk>/remove/', views.remove_device, name="remove_device"),
    path('', views.home, name="home"),
    path('api/agent/status/', views.agent_status, name="agent_status"),
    path('api/agent/computers/', views.agent_computers, name="agent_computers"),
    # need to check with Franks to see API
    path('api/agent/enroll/', views.agent_enroll, name="agent_enroll"),
    path('api/agent/report/', views.agent_report, name="agent_report"),

# ///////////////////Franks Testing URL's////////////////////////////////////
    path('agent/', views.view_report, name="view_report"),
    path('api/agent/heartbeat/', views.agent_heartbeat, name="agent_heartbeat"),
    path('api/agent/performance/', views.agent_performance, name="agent_performance"),
    path('api/agent/processes/', views.agent_processes, name="agent_processes"),
    path('api/agent/services/', views.agent_services, name="agent_services"),
    path('api/agent/commands/', views.agent_commands, name="agent_commands"),
    path('api/agent/commands/result/', views.agent_command_result, name="agent_command_result"),
    path('debug/queue-command/', views.debug_queue_command, name="debug_queue_command"),
# ///////////////////Franks Testing URL's////////////////////////////////////
]