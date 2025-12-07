#!/bin/bash

# Automated Database Backup Script for Production
# This script creates daily backups of the PostgreSQL database
# Run this script via cron: 0 2 * * * /path/to/automated-backup.sh

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_CONTAINER="${DB_CONTAINER:-ata-crm-postgres}"
DB_NAME="${DB_NAME:-ata_crm}"
DB_USER="${DB_USER:-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ata_crm_backup_${TIMESTAMP}.sql"

# Create backup
echo "Creating backup: $BACKUP_FILE"
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

# Compress backup
echo "Compressing backup..."
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Check if backup was successful
if [ -f "$BACKUP_FILE" ]; then
    echo "✅ Backup created successfully: $BACKUP_FILE"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Backup size: $BACKUP_SIZE"
    
    # Clean old backups (keep only last N days)
    echo "Cleaning backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "ata_crm_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo "✅ Cleanup completed"
else
    echo "❌ Backup failed!"
    exit 1
fi

