#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_ROOT"
source "${PROJECT_ROOT}/scripts/lib/common.sh"

NETWORK_NAME="lemans-demo-net"
VOLUME_NAME="lemans-demo-db-data"
DB_NAME="lemans-demo-db"
GO_NAME="lemans-demo-go"
APP_NAME="lemans-demo-app"
PORT=3000

DB_PASSWORD="$(generate_password)"

cleanup_local() {
  echo "Cleaning up local resources..."
  docker rm -f "$APP_NAME" "$GO_NAME" "$DB_NAME" 2>/dev/null || true
}

create_local_resources() {
  if ! docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
    docker network create "$NETWORK_NAME"
  fi
  if ! docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1; then
    docker volume create "$VOLUME_NAME"
  fi
}

echo "=== Le Mans Local Run ==="

LOCAL_PLATFORM="$(docker info --format '{{.OSType}}/{{.Architecture}}')"
needs_local_images=false
for image in lemans-bridge-dashboard-go:demo-go lemans-bridge-dashboard:demo-web; do
  image_platform="$(docker image inspect "$image" --format '{{.Os}}/{{.Architecture}}' 2>/dev/null || true)"
  if [[ "$image_platform" != "$LOCAL_PLATFORM" ]]; then
    needs_local_images=true
  fi
done
if [[ "$needs_local_images" == true ]]; then
  echo "Building native local images for ${LOCAL_PLATFORM}..."
  TARGET_PLATFORM="$LOCAL_PLATFORM" ./scripts/build.sh demo
fi

docker rm -f "$APP_NAME" "$GO_NAME" "$DB_NAME" 2>/dev/null || true
docker volume rm "$VOLUME_NAME" 2>/dev/null || true

create_local_resources

docker run -d \
  --platform "$LOCAL_PLATFORM" \
  --name "$DB_NAME" \
  --network "$NETWORK_NAME" \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD="$DB_PASSWORD" \
  -e POSTGRES_DB=lemans_demo_db \
  -v "${VOLUME_NAME}:/var/lib/postgresql" \
  --restart=unless-stopped \
  docker.io/library/postgres:alpine

wait_for_db "$DB_NAME"

docker run -d \
  --platform "$LOCAL_PLATFORM" \
  --name "$GO_NAME" \
  --network "$NETWORK_NAME" \
  -e DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@${DB_NAME}:5432/lemans_demo_db" \
  -e DEMO_MODE=true \
  -e LISTEN_ADDR=:8080 \
  --restart=unless-stopped \
  lemans-bridge-dashboard-go:demo-go

# Wait for Go API
wait_for_http "http://${GO_NAME}:8080/health" "$NETWORK_NAME"

# Seed the demo database
docker run --rm --platform "$LOCAL_PLATFORM" --network "$NETWORK_NAME" curlimages/curl:latest \
  -s -X POST "http://${GO_NAME}:8080/admin/seed" \
  -H 'Content-Type: application/json' \
  -d '{}'
echo "Demo database seeded"

docker run -d \
  --platform "$LOCAL_PLATFORM" \
  --name "$APP_NAME" \
  --network "$NETWORK_NAME" \
  -p "127.0.0.1:${PORT}:3000" \
  -e API_BASE_URL="http://${GO_NAME}:8080" \
  lemans-bridge-dashboard:demo-web

BASE_PATH="/lemans/demo"
if ! wait_for_http "http://127.0.0.1:${PORT}${BASE_PATH}" ""; then
  echo "Error: local demo app did not become ready at ${BASE_PATH}"
  exit 1
fi

echo "=== Local demo running at http://127.0.0.1:${PORT}${BASE_PATH}/ ==="
echo "Run ./scripts/reset-local.sh to reset to seeded state."
