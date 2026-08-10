#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/podman/bin:$PATH"

cd "$PROJECT_ROOT"
source "${PROJECT_ROOT}/scripts/lib/common.sh"

NETWORK_NAME="lemans-demo-net"
VOLUME_NAME="lemans-demo-db-data"
DB_NAME="lemans-demo-db"
GO_NAME="lemans-demo-go"
APP_NAME="lemans-demo-app"
PORT=3000

cleanup_local() {
  echo "Cleaning up local resources..."
  podman rm -f "$APP_NAME" "$GO_NAME" "$DB_NAME" 2>/dev/null || true
}

create_local_resources() {
  if ! podman network exists "$NETWORK_NAME"; then
    podman network create "$NETWORK_NAME"
  fi
  if ! podman volume exists "$VOLUME_NAME"; then
    podman volume create "$VOLUME_NAME"
  fi
}

echo "=== Le Mans Local Run ==="

podman rm -f "$APP_NAME" "$GO_NAME" "$DB_NAME" 2>/dev/null || true

create_local_resources

podman run -d \
  --replace \
  --name "$DB_NAME" \
  --network "$NETWORK_NAME" \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres_demo_pass \
  -e POSTGRES_DB=lemans_demo_db \
  -v "${VOLUME_NAME}:/var/lib/postgresql" \
  --restart=unless-stopped \
  docker.io/library/postgres:alpine

wait_for_db "$DB_NAME"

podman run -d \
  --replace \
  --name "$GO_NAME" \
  --network "$NETWORK_NAME" \
  -e DATABASE_URL="postgresql://postgres:postgres_demo_pass@${DB_NAME}:5432/lemans_demo_db" \
  -e DEMO_MODE=true \
  -e LISTEN_ADDR=:8080 \
  --restart=unless-stopped \
  lemans-bridge-dashboard-go:demo-go

# Wait for Go API
wait_for_http "http://${GO_NAME}:8080/health" "$NETWORK_NAME"

# Seed the demo database
podman run --rm --network "$NETWORK_NAME" curlimages/curl:latest \
  -s -X POST "http://${GO_NAME}:8080/admin/seed" \
  -H 'Content-Type: application/json' \
  -d '{}'
echo "Demo database seeded"

podman run -d \
  --replace \
  --name "$APP_NAME" \
  --network "$NETWORK_NAME" \
  -p "127.0.0.1:${PORT}:3000" \
  --env-file "${PROJECT_ROOT}/.env.demo" \
  -e API_BASE_URL="http://${GO_NAME}:8080" \
  -e NEXT_PUBLIC_BASE_PATH="" \
  lemans-bridge-dashboard:demo-web

wait_for_http "http://127.0.0.1:${PORT}/" ""

echo "=== Local demo running at http://127.0.0.1:${PORT}/ ==="
echo "Run ./scripts/reset-local.sh to reset to seeded state."
