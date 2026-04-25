"""
Tests for Core App
"""

from django.test import TestCase, RequestFactory
from django.http import JsonResponse
from django.core.cache import cache
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
import time

from apps.core.middleware import (
    RequestLoggingMiddleware,
    RateLimitMiddleware,
    SecurityHeadersMiddleware,
    JWTAuthMiddleware,
    CORSMiddleware,
    MaintenanceModeMiddleware,
    UserActivityMiddleware,
)
from apps.core.exceptions import (
    custom_exception_handler,
    TrustFixException,
    BookingException,
    PaymentException,
    AuthenticationException,
    PermissionException,
    RateLimitException,
    ValidationException,
)
from apps.core import security
from apps.core import cache as core_cache


User = get_user_model()


class MiddlewareTestCase(TestCase):
    """Test Core Middleware"""

    def setUp(self):
        self.factory = RequestFactory()

    def test_request_logging_middleware(self):
        """Test request logging middleware"""
        middleware = RequestLoggingMiddleware(lambda req: JsonResponse({}))

        request = self.factory.get("/api/test/")
        request.user = MagicMock()
        request.user.is_authenticated = False

        middleware.process_request(request)

        self.assertTrue(hasattr(request, "start_time"))
        self.assertTrue(hasattr(request, "request_id"))

        response = middleware.process_response(request, JsonResponse({}))

        self.assertEqual(response["X-Request-ID"], request.request_id)

    def test_security_headers_middleware(self):
        """Test security headers are added"""
        middleware = SecurityHeadersMiddleware(lambda req: JsonResponse({}))

        request = self.factory.get("/api/test/")
        response = JsonResponse({})

        processed = middleware.process_response(request, response)

        self.assertEqual(response["X-Frame-Options"], "DENY")
        self.assertEqual(response["X-Content-Type-Options"], "nosniff")
        self.assertEqual(response["X-XSS-Protection"], "1; mode=block")
        self.assertEqual(response["Referrer-Policy"], "strict-origin-when-cross-origin")
        self.assertIn("Content-Security-Policy", response)

    def test_rate_limit_middleware_anon(self):
        """Test rate limiting for anonymous users"""
        middleware = RateLimitMiddleware(lambda req: JsonResponse({}))

        request = self.factory.get("/api/test/")
        request.user = MagicMock()
        request.user.is_authenticated = False

        cache.clear()

        for i in range(99):
            result = middleware.process_request(request)
            self.assertIsNone(result)

        result = middleware.process_request(request)
        self.assertIsNotNone(result)
        self.assertEqual(result.status_code, 429)

    def test_rate_limit_middleware_authenticated(self):
        """Test rate limiting for authenticated users"""
        middleware = RateLimitMiddleware(lambda req: JsonResponse({}))

        user = User.objects.create_user(
            phone="+919999999999", name="Test", user_type="customer"
        )

        request = self.factory.get("/api/test/")
        request.user = user

        cache.clear()

        for i in range(999):
            result = middleware.process_request(request)
            self.assertIsNone(result)

        result = middleware.process_request(request)
        self.assertIsNotNone(result)
        self.assertEqual(result.status_code, 429)

    def test_rate_limit_skip_admin(self):
        """Test rate limiting is skipped for admin paths"""
        middleware = RateLimitMiddleware(lambda req: JsonResponse({}))

        request = self.factory.get("/admin/")
        request.user = MagicMock()
        request.user.is_authenticated = False

        result = middleware.process_request(request)
        self.assertIsNone(result)

    def test_maintenance_mode_middleware(self):
        """Test maintenance mode blocks requests"""
        with self.settings(MAINTENANCE_MODE=True):
            middleware = MaintenanceModeMiddleware(lambda req: JsonResponse({}))

            request = self.factory.get("/api/test/")
            request.user = MagicMock()
            request.user.is_authenticated = False
            request.user.is_staff = False

            result = middleware.process_request(request)

            self.assertIsNotNone(result)
            self.assertEqual(result.status_code, 503)

    def test_maintenance_mode_allows_staff(self):
        """Test maintenance mode allows staff users"""
        with self.settings(MAINTENANCE_MODE=True):
            middleware = MaintenanceModeMiddleware(lambda req: JsonResponse({}))

            staff_user = User.objects.create_user(
                phone="+919999999998", name="Staff", user_type="admin", is_staff=True
            )

            request = self.factory.get("/api/test/")
            request.user = staff_user

            result = middleware.process_request(request)
            self.assertIsNone(result)


class ExceptionHandlerTestCase(TestCase):
    """Test custom exception handler"""

    def test_trust_fix_exception(self):
        """Test TrustFixException"""
        exc = TrustFixException("Test error", "test_code")
        self.assertEqual(exc.message, "Test error")
        self.assertEqual(exc.code, "test_code")
        self.assertEqual(exc.status_code, 400)

    def test_booking_exception(self):
        """Test BookingException"""
        exc = BookingException("Booking failed")
        self.assertEqual(exc.default_message, "Booking error")
        self.assertEqual(exc.status_code, 400)

    def test_payment_exception(self):
        """Test PaymentException"""
        exc = PaymentException("Payment failed")
        self.assertEqual(exc.default_message, "Payment error")

    def test_authentication_exception(self):
        """Test AuthenticationException"""
        exc = AuthenticationException()
        self.assertEqual(exc.status_code, 401)

    def test_permission_exception(self):
        """Test PermissionException"""
        exc = PermissionException()
        self.assertEqual(exc.status_code, 403)

    def test_rate_limit_exception(self):
        """Test RateLimitException"""
        exc = RateLimitException()
        self.assertEqual(exc.status_code, 429)

    def test_validation_exception(self):
        """Test ValidationException"""
        exc = ValidationException("Invalid input")
        self.assertEqual(exc.message, "Invalid input")


class SecurityTestCase(TestCase):
    """Test security utilities"""

    def test_sanitize_html_none(self):
        """Test sanitize HTML with no tags"""
        result = security.sanitize_html("Plain text", allowed_tags=[])
        self.assertEqual(result, "Plain text")

    def test_sanitize_html_with_tags(self):
        """Test sanitize HTML with allowed tags"""
        result = security.sanitize_html("<b>Bold</b>", allowed_tags=["b"])
        self.assertEqual(result, "<b>Bold</b>")

    def test_sanitize_html_removes_dangerous(self):
        """Test dangerous HTML is removed"""
        result = security.sanitize_html(
            "<script>alert('xss')</script><b>Bold</b>", allowed_tags=["b"]
        )
        self.assertNotIn("<script>", result)
        self.assertIn("<b>", result)

    def test_sanitize_user_input(self):
        """Test sanitize user input"""
        result = security.sanitize_user_input("<b>Test</b> & <script>")
        self.assertEqual(result.strip(), "Test")

    def test_validate_phone_valid(self):
        """Test valid phone numbers"""
        self.assertEqual(security.validate_phone_number("9876543210"), "+919876543210")
        self.assertEqual(
            security.validate_phone_number("919876543210"), "+919876543210"
        )
        self.assertEqual(
            security.validate_phone_number("+919876543210"), "+919876543210"
        )

    def test_validate_phone_invalid(self):
        """Test invalid phone numbers"""
        self.assertIsNone(security.validate_phone_number("1234567890"))
        self.assertIsNone(security.validate_phone_number("123"))

    def test_mask_phone_number(self):
        """Test phone number masking"""
        result = security.mask_phone_number("+919876543210")
        self.assertEqual(result, "+91XXXXX43210")

    def test_mask_email(self):
        """Test email masking"""
        result = security.mask_email("user@example.com")
        self.assertEqual(result, "u***@example.com")

    def test_validate_uuid_valid(self):
        """Test valid UUID"""
        import uuid

        valid_uuid = str(uuid.uuid4())
        self.assertTrue(security.validate_uuid(valid_uuid))

    def test_validate_uuid_invalid(self):
        """Test invalid UUID"""
        self.assertFalse(security.validate_uuid("not-a-uuid"))
        self.assertFalse(security.validate_uuid("123"))

    def test_check_sql_injection_detects(self):
        """Test SQL injection detection"""
        self.assertTrue(security.check_sql_injection("'; DROP TABLE users; --"))
        self.assertTrue(security.check_sql_injection("1 OR 1=1"))
        self.assertTrue(security.check_sql_injection("UNION SELECT * FROM passwords"))

    def test_check_sql_injection_safe(self):
        """Test safe inputs pass"""
        self.assertFalse(security.check_sql_injection("Normal text"))
        self.assertFalse(security.check_sql_injection("Hello World"))

    def test_rate_limit_key(self):
        """Test rate limit key generation"""
        key = security.rate_limit_key("user123", "otp")
        self.assertIn("rate_limit", key)
        self.assertIn("user123", key)
        self.assertIn("otp", key)


class CacheManagerTestCase(TestCase):
    """Test cache utilities"""

    def setUp(self):
        cache.clear()

    def test_cache_key_generation(self):
        """Test cache key generation"""
        key = core_cache.cache_key("arg1", "arg2", kwarg1="value")
        self.assertIsInstance(key, str)
        self.assertEqual(len(key), 32)

    def test_cached_query_decorator(self):
        """Test cached query decorator"""
        call_count = 0

        @core_cache.cached_query(timeout=60, key_prefix="test")
        def expensive_function():
            nonlocal call_count
            call_count += 1
            return "result"

        result1 = expensive_function()
        self.assertEqual(call_count, 1)

        result2 = expensive_function()
        self.assertEqual(call_count, 1)
        self.assertEqual(result1, result2)

    def test_cache_manager_service_categories(self):
        """Test get_service_categories from cache"""
        from apps.services.models import ServiceCategory

        ServiceCategory.objects.create(name="Test Service", is_active=True)

        result = core_cache.CacheManager.get_service_categories()
        self.assertIsInstance(result, list)

    def test_cache_manager_technician_location(self):
        """Test technician location caching"""
        core_cache.CacheManager.set_technician_location("tech123", 22.5, 88.5, 10.0)

        result = core_cache.CacheManager.get_technician_location("tech123")
        self.assertIsNotNone(result)
        self.assertEqual(result["latitude"], 22.5)
        self.assertEqual(result["longitude"], 88.5)

    def test_cache_manager_booking_cache(self):
        """Test booking cache"""
        core_cache.CacheManager.set_booking_cache("booking123", {"status": "pending"})

        result = core_cache.CacheManager.get_booking_cache("booking123")
        self.assertIsNotNone(result)
        self.assertEqual(result["status"], "pending")

    def test_cache_manager_invalidate(self):
        """Test cache invalidation"""
        core_cache.CacheManager.set_booking_cache("booking123", {"status": "pending"})
        core_cache.CacheManager.invalidate_booking_cache("booking123")

        result = core_cache.CacheManager.get_booking_cache("booking123")
        self.assertIsNone(result)


class CoreViewsTestCase(TestCase):
    """Test core views"""

    def test_health_check_healthy(self):
        """Test health check when healthy"""
        from apps.core.views import health_check

        request = self.factory.get("/health/")

        response = health_check(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "healthy")

    def test_health_check_unhealthy(self):
        """Test health check when unhealthy"""
        from django.db import connections
        from django.conf import settings

        with self.settings(
            DATABASES={
                "default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}
            }
        ):
            from apps.core.views import health_check

            request = self.factory.get("/health/")

            response = health_check(request)

            self.assertEqual(response.status_code, 503)

    def test_readiness_check(self):
        """Test readiness check"""
        from apps.core.views import readiness_check

        request = self.factory.get("/ready/")

        response = readiness_check(request)

        self.assertEqual(response.status_code, 200)

    def test_liveness_check(self):
        """Test liveness check"""
        from apps.core.views import liveness_check

        request = self.factory.get("/live/")

        response = liveness_check(request)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["alive"])

    def setUp(self):
        self.factory = RequestFactory()
