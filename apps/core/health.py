"""
Health Check Endpoint for Production Monitoring
"""
import logging
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger('trustfix.health')


def health_check(request):
    """
    Comprehensive health check endpoint
    Checks: Database, Redis, critical settings
    """
    status = {
        'status': 'healthy',
        'version': '1.0.0',
        'checks': {}
    }
    http_status = 200
    
    # Check Database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        status['checks']['database'] = {'status': 'ok'}
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        status['checks']['database'] = {'status': 'error', 'message': str(e)}
        status['status'] = 'unhealthy'
        http_status = 503
    
    # Check Redis/Cache
    try:
        cache.set('health_check', 'ok', 10)
        cache_value = cache.get('health_check')
        if cache_value == 'ok':
            status['checks']['cache'] = {'status': 'ok'}
        else:
            raise Exception("Cache read/write mismatch")
    except Exception as e:
        logger.error(f"Cache health check failed: {e}")
        status['checks']['cache'] = {'status': 'error', 'message': str(e)}
        status['status'] = 'unhealthy'
        http_status = 503
    
    # Check critical settings (without exposing secrets)
    critical_checks = {
        'SECRET_KEY': bool(settings.SECRET_KEY and settings.SECRET_KEY != 'django-insecure-n4k#-0fqfa67+y*sbp+r2qnqpyaj!s1@0#ap^^$9lual^j5x9o'),
        'DEBUG': not settings.DEBUG,
        'ALLOWED_HOSTS': len(settings.ALLOWED_HOSTS) > 0 and '*' not in settings.ALLOWED_HOSTS,
    }
    
    if all(critical_checks.values()):
        status['checks']['configuration'] = {'status': 'ok'}
    else:
        failed = [k for k, v in critical_checks.items() if not v]
        status['checks']['configuration'] = {
            'status': 'warning',
            'message': f'Configuration issues: {", ".join(failed)}'
        }
    
    return JsonResponse(status, status=http_status)


def readiness_check(request):
    """
    Kubernetes-style readiness check
    Returns 200 when app is ready to serve traffic
    """
    try:
        # Quick DB check
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return JsonResponse({'ready': True}, status=200)
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return JsonResponse({'ready': False, 'error': str(e)}, status=503)


def liveness_check(request):
    """
    Kubernetes-style liveness check
    Returns 200 if app is alive (even if not ready)
    """
    return JsonResponse({'alive': True}, status=200)
