#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/podman/bin:$PATH"

DB_CONTAINER="lemans-prod-db"
B2_BUCKET="lemans-prod-attachments"
BACKUP_PREFIX="backups/db"
BACKUP_FILE="lemans-prod-backup-$(date +%F-%H%M%S).sql.gz"

echo "=== Backing up production database to Backblaze B2 ==="

podman exec "$DB_CONTAINER" pg_dump -U postgres lemans_prod_db | gzip > "/tmp/${BACKUP_FILE}"

if command -v b2 2> /dev/null && [[ -n "${B2_APPLICATION_KEY_ID:-}" ]]; then
  b2 upload-file "${B2_BUCKET}" "/tmp/${BACKUP_FILE}" "${BACKUP_PREFIX}/${BACKUP_FILE}"
  echo "Backup uploaded to s3://${B2_BUCKET}/${BACKUP_PREFIX}/${BACKUP_FILE}"
else
  echo "B2 CLI not configured; backup left at /tmp/${BACKUP_FILE}"
fi

rm -f "/tmp/${BACKUP_FILE}"

echo "=== Production backup complete ==="
