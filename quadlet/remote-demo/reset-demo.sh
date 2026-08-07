#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/podman/bin:$PATH"

APP_CONTAINER="lemans-remote-demo-app"
DB_CONTAINER="lemans-remote-demo-db"
DB_VOLUME="lemans-remote-demo-db-data"
NETWORK_NAME="lemans-remote-demo-net"
B2_BUCKET="lemans-remote-demo-attachments"

echo "=== Resetting Le Mans remote demo to seeded state ==="

# Stop and remove app and db containers
podman stop "$APP_CONTAINER" 2> /dev/null || true
podman rm -f "$APP_CONTAINER" 2> /dev/null || true
podman rm -f "$DB_CONTAINER" 2> /dev/null || true

# Delete and recreate database volume
podman volume rm "$DB_VOLUME" 2> /dev/null || true
podman volume create "$DB_VOLUME"

# Restart database via systemd
systemctl --user start "${DB_CONTAINER}.service"

# Wait for DB readiness
for i in {1..30}; do
  if podman exec "$DB_CONTAINER" pg_isready -U postgres > /dev/null 2>&amp;1; then
    echo "Database ready"
    break
  fi
  sleep 1
done

# Start app
systemctl --user start "${APP_CONTAINER}.service"

# Push schema and seed
podman exec "$APP_CONTAINER" sh -c "npx prisma db push --accept-data-loss && npx prisma db seed"

# Delete uploaded demo attachments from Backblaze B2 bucket
if command -v b2 2> /dev/null && [[ -n "${B2_APPLICATION_KEY_ID:-}" ]]; then
  echo "Deleting uploaded attachments from B2 demo bucket..."
  b2 ls "${B2_BUCKET}" 2> /dev/null | while read -r file; do
    b2 delete-file-version "${file}" 2> /dev/null || true
  done
fi

echo "=== Remote demo reset complete ==="
