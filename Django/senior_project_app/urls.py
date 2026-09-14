from django.urls import path
from django.contrib.auth.views import LogoutView
from . import views

urlpatterns = [
    path('', views.home, name="home"),
    path('login/', views.login, name="login"),
    path('plans/', views.plans_view, name="plans"),
    path('dashboard/', views.dashboard, name="dashboard"),
]