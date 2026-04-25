"""
Core background tasks for TrustFix
"""
from celery import shared_task
from celery.exceptions import MaxRetriesExceededError
from django.core.cache import cache
from django.utils import timezone
import logging

logger = logging.getLogger('trustfix.tasks')


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_async_notification(self, notification_id):
    """
    Send notification asynchronously
    
    Args:
        notification_id: ID of the Notification model instance
    """
    try:
        from apps.notifications.models import Notification
        from apps.notifications.services import notification_manager
        
        notification = Notification.objects.get(id=notification_id)
        result = notification_manager.send_notification(notification)
        
        return {
            'notification_id': str(notification_id),
            'status': notification.status,
            'result': result
        }
        
    except Notification.DoesNotExist:
        logger.error(f'Notification {notification_id} not found')
        return {'error': 'Notification not found'}
        
    except Exception as exc:
        logger.exception(f'Failed to send notification {notification_id}')
        try:
            self.retry(exc=exc)
        except MaxRetriesExceededError:
            logger.error(f'Max retries exceeded for notification {notification_id}')
            raise


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def process_ai_quote_async(self, booking_id):
    """
    Generate AI quote asynchronously
    
    Placeholder for LangGraph integration
    """
    try:
        from apps.bookings.models import Booking
        from apps.ai_engine.agent import generate_ai_quote
        from apps.ai_engine.models import AIQuote
        
        booking = Booking.objects.get(id=booking_id)
        
        # Generate quote using ReAct AI agent
        quote_data = generate_ai_quote(
            description=booking.description,
            service_category=booking.service_category,
            city=booking.customer.city or 'Unknown',
            is_emergency=booking.is_emergency
        )
        
        ai_quote = save_ai_quote(booking, quote_data)
        
        return {
            'booking_id': str(booking_id),
            'quote_id': str(ai_quote.id),
            'price_range': f"₹{quote_data['price_min']} - ₹{quote_data['price_max']}"
        }
        
    except Exception as exc:
        logger.exception(f'Failed to generate AI quote for booking {booking_id}')
        raise self.retry(exc=exc)


@shared_task
def cleanup_old_logs():
    """Clean up old log files"""
    from pathlib import Path
    from datetime import datetime, timedelta
    
    log_dir = Path(__file__).resolve().parent.parent.parent / 'logs'
    
    if not log_dir.exists():
        return {'message': 'Log directory does not exist'}
    
    cutoff_date = datetime.now() - timedelta(days=30)
    deleted_count = 0
    
    for log_file in log_dir.glob('*.log*'):
        if log_file.stat().st_mtime < cutoff_date.timestamp():
            log_file.unlink()
            deleted_count += 1
    
    return {'deleted_files': deleted_count}


@shared_task
def generate_daily_report():
    """Generate daily business report"""
    from django.db.models import Count, Sum, Avg
    from apps.bookings.models import Booking
    from apps.payments.models import Payment
    
    today = timezone.now().date()
    
    # Booking stats
    booking_stats = Booking.objects.filter(
        created_at__date=today
    ).aggregate(
        total=Count('id'),
        completed=Count('id', filter=models.Q(status='completed')),
        revenue=Sum('final_price', filter=models.Q(status='completed'))
    )
    
    # Payment stats
    payment_stats = Payment.objects.filter(
        created_at__date=today
    ).aggregate(
        total=Count('id'),
        successful=Count('id', filter=models.Q(status='captured')),
        amount=Sum('amount_total')
    )
    
    report = {
        'date': str(today),
        'bookings': booking_stats,
        'payments': payment_stats,
    }
    
    logger.info(f'Daily report generated: {report}')
    
    return report


@shared_task
def aggregate_ai_metrics():
    """
    Aggregate AI performance metrics hourly
    Creates AIPerformanceMetrics records for monitoring dashboards
    """
    from django.db.models import Count, Avg, Sum, Q
    from apps.ai_engine.models import AIUsageLog, AIPerformanceMetrics
    from datetime import timedelta
    import numpy as np
    
    try:
        now = timezone.now()
        current_hour = now.replace(minute=0, second=0, microsecond=0)
        previous_hour = current_hour - timedelta(hours=1)
        
        # Get all agent types
        agent_types = [choice[0] for choice in AIUsageLog.AGENT_TYPES]
        
        for agent_type in agent_types:
            # Get logs for this agent type in the previous hour
            logs = AIUsageLog.objects.filter(
                agent_type=agent_type,
                created_at__gte=previous_hour,
                created_at__lt=current_hour
            )
            
            if not logs.exists():
                continue
            
            # Volume metrics
            total_requests = logs.count()
            successful_requests = logs.filter(status='success').count()
            failed_requests = logs.filter(status='error').count()
            timeout_requests = logs.filter(status='timeout').count()
            fallback_requests = logs.filter(status='fallback').count()
            
            # Performance metrics (latency percentiles)
            latencies = list(logs.values_list('latency_ms', flat=True))
            avg_latency_ms = int(np.mean(latencies)) if latencies else 0
            p50_latency_ms = int(np.percentile(latencies, 50)) if latencies else 0
            p95_latency_ms = int(np.percentile(latencies, 95)) if latencies else 0
            p99_latency_ms = int(np.percentile(latencies, 99)) if latencies else 0
            
            # Token usage
            token_stats = logs.aggregate(
                total_input=Sum('input_tokens'),
                total_output=Sum('output_tokens'),
                total=Sum('total_tokens')
            )
            
            # Cost metrics
            cost_stats = logs.aggregate(
                total_cost=Sum('cost_usd'),
                avg_cost=Avg('cost_usd')
            )
            
            # Cache metrics
            cache_hits = logs.filter(cache_hit=True).count()
            cache_misses = logs.filter(cache_hit=False).count()
            cache_hit_rate = (cache_hits / total_requests * 100) if total_requests > 0 else 0
            
            # Accuracy metrics (for quote generation only)
            accuracy_rate = None
            if agent_type == 'quote':
                from apps.ai_engine.models import AIQuote
                quotes_with_feedback = AIQuote.objects.filter(
                    created_at__gte=previous_hour,
                    created_at__lt=current_hour,
                    was_accurate__isnull=False
                )
                if quotes_with_feedback.exists():
                    accurate_count = quotes_with_feedback.filter(was_accurate=True).count()
                    accuracy_rate = (accurate_count / quotes_with_feedback.count() * 100)
            
            # Create or update metrics record
            AIPerformanceMetrics.objects.update_or_create(
                date=previous_hour.date(),
                hour=previous_hour.hour,
                agent_type=agent_type,
                defaults={
                    'total_requests': total_requests,
                    'successful_requests': successful_requests,
                    'failed_requests': failed_requests,
                    'timeout_requests': timeout_requests,
                    'fallback_requests': fallback_requests,
                    'avg_latency_ms': avg_latency_ms,
                    'p50_latency_ms': p50_latency_ms,
                    'p95_latency_ms': p95_latency_ms,
                    'p99_latency_ms': p99_latency_ms,
                    'total_input_tokens': token_stats['total_input'] or 0,
                    'total_output_tokens': token_stats['total_output'] or 0,
                    'total_tokens': token_stats['total'] or 0,
                    'total_cost_usd': cost_stats['total_cost'] or 0,
                    'avg_cost_per_request': cost_stats['avg_cost'] or 0,
                    'cache_hit_rate': round(cache_hit_rate, 2),
                    'cache_hits': cache_hits,
                    'cache_misses': cache_misses,
                    'accuracy_rate': round(accuracy_rate, 2) if accuracy_rate else None,
                }
            )
        
        logger.info(f'AI metrics aggregated for {previous_hour}')
        return {
            'hour': str(previous_hour),
            'agent_types_processed': len(agent_types)
        }
        
    except Exception as e:
        logger.exception(f'Failed to aggregate AI metrics: {e}')
        raise


# Import models at the end to avoid circular imports
from django.db import models
