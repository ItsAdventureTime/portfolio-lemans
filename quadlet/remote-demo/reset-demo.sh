#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/podman/bin:$PATH"

APP_CONTAINER="lemans-demo-app"
GO_CONTAINER="lemans-demo-go"
DB_CONTAINER="lemans-demo-db"
DB_VOLUME="lemans-demo-db-data"
NETWORK_NAME="lemans-demo-net"
B2_BUCKET="lemans-demo-attachments"
RESET_LOG="/home/jk/bridge-ph/lemans-demo/reset.log"

mkdir -p "$(dirname "$RESET_LOG")"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$RESET_LOG"
}

log "=== Starting Le Mans remote demo reset ==="

stop_service() {
  local unit=$1
  if systemctl --user is-active --quiet "$unit" 2>/dev/null; then
    log "Stopping $unit"
    systemctl --user stop "$unit" || true
  fi
}

stop_service lemans-demo-app.service
stop_service lemans-demo-go.service
stop_service lemans-demo-db.service

log "Removing demo containers..."
podman rm -f "$APP_CONTAINER" 2>/dev/null || true
podman rm -f "$GO_CONTAINER" 2>/dev/null || true
podman rm -f "$DB_CONTAINER" 2>/dev/null || true

log "Recreating demo database volume..."
podman volume rm "$DB_VOLUME" 2>/dev/null || true
podman volume create "$DB_VOLUME"

log "Starting database container..."
systemctl --user start lemans-demo-db.service

for i in $(seq 1 30); do
  if podman exec "$DB_CONTAINER" pg_isready -U postgres > /dev/null 2>&1; then
    log "Database ready"
    break
  fi
  sleep 1
done

if ! podman exec "$DB_CONTAINER" pg_isready -U postgres > /dev/null 2>&1; then
  log "ERROR: database did not become ready"
  exit 1
fi

log "Starting Go API container..."
systemctl --user start lemans-demo-go.service

for i in $(seq 1 30); do
  if curl -s -o /dev/null -w '%{http_code}' "http://${GO_CONTAINER}:8080/health" 2>/dev/null | grep -q '^200$'; then
    log "Go API ready"
    break
  fi
  sleep 1
done

if ! curl -s -o /dev/null -w '%{http_code}' "http://${GO_CONTAINER}:8080/health" 2>/dev/null | grep -q '^200$'; then
  log "ERROR: Go API health check failed"
  exit 1
fi

log "Seeding demo database..."
curl -s -X POST "http://${GO_CONTAINER}:8080/admin/seed" -H 'Content-Type: application/json' -d '{}'
log "Demo database seeded"

log "Starting web app container..."
systemctl --user start lemans-demo-app.service

if command -v b2 2>/dev/null && [[ -n "${B2_APPLICATION_KEY_ID:-}" ]]; then
  log "Deleting uploaded attachments from B2 demo bucket..."
  b2 ls "${B2_BUCKET}" 2>/dev/null | while read -r file; do
    b2 delete-file-version "${file}" 2>/dev/null || true
  done
fi

log "=== Remote demo reset complete ==="
