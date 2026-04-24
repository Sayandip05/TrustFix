#!/bin/bash
# TrustFix Database Backup Script
# Usage: ./scripts/backup.sh [environment]

set -e

ENVIRONMENT=${1:-production}
BACKUP_DIR="/backups/trustfix"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="trustfix_${ENVIRONMENT}_${DATE}.sql.gz"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}[INFO]${NC} Starting backup for $ENVIRONMENT..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Load environment
if [ -f ".env.$ENVIRONMENT" ]; then
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
fi

# Database backup
if [ "$ENVIRONMENT" = "production" ]; then
    # Supabase/PostgreSQL backup
    echo -e "${GREEN}[INFO]${NC} Backing up PostgreSQL database..."
    
    PGPASSWORD=$SUPABASE_DB_PASSWORD pg_dump \
        -h $SUPABASE_DB_HOST \
        -U $SUPABASE_DB_USER \
        -d $SUPABASE_DB_NAME \
        --no-owner \
        --no-acl \
        | gzip > "$BACKUP_DIR/$BACKUP_FILE"
else
    # SQLite backup
    echo -e "${GREEN}[INFO]${NC} Backing up SQLite database..."
    cp db.sqlite3 "$BACKUP_DIR/trustfix_${ENVIRONMENT}_${DATE}.sqlite3"
fi

# Backup Redis (optional)
echo -e "${YELLOW}[WARN]${NC} Redis backup not implemented yet"

# Cleanup old backups (keep last 7 days)
echo -e "${GREEN}[INFO]${NC} Cleaning up old backups..."
find $BACKUP_DIR -name "trustfix_${ENVIRONMENT}_*.sql.gz" -mtime +7 -delete

echo -e "${GREEN}[INFO]${NC} Backup completed: $BACKUP_FILE"

# Optional: Upload to S3
# if [ -n "$AWS_S3_BUCKET" ]; then
#     aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" s3://$AWS_S3_BUCKET/backups/
# fi
