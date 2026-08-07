#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/podman/bin:$PATH"

cd "$PROJECT_ROOT"

source "${PROJECT_ROOT}/scripts/lib/common.sh"

# Start local Podman machine if not running
if ! podman machine inspect podman-machine-default --format '{{.State}}' 2>/dev/null | grep -q 'running'; then
  echo "Starting podman machine..."
  podman machine start
fi

NETWORK_NAME="lemans-demo-net"
VOLUME_NAME="lemans-demo-db-data"
DB_NAME="lemans-demo-db"
APP_NAME="lemans-demo-app"
PORT=3000

cleanup_local() {
  echo "Cleaning up local resources..."
  podman rm -f "$APP_NAME" "$DB_NAME" 2>/dev/null || true
}

create_local_resources() {
  if ! podman network exists "$NETWORK_NAME"; then
    podman network create "$NETWORK_NAME"
  fi

  if ! podman volume exists "$VOLUME_NAME"; then
    podman volume create "$VOLUME_NAME"
  fi
}

echo "=== Le Mans Local Run (single-podman-container) ==="

create_local_resources

podman run -d \
  --rm \
  --name "$DB_NAME" \
  --network "$NETWORK_NAME" \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres_demo_pass \
  -e POSTGRES_DB=lemans_demo_db \
  -v "${VOLUME_NAME}:/var/lib/postgresql/data" \
  --restart=unless-stopped \
  docker.io/library/postgres:16-alpine

# Wait for DB
for i in {1..30}; do
  if podman exec "$DB_NAME" pg_isready -U postgres > /dev/null 2>&amp;1; then
    echo "Database ready"
    break
  fi
  sleep 1
done

podman run -d \
  --rm \
  --name "$APP_NAME" \
  --network "$NETWORK_NAME" \
  -p "127.0.0.1:${PORT}:3000" \
  --env-file "${PROJECT_ROOT}/.env.demo" \
  -e DATABASE_URL="postgresql://postgres:postgres_demo_pass@${DB_NAME}:5432/lemans_demo_db?schema=public" \
  -e BETTER_AUTH_URL="http://127.0.0.1:${PORT}" \
  -e BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET:-$(openssl rand -hex 32)}" \
  lemans-bridge-dashboard:latest-alpine

# Wait for app
for i in {1..30}; do
  if curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/login" 2> /dev/null | grep -q '^200$'; then
    echo "App ready at http://127.0.0.1:${PORT}"
    break
  fi
  sleep 1
done

echo "=== Migrations and seed ==="
podman exec -i "$APP_NAME" sh -c "npx prisma db push --accept-data-loss && npx prisma db seed"

echo "=== Local demo running at http://127.0.0.1:${PORT}/ ==="
echo "Run ./scripts/reset-local.sh to reset to seeded state."
