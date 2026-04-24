#!/bin/bash
# TrustFix Production Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
echo "🚀 Deploying TrustFix to $ENVIRONMENT..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed"
    exit 1
fi

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    log_info "Loading environment from .env.$ENVIRONMENT"
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
else
    log_warn "No .env.$ENVIRONMENT file found, using .env"
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
fi

# Pre-deployment checks
log_info "Running pre-deployment checks..."

# Check database connectivity
if [ -n "$DATABASE_URL" ]; then
    log_info "Checking database connection..."
    # Add database check here
fi

# Check Redis connectivity
if [ -n "$REDIS_URL" ]; then
    log_info "Checking Redis connection..."
    # Add Redis check here
fi

# Build and push Docker image
log_info "Building Docker image..."
docker build -t trustfix:$ENVIRONMENT .
docker tag trustfix:$ENVIRONMENT trustfix:latest

# Run migrations
log_info "Running database migrations..."
docker-compose -f docker-compose.$ENVIRONMENT.yml run --rm web python manage.py migrate

# Collect static files
log_info "Collecting static files..."
docker-compose -f docker-compose.$ENVIRONMENT.yml run --rm web python manage.py collectstatic --noinput

# Start services
log_info "Starting services..."
docker-compose -f docker-compose.$ENVIRONMENT.yml up -d

# Health check
log_info "Running health checks..."
sleep 10

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health/health/ || echo "000")

if [ "$HEALTH_STATUS" = "200" ]; then
    log_info "✅ Deployment successful! Health check passed."
else
    log_error "❌ Health check failed with status $HEALTH_STATUS"
    log_info "Checking logs..."
    docker-compose -f docker-compose.$ENVIRONMENT.yml logs --tail=50 web
    exit 1
fi

# Post-deployment tasks
log_info "Running post-deployment tasks..."

# Clear cache
log_info "Clearing cache..."
docker-compose -f docker-compose.$ENVIRONMENT.yml exec -T web python manage.py shell -c "from django.core.cache import cache; cache.clear()"

# Send notification (optional)
# curl -X POST "$SLACK_WEBHOOK_URL" -d '{"text":"TrustFix deployed successfully!"}'

log_info "🎉 Deployment to $ENVIRONMENT completed successfully!"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose -f docker-compose.$ENVIRONMENT.yml logs -f"
echo "  - Scale workers: docker-compose -f docker-compose.$ENVIRONMENT.yml up -d --scale celery=3"
echo "  - Restart: docker-compose -f docker-compose.$ENVIRONMENT.yml restart"
