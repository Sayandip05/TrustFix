"""
Custom exception handlers and error responses for TrustFix
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
import logging

logger = logging.getLogger('trustfix.exceptions')


def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF
    
    Returns standardized error responses:
    {
        "error": {
            "code": 400,
            "message": "Error message",
            "details": {...}
        }
    }
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # If DRF didn't handle it, handle Django exceptions
    if response is None:
        if isinstance(exc, DjangoValidationError):
            response = Response(
                {
                    'error': {
                        'code': status.HTTP_400_BAD_REQUEST,
                        'message': 'Validation error',
                        'details': exc.message_dict if hasattr(exc, 'message_dict') else str(exc)
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        elif isinstance(exc, Http404):
            response = Response(
                {
                    'error': {
                        'code': status.HTTP_404_NOT_FOUND,
                        'message': 'Resource not found',
                        'details': str(exc)
                    }
                },
                status=status.HTTP_404_NOT_FOUND
            )
        else:
            # Log unexpected errors
            logger.error(f"Unhandled exception: {exc}", exc_info=True)
            response = Response(
                {
                    'error': {
                        'code': status.HTTP_500_INTERNAL_SERVER_ERROR,
                        'message': 'Internal server error',
                        'details': str(exc) if settings.DEBUG else 'An error occurred'
                    }
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # Standardize DRF error responses
    if response is not None:
        custom_response = {
            'error': {
                'code': response.status_code,
                'message': get_error_message(exc, response),
                'details': response.data
            }
        }
        response.data = custom_response
    
    return response


def get_error_message(exc, response):
    """Extract a user-friendly error message"""
    # Try to get message from exception
    if hasattr(exc, 'detail'):
        if isinstance(exc.detail, dict):
            # Get first error message
            for key, value in exc.detail.items():
                if isinstance(value, list):
                    return value[0] if value else str(exc)
                return str(value)
        return str(exc.detail)
    
    # Default messages by status code
    status_messages = {
        400: 'Bad request',
        401: 'Authentication required',
        403: 'Permission denied',
        404: 'Resource not found',
        405: 'Method not allowed',
        429: 'Too many requests',
        500: 'Internal server error',
        503: 'Service unavailable',
    }
    
    return status_messages.get(response.status_code, 'An error occurred')


# Custom exceptions

class TrustFixException(Exception):
    """Base exception for TrustFix"""
    default_message = 'An error occurred'
    default_code = 'error'
    status_code = status.HTTP_400_BAD_REQUEST
    
    def __init__(self, message=None, code=None):
        self.message = message or self.default_message
        self.code = code or self.default_code
        super().__init__(self.message)


class BookingException(TrustFixException):
    """Booking-related exceptions"""
    default_message = 'Booking error'
    default_code = 'booking_error'


class PaymentException(TrustFixException):
    """Payment-related exceptions"""
    default_message = 'Payment error'
    default_code = 'payment_error'


class AuthenticationException(TrustFixException):
    """Authentication-related exceptions"""
    default_message = 'Authentication failed'
    default_code = 'auth_error'
    status_code = status.HTTP_401_UNAUTHORIZED


class PermissionException(TrustFixException):
    """Permission-related exceptions"""
    default_message = 'Permission denied'
    default_code = 'permission_error'
    status_code = status.HTTP_403_FORBIDDEN


class RateLimitException(TrustFixException):
    """Rate limit exceeded"""
    default_message = 'Rate limit exceeded'
    default_code = 'rate_limit_error'
    status_code = status.HTTP_429_TOO_MANY_REQUESTS


class ValidationException(TrustFixException):
    """Validation error"""
    default_message = 'Validation failed'
    default_code = 'validation_error'


# Import settings at the end
from django.conf import settings
