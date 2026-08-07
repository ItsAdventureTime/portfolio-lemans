#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/podman/bin:$PATH"

cd "$PROJECT_ROOT"

source "${PROJECT_ROOT}/scripts/lib/common.sh"

# Configuration
REMOTE_USER="${REMOTE_USER:-jk}"
REMOTE_HOST="${REMOTE_HOST:-}"
REMOTE_PATH="${REMOTE_PATH:-/home/jk/bridge-ph/lemans}"
QUADLET_PATH="${QUADLET_PATH:-/home/jk/.config/containers/systemd/bridge-ph/lemans}"
APP_PORT=3003
DB_VOLUME="lemans-remote-prod-db-data"
NETWORK_NAME="lemans-remote-prod-net"
APP_CONTAINER="lemans-remote-prod-app"
DB_CONTAINER="lemans-remote-prod-db"
IMAGE="docker.io/library/lemans-bridge-dashboard:lts-alpine"

if [[ -z "$REMOTE_HOST" ]]; then
  echo "Error: REMOTE_HOST is required. Example: REMOTE_HOST=vps.example.com ./scripts/deploy-remote-prod.sh"
  exit 1
fi

if [[ -z "${B2_ACCESS_KEY_ID:-}" ]] || [[ -z "${B2_SECRET_ACCESS_KEY:-}" ]]; then
  echo "Backblaze B2 credentials required for remote production."
  echo -n "B2 Access Key ID: "
  read -r B2_ACCESS_KEY_ID
  echo -n "B2 Secret Access Key: "
  read -rs B2_SECRET_ACCESS_KEY
  echo
fi

DB_PASSWORD="$(generate_password)"
BETTER_AUTH_SECRET="$(generate_password)"

echo "=== Deploying remote production to ${REMOTE_HOST} ==="

echo "[1/6] Building local static/standalone output..."
podman run --rm \
  -v "${PROJECT_ROOT}:/app:rw" \
  -w /app \
  node:20-alpine3.20 sh -c "
    apk add --no-cache openssl
    npm ci
    npx prisma generate
    npm run build
  "

if [[ -d "${PROJECT_ROOT}/out" ]]; then
  echo "[2/6] Syncing static output to remote..."
  rsync -avz --delete "${PROJECT_ROOT}/out/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"
fi

if [[ -d "${PROJECT_ROOT}/.next/standalone" ]]; then
  echo "[2/6] Syncing standalone output to remote..."
  rsync -avz --delete "${PROJECT_ROOT}/.next/standalone/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/app/"
fi

echo "[3/6] Syncing Quadlets to remote..."
rsync -avz "${PROJECT_ROOT}/quadlet/remote-prod/" "${REMOTE_USER}@${REMOTE_HOST}:${QUADLET_PATH}/"

echo "[4/6] Creating remote environment file..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ${QUADLET_PATH} && cat > ${QUADLET_PATH}/lemans.env <<EOF
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@${DB_CONTAINER}:5432/lemans_remote_prod_db?schema=public
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
BETTER_AUTH_URL=http://127.0.0.1:${APP_PORT}
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
B2_ACCESS_KEY_ID=${B2_ACCESS_KEY_ID}
B2_SECRET_ACCESS_KEY=${B2_SECRET_ACCESS_KEY}
B2_BUCKET_NAME=lemans-remote-prod-attachments
EOF
"

echo "[5/6] Reloading systemd user services and starting production..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "
  export PATH=\"/opt/podman/bin:\$PATH\"
  systemctl --user daemon-reload
  systemctl --user start ${APP_CONTAINER}.service
"

echo "[6/6] Running migrations (no seed for production)..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "
  export PATH=\"/opt/podman/bin:\$PATH\"
  podman exec ${APP_CONTAINER} sh -c 'npx prisma db push --accept-data-loss'
"

echo "=== Remote production deployed at http://${REMOTE_HOST}:${APP_PORT} ==="
echo "Production backup/sync service is active."
