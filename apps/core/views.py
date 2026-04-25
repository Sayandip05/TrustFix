"""
Core views for TrustFix
- Health checks
- System status
"""
import time
from django.http import JsonResponse
from django.conf import settings
from django.core.cache import cache
from django.db import connections
from django.db.utils import OperationalError


def health_check(request):
    """
    Health check endpoint for load balancers and monitoring
    """
    start_time = time.time()
    
    checks = {
        'status': 'healthy',
        'timestamp': time.time(),
        'version': '1.0.0',
        'checks': {}
    }
    
    # Database check
    try:
        connections['default'].cursor()
        checks['checks']['database'] = {'status': 'ok'}
    except OperationalError:
        checks['checks']['database'] = {'status': 'error', 'message': 'Database connection failed'}
        checks['status'] = 'unhealthy'
    
    # Redis check
    try:
        cache.set('health_check', 'ok', timeout=10)
        cache_value = cache.get('health_check')
        if cache_value == 'ok':
            checks['checks']['redis'] = {'status': 'ok'}
        else:
            raise Exception('Cache read/write failed')
    except Exception as e:
        checks['checks']['redis'] = {'status': 'error', 'message': str(e)}
        checks['status'] = 'unhealthy'
    
    # Response time
    checks['response_time_ms'] = round((time.time() - start_time) * 1000, 2)
    
    status_code = 200 if checks['status'] == 'healthy' else 503
    return JsonResponse(checks, status=status_code)


def system_status(request):
    """
    Detailed system status (admin only in production)
    """
    import sys
    import django
    
    # Basic info
    status = {
        'django_version': django.get_version(),
        'python_version': sys.version,
        'debug_mode': settings.DEBUG,
        'allowed_hosts': settings.ALLOWED_HOSTS,
    }
    
    # Database info
    db_settings = settings.DATABASES['default']
    status['database'] = {
        'engine': db_settings['ENGINE'],
        'name': db_settings.get('NAME', 'unknown'),
        'host': db_settings.get('HOST', 'localhost'),
    }
    
    # Cache info
    status['cache'] = {
        'backend': settings.CACHES['default']['BACKEND'],
        'location': settings.CACHES['default']['LOCATION'],
    }
    
    # Installed apps
    status['installed_apps'] = settings.INSTALLED_APPS
    
    return JsonResponse(status)


def readiness_check(request):
    """
    Kubernetes readiness probe
    """
    try:
        connections['default'].cursor()
        return JsonResponse({'ready': True})
    except OperationalError:
        return JsonResponse({'ready': False}, status=503)


def liveness_check(request):
    """
    Kubernetes liveness probe
    """
    return JsonResponse({'alive': True})
