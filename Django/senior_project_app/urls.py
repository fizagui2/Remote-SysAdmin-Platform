from django.urls import path
from django.contrib.auth.views import LogoutView
from . import views

urlpatterns = [
    path('', views.home, name="home"),
<<<<<<< HEAD
    path('api/agent/report/', views.agent_report, name="agent_report"),
    path('agent/', views.view_report, name="view_report"),
]
=======
    path('login/', views.login, name="login"),
    path('plans/', views.plans_view, name="plans"),
    path('aboutus/', views.about_us, name='aboutus'),
    path('dashboard/', views.dashboard, name="dashboard"),
    path('devices/', views.device_results, name="devices"),
]
>>>>>>> oumarvi_branch
