from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('health/', views.health_check, name='health'),
    path('health/ready/', views.readiness_check, name='readiness'),
    path('health/live/', views.liveness_check, name='liveness'),
    path('status/', views.system_status, name='status'),
]
