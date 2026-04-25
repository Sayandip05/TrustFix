"""
Core Middleware for TrustFix
- Request/Response logging
- JWT Authentication enhancement
- Rate limiting
- Security headers
"""
import time
import uuid
import logging
from typing import Optional

from django.http import JsonResponse
from django.conf import settings
from django.core.cache import cache
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('trustfix.request')


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Log all API requests with timing and metadata
    """
    def process_request(self, request):
        request.start_time = time.time()
        request.request_id = str(uuid.uuid4())[:8]
        
        # Add request ID to request for use in views
        request.id = request.request_id
        
        # Log request
        logger.info(
            f"[{request.request_id}] {request.method} {request.path} - "
            f"IP: {self._get_client_ip(request)} - "
            f"User: {request.user if hasattr(request, 'user') and request.user.is_authenticated else 'Anonymous'}"
        )
        
        return None
    
    def process_response(self, request, response):
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            response['X-Request-ID'] = getattr(request, 'request_id', 'unknown')
            response['X-Response-Time'] = f"{duration:.3f}s"
            
            # Log response
            logger.info(
                f"[{getattr(request, 'request_id', 'unknown')}] "
                f"{request.method} {request.path} - "
                f"Status: {response.status_code} - "
                f"Duration: {duration:.3f}s"
            )
        
        return response
    
    def _get_client_ip(self, request):
        """Get client IP from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip or 'unknown'


class RateLimitMiddleware(MiddlewareMixin):
    """
    Rate limiting middleware using Redis cache
    Limits: 100 requests per minute per IP, 1000 per authenticated user
    """
    def process_request(self, request):
        # Skip rate limiting for admin and health checks
        if request.path.startswith('/admin/') or request.path == '/health/':
            return None
        
        # Get identifier (user ID if authenticated, else IP)
        if request.user.is_authenticated:
            identifier = f"user:{request.user.id}"
            limit = 1000  # 1000 requests per minute for authenticated users
        else:
            identifier = f"ip:{self._get_client_ip(request)}"
            limit = 100  # 100 requests per minute for anonymous
        
        cache_key = f"rate_limit:{identifier}:{int(time.time()) // 60}"
        
        # Get current count
        current = cache.get(cache_key, 0)
        
        if current >= limit:
            logger.warning(f"Rate limit exceeded for {identifier}")
            return JsonResponse({
                'error': 'Rate limit exceeded',
                'retry_after': 60
            }, status=429)
        
        # Increment count
        cache.set(cache_key, current + 1, 60)  # Expire in 60 seconds
        
        return None
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Add security headers to all responses
    """
    def process_response(self, request, response):
        # Prevent clickjacking
        response['X-Frame-Options'] = 'DENY'
        
        # Prevent MIME type sniffing
        response['X-Content-Type-Options'] = 'nosniff'
        
        # XSS Protection
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Referrer Policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # HSTS (only in production)
        if not settings.DEBUG:
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # Content Security Policy (CSP)
        csp = "default-src 'self'; "
        csp += "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        csp += "style-src 'self' 'unsafe-inline'; "
        csp += "img-src 'self' data: https:; "
        csp += "font-src 'self'; "
        csp += "connect-src 'self' https:;"
        response['Content-Security-Policy'] = csp
        
        return response


class JWTAuthMiddleware(MiddlewareMixin):
    """
    Enhanced JWT authentication middleware
    - Validates tokens from cookies or Authorization header
    - Refreshes tokens automatically if close to expiry
    """
    def process_request(self, request):
        from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
        from rest_framework_simplejwt.exceptions import TokenError
        
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        # Try to get token from header first
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        else:
            # Try to get from cookies
            token = request.COOKIES.get('access_token')
        
        if token:
            try:
                # Validate token
                access_token = AccessToken(token)
                request.user_id = access_token['user_id']
                request.token_expiry = access_token['exp']
                
                # Check if token needs refresh (expires in < 5 minutes)
                import datetime
                now = datetime.datetime.now().timestamp()
                if request.token_expiry - now < 300:  # 5 minutes
                    request.should_refresh_token = True
                
            except TokenError as e:
                logger.warning(f"Invalid token: {e}")
                request.auth_error = str(e)
        
        return None
    
    def process_response(self, request, response):
        # Add new access token to cookies if refreshed
        if hasattr(request, 'new_access_token'):
            response.set_cookie(
                'access_token',
                request.new_access_token,
                max_age=3600,  # 1 hour
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax'
            )
        
        return response


class CORSMiddleware(MiddlewareMixin):
    """
    Custom CORS middleware for fine-grained control
    """
    def process_request(self, request):
        if request.method == 'OPTIONS':
            response = JsonResponse({}, status=200)
            self._add_cors_headers(response, request)
            return response
        return None
    
    def process_response(self, request, response):
        self._add_cors_headers(response, request)
        return response
    
    def _add_cors_headers(self, response, request):
        allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        origin = request.META.get('HTTP_ORIGIN')
        
        if origin in allowed_origins or settings.DEBUG:
            response['Access-Control-Allow-Origin'] = origin or '*'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Request-ID'
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Max-Age'] = '86400'


class MaintenanceModeMiddleware(MiddlewareMixin):
    """
    Maintenance mode middleware - blocks all requests except admin
    """
    def process_request(self, request):
        if getattr(settings, 'MAINTENANCE_MODE', False):
            if not request.path.startswith('/admin/'):
                if request.user.is_authenticated and request.user.is_staff:
                    return None
                
                return JsonResponse({
                    'error': 'Service temporarily unavailable for maintenance',
                    'retry_after': 3600
                }, status=503)
        return None


class UserActivityMiddleware(MiddlewareMixin):
    """
    Track user activity and update last seen
    """
    def process_response(self, request, response):
        if request.user.is_authenticated:
            cache_key = f"user_activity:{request.user.id}"
            
            # Only update every 5 minutes to reduce DB writes
            if not cache.get(cache_key):
                from apps.users.models import User
                User.objects.filter(id=request.user.id).update(
                    last_seen=timezone.now()
                )
                cache.set(cache_key, True, 300)  # 5 minutes
        
        return response


# Import timezone at the end to avoid circular imports
from django.utils import timezone
