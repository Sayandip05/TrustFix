"""
Security utilities for TrustFix
"""
import bleach
import re
from typing import Optional


def sanitize_html(text: str, allowed_tags: list = None) -> str:
    """
    Sanitize HTML input to prevent XSS attacks
    
    Args:
        text: Input text that may contain HTML
        allowed_tags: List of allowed HTML tags (default: none)
    
    Returns:
        Sanitized text with dangerous HTML removed
    """
    if not text:
        return text
    
    if allowed_tags is None:
        allowed_tags = []
    
    return bleach.clean(
        text,
        tags=allowed_tags,
        strip=True,
        strip_comments=True
    )


def sanitize_user_input(text: str) -> str:
    """
    Sanitize general user input (reviews, descriptions, etc.)
    Removes all HTML tags and dangerous characters
    """
    if not text:
        return text
    
    # Remove all HTML tags
    text = bleach.clean(text, tags=[], strip=True)
    
    # Remove null bytes
    text = text.replace('\x00', '')
    
    # Normalize whitespace
    text = ' '.join(text.split())
    
    return text


def validate_phone_number(phone: str) -> Optional[str]:
    """
    Validate and normalize phone number
    
    Args:
        phone: Phone number string
    
    Returns:
        Normalized phone number or None if invalid
    """
    # Remove all non-digit characters
    digits = re.sub(r'\D', '', phone)
    
    # Check if it's a valid Indian mobile number
    if len(digits) == 10 and digits[0] in '6789':
        return f'+91{digits}'
    elif len(digits) == 12 and digits.startswith('91') and digits[2] in '6789':
        return f'+{digits}'
    
    return None


def mask_phone_number(phone: str) -> str:
    """
    Mask phone number for display
    Example: +919876543210 -> +91XXXXX43210
    """
    if not phone or len(phone) < 8:
        return phone
    
    return phone[:-5] + 'XXXXX' + phone[-4:]


def mask_email(email: str) -> str:
    """
    Mask email for display
    Example: user@example.com -> u***@example.com
    """
    if not email or '@' not in email:
        return email
    
    local, domain = email.split('@', 1)
    if len(local) <= 2:
        masked_local = local[0] + '***'
    else:
        masked_local = local[0] + '***' + local[-1]
    
    return f'{masked_local}@{domain}'


def validate_uuid(uuid_string: str) -> bool:
    """
    Validate UUID format
    """
    import uuid
    try:
        uuid.UUID(uuid_string)
        return True
    except (ValueError, AttributeError):
        return False


def generate_masked_contact(booking_id: str) -> str:
    """
    Generate masked contact number for visiting charge flow
    Format: TRX{8_digit_hash}
    """
    import hashlib
    hash_obj = hashlib.sha256(booking_id.encode())
    hash_hex = hash_obj.hexdigest()
    return f'TRX{hash_hex[:8].upper()}'


def check_sql_injection(text: str) -> bool:
    """
    Basic SQL injection pattern detection
    Returns True if suspicious patterns found
    """
    if not text:
        return False
    
    # Common SQL injection patterns
    sql_patterns = [
        r"(\bUNION\b.*\bSELECT\b)",
        r"(\bSELECT\b.*\bFROM\b)",
        r"(\bINSERT\b.*\bINTO\b)",
        r"(\bUPDATE\b.*\bSET\b)",
        r"(\bDELETE\b.*\bFROM\b)",
        r"(\bDROP\b.*\bTABLE\b)",
        r"(--|\#|\/\*|\*\/)",
        r"(\bOR\b.*=.*)",
        r"(\bAND\b.*=.*)",
    ]
    
    text_upper = text.upper()
    for pattern in sql_patterns:
        if re.search(pattern, text_upper, re.IGNORECASE):
            return True
    
    return False


def rate_limit_key(identifier: str, action: str) -> str:
    """
    Generate cache key for rate limiting
    
    Args:
        identifier: User ID, IP address, or phone number
        action: Action being rate limited (e.g., 'otp', 'login', 'api')
    
    Returns:
        Cache key string
    """
    import time
    minute = int(time.time()) // 60
    return f"rate_limit:{action}:{identifier}:{minute}"
