#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/podman/bin:$PATH"

APP_CONTAINER="lemans-remote-demo-app"
GO_CONTAINER="lemans-remote-demo-go"
DB_CONTAINER="lemans-remote-demo-db"
DB_VOLUME="lemans-remote-demo-db-data"
NETWORK_NAME="lemans-remote-demo-net"
B2_BUCKET="lemans-remote-demo-attachments"

echo "=== Resetting Le Mans remote demo to seeded state ==="

systemctl --user stop "${APP_CONTAINER}.service" 2>/dev/null || true
systemctl --user stop "${GO_CONTAINER}.service" 2>/dev/null || true
systemctl --user stop "${DB_CONTAINER}.service" 2>/dev/null || true

podman rm -f "$APP_CONTAINER" 2>/dev/null || true
podman rm -f "$GO_CONTAINER" 2>/dev/null || true
podman rm -f "$DB_CONTAINER" 2>/dev/null || true

podman volume rm "$DB_VOLUME" 2>/dev/null || true
podman volume create "$DB_VOLUME"

systemctl --user start "${DB_CONTAINER}.service"

for i in {1..30}; do
  if podman exec "$DB_CONTAINER" pg_isready -U postgres > /dev/null 2>&1; then
    echo "Database ready"
    break
  fi
  sleep 1
done

systemctl --user start "${GO_CONTAINER}.service"

for i in {1..30}; do
  if curl -s -o /dev/null -w '%{http_code}' "http://${GO_CONTAINER}:8080/health" 2>/dev/null | grep -q '^200$'; then
    echo "Go API ready"
    break
  fi
  sleep 1
done

systemctl --user start "${APP_CONTAINER}.service"

curl -s -X POST "http://${GO_CONTAINER}:8080/admin/seed" -H 'Content-Type: application/json' -d '{}'
echo "Demo database seeded"

if command -v b2 2>/dev/null && [[ -n "${B2_APPLICATION_KEY_ID:-}" ]]; then
  echo "Deleting uploaded attachments from B2 demo bucket..."
  b2 ls "${B2_BUCKET}" 2>/dev/null | while read -r file; do
    b2 delete-file-version "${file}" 2>/dev/null || true
  done
fi

echo "=== Remote demo reset complete ==="
