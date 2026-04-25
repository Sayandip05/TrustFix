"""
Caching utilities for TrustFix
"""
from django.core.cache import cache
from functools import wraps
import hashlib
import json
from typing import Any, Callable, Optional


def cache_key(*args, **kwargs) -> str:
    """
    Generate cache key from arguments
    """
    key_data = {
        'args': args,
        'kwargs': kwargs
    }
    key_string = json.dumps(key_data, sort_keys=True, default=str)
    return hashlib.md5(key_string.encode()).hexdigest()


def cached_query(timeout: int = 300, key_prefix: str = ''):
    """
    Decorator to cache query results
    
    Args:
        timeout: Cache timeout in seconds (default: 5 minutes)
        key_prefix: Prefix for cache key
    
    Usage:
        @cached_query(timeout=600, key_prefix='tech_search')
        def search_technicians(lat, lng, service_id):
            # ... expensive query ...
            return results
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key_str = f"{key_prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"
            
            # Try to get from cache
            result = cache.get(cache_key_str)
            if result is not None:
                return result
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Cache result
            cache.set(cache_key_str, result, timeout)
            
            return result
        
        return wrapper
    return decorator


def invalidate_cache(key_pattern: str):
    """
    Invalidate cache keys matching pattern
    
    Note: This requires Redis and django-redis
    """
    try:
        from django_redis import get_redis_connection
        conn = get_redis_connection("default")
        keys = conn.keys(f"trustfix:*{key_pattern}*")
        if keys:
            conn.delete(*keys)
    except Exception:
        # Fallback: just pass if redis not available
        pass


class CacheManager:
    """
    Centralized cache management for common operations
    """
    
    # Cache timeouts
    TIMEOUT_SHORT = 60  # 1 minute
    TIMEOUT_MEDIUM = 300  # 5 minutes
    TIMEOUT_LONG = 3600  # 1 hour
    TIMEOUT_DAY = 86400  # 24 hours
    
    @staticmethod
    def get_service_categories():
        """Get cached service categories"""
        key = 'service_categories:all'
        result = cache.get(key)
        
        if result is None:
            from apps.services.models import ServiceCategory
            categories = list(ServiceCategory.objects.filter(is_active=True).values(
                'id', 'name', 'icon', 'description'
            ))
            cache.set(key, categories, CacheManager.TIMEOUT_LONG)
            return categories
        
        return result
    
    @staticmethod
    def get_technician_location(technician_id: str) -> Optional[dict]:
        """Get cached technician location"""
        key = f'tech_location:{technician_id}'
        return cache.get(key)
    
    @staticmethod
    def set_technician_location(technician_id: str, latitude: float, longitude: float, accuracy: float = None):
        """Cache technician location"""
        key = f'tech_location:{technician_id}'
        data = {
            'latitude': latitude,
            'longitude': longitude,
            'accuracy': accuracy,
        }
        cache.set(key, data, CacheManager.TIMEOUT_MEDIUM)
    
    @staticmethod
    def get_technician_stats(technician_id: str) -> Optional[dict]:
        """Get cached technician statistics"""
        key = f'tech_stats:{technician_id}'
        return cache.get(key)
    
    @staticmethod
    def set_technician_stats(technician_id: str, stats: dict):
        """Cache technician statistics"""
        key = f'tech_stats:{technician_id}'
        cache.set(key, stats, CacheManager.TIMEOUT_MEDIUM)
    
    @staticmethod
    def invalidate_technician_cache(technician_id: str):
        """Invalidate all cache for a technician"""
        keys = [
            f'tech_location:{technician_id}',
            f'tech_stats:{technician_id}',
        ]
        cache.delete_many(keys)
    
    @staticmethod
    def get_booking_cache(booking_id: str) -> Optional[dict]:
        """Get cached booking data"""
        key = f'booking:{booking_id}'
        return cache.get(key)
    
    @staticmethod
    def set_booking_cache(booking_id: str, data: dict):
        """Cache booking data"""
        key = f'booking:{booking_id}'
        cache.set(key, data, CacheManager.TIMEOUT_SHORT)
    
    @staticmethod
    def invalidate_booking_cache(booking_id: str):
        """Invalidate booking cache"""
        key = f'booking:{booking_id}'
        cache.delete(key)
    
    @staticmethod
    def get_user_bookings_cache(user_id: str, status: str = None) -> Optional[list]:
        """Get cached user bookings"""
        key = f'user_bookings:{user_id}:{status or "all"}'
        return cache.get(key)
    
    @staticmethod
    def set_user_bookings_cache(user_id: str, bookings: list, status: str = None):
        """Cache user bookings"""
        key = f'user_bookings:{user_id}:{status or "all"}'
        cache.set(key, bookings, CacheManager.TIMEOUT_SHORT)
    
    @staticmethod
    def invalidate_user_bookings_cache(user_id: str):
        """Invalidate all booking caches for a user"""
        invalidate_cache(f'user_bookings:{user_id}')
