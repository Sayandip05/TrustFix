"""
WebSocket URL routing for TrustFix
"""
from django.urls import path
from apps.bookings.consumers import BookingTrackingConsumer, TechnicianLocationConsumer

websocket_urlpatterns = [
    # Real-time booking tracking for customers
    path('ws/bookings/<uuid:booking_id>/track/', BookingTrackingConsumer.as_asgi()),
    
    # Real-time location updates for technicians
    path('ws/technicians/location/', TechnicianLocationConsumer.as_asgi()),
]
