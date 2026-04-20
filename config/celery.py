"""
Celery Configuration for TrustFix
"""
import os
import signal
import sys
import logging
from celery import Celery
from celery.signals import task_failure, worker_shutdown, worker_shutting_down
from django.conf import settings

logger = logging.getLogger('trustfix.celery')

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Create Celery app
app = Celery('trustfix')

# Load config from Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from installed apps
app.autodiscover_tasks()

# ============================================
# Celery Configuration
# ============================================

app.conf.update(
    # Broker (Redis)
    broker_url=settings.REDIS_URL,
    broker_connection_retry_on_startup=True,
    
    # Result backend
    result_backend=settings.REDIS_URL,
    result_expires=3600,  # 1 hour
    result_extended=True,
    
    # Serialization
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    
    # Task execution
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes (warning)
    
    # Worker settings
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
    
    # Graceful shutdown settings
    worker_cancel_long_running_tasks_on_connection_loss=True,
    task_acks_late=True,  # Acknowledge tasks after completion
    task_reject_on_worker_lost=True,  # Requeue tasks if worker dies
    
    # Task routing
    task_routes={
        'apps.payments.tasks.*': {'queue': 'payments'},
        'apps.notifications.tasks.*': {'queue': 'notifications'},
        'apps.ai_engine.tasks.*': {'queue': 'ai'},
        'apps.bookings.tasks.*': {'queue': 'bookings'},
    },
    
    # Task default queue
    task_default_queue='default',
    
    # Beat schedule (periodic tasks)
    beat_schedule={
        'cleanup-expired-otp': {
            'task': 'apps.users.tasks.cleanup_expired_otp',
            'schedule': 300.0,  # 5 minutes
        },
        'process-pending-payouts': {
            'task': 'apps.payments.tasks.process_pending_payouts',
            'schedule': 600.0,  # 10 minutes
        },
        'update-technician-stats': {
            'task': 'apps.technicians.tasks.update_technician_stats',
            'schedule': 3600.0,  # 1 hour
        },
        'send-review-reminders': {
            'task': 'apps.bookings.tasks.send_review_reminders',
            'schedule': 1800.0,  # 30 minutes
        },
    },
)


@app.task(bind=True, max_retries=3)
def debug_task(self):
    """Debug task to verify Celery is working"""
    print(f'Request: {self.request!r}')
    return 'Celery is working!'


@task_failure.connect
def handle_task_failure(sender, task_id, exception, args, kwargs, traceback, einfo, **extras):
    """Handle task failures - log to Sentry when configured"""
    logger.error(
        f'Task {sender.name} [{task_id}] failed: {exception}',
        extra={
            'task_id': task_id,
            'task_args': args,
            'task_kwargs': kwargs,
            'exception': str(exception),
        }
    )


@worker_shutting_down.connect
def handle_worker_shutting_down(sender, **kwargs):
    """Handle worker shutdown signal - log and prepare for graceful shutdown"""
    logger.info("Celery worker is shutting down...")
    logger.info("Waiting for active tasks to complete...")


@worker_shutdown.connect
def handle_worker_shutdown(sender, **kwargs):
    """Handle worker shutdown - cleanup resources"""
    logger.info("Celery worker shutdown complete")
    logger.info("All tasks completed or requeued")


# ============================================
# Graceful Shutdown Handler for Celery
# ============================================

def setup_celery_graceful_shutdown():
    """
    Setup graceful shutdown for Celery worker
    
    Call this when starting Celery worker:
        celery -A config worker --loglevel=info
    """
    def handle_sigterm(signum, frame):
        """Handle SIGTERM signal"""
        logger.info("Received SIGTERM, initiating graceful shutdown...")
        logger.info("Celery will finish current tasks and then exit")
        # Celery handles graceful shutdown automatically with task_acks_late=True
        sys.exit(0)
        
    def handle_sigint(signum, frame):
        """Handle SIGINT signal (Ctrl+C)"""
        logger.info("Received SIGINT, initiating graceful shutdown...")
        logger.info("Celery will finish current tasks and then exit")
        sys.exit(0)
        
    # Register signal handlers
    signal.signal(signal.SIGTERM, handle_sigterm)
    signal.signal(signal.SIGINT, handle_sigint)
    
    logger.info("Celery graceful shutdown handlers registered")


# Auto-setup graceful shutdown when Celery worker starts
if 'worker' in sys.argv:
    setup_celery_graceful_shutdown()
