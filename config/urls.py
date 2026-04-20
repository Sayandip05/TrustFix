"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from apps.core.health import health_check, readiness_check, liveness_check

urlpatterns = [
    path("admin/", admin.site.urls),
    
    # Health checks (must be before api/health/ to avoid override)
    path("health/", health_check, name="health"),
    path("ready/", readiness_check, name="readiness"),
    path("live/", liveness_check, name="liveness"),
    
    # API routes
    path("api/health/", include("apps.core.urls")),
    path("api/users/", include("apps.users.urls")),
    path("api/services/", include("apps.services.urls")),
    path("api/technicians/", include("apps.technicians.urls")),
    path("api/bookings/", include("apps.bookings.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/ai/", include("apps.ai_engine.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
]
