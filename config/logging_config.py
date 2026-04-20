"""
Comprehensive Logging Configuration for TrustFix
"""
import os
from pathlib import Path

# Log directory
LOG_DIR = Path(__file__).resolve().parent.parent / 'logs'
LOG_DIR.mkdir(exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] [{levelname}] [{name}] [{filename}:{lineno}] {message}',
            'style': '{',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
        'simple': {
            'format': '[{asctime}] [{levelname}] {message}',
            'style': '{',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(levelname)s %(name)s %(filename)s %(lineno)s %(message)s',
        },
    },
    'filters': {
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
    },
    'handlers': {
        # Console handler for development
        'console': {
            'level': 'DEBUG',
            'filters': ['require_debug_true'],
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        # File handlers
        'file_django': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOG_DIR / 'django.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'file_requests': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOG_DIR / 'requests.log',
            'maxBytes': 10485760,
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'file_errors': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOG_DIR / 'errors.log',
            'maxBytes': 10485760,
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'file_payments': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOG_DIR / 'payments.log',
            'maxBytes': 10485760,
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'file_ai': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOG_DIR / 'ai_engine.log',
            'maxBytes': 10485760,
            'backupCount': 5,
            'formatter': 'verbose',
        },
        # Mail handler for critical errors
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler',
            'include_html': True,
        },
    },
    'loggers': {
        # Django loggers
        'django': {
            'handlers': ['console', 'file_django'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['file_requests', 'file_errors', 'mail_admins'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.server': {
            'handlers': ['console', 'file_requests'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'WARNING',  # Set to DEBUG to see SQL queries
            'propagate': False,
        },
        # TrustFix loggers
        'trustfix': {
            'handlers': ['console', 'file_django'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'trustfix.request': {
            'handlers': ['console', 'file_requests'],
            'level': 'INFO',
            'propagate': False,
        },
        'trustfix.auth': {
            'handlers': ['console', 'file_django', 'file_errors'],
            'level': 'INFO',
            'propagate': False,
        },
        'trustfix.payments': {
            'handlers': ['console', 'file_payments', 'file_errors'],
            'level': 'INFO',
            'propagate': False,
        },
        'trustfix.ai': {
            'handlers': ['console', 'file_ai'],
            'level': 'INFO',
            'propagate': False,
        },
        'trustfix.notifications': {
            'handlers': ['console', 'file_django'],
            'level': 'INFO',
            'propagate': False,
        },
        # Third-party loggers
        'rest_framework': {
            'handlers': ['console', 'file_django'],
            'level': 'WARNING',
            'propagate': False,
        },
        'celery': {
            'handlers': ['console', 'file_django'],
            'level': 'INFO',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console', 'file_errors'],
        'level': 'WARNING',
    },
}


def get_logging_config(debug: bool = True) -> dict:
    """
    Get logging configuration based on environment
    
    Args:
        debug: Whether debug mode is enabled
    
    Returns:
        Logging configuration dictionary
    """
    config = LOGGING.copy()
    
    if debug:
        # In debug mode, add SQL query logging
        config['loggers']['django.db.backends']['level'] = 'DEBUG'
    else:
        # In production, remove console handler from most loggers
        for logger_name, logger_config in config['loggers'].items():
            if 'console' in logger_config.get('handlers', []):
                logger_config['handlers'] = [
                    h for h in logger_config['handlers'] if h != 'console'
                ]
    
    return config
