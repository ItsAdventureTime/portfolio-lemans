#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/podman/bin:$PATH"

cd "$PROJECT_ROOT"

source "${PROJECT_ROOT}/scripts/lib/common.sh"

# Configuration
REMOTE_USER="${REMOTE_USER:-jk}"
REMOTE_HOST="${REMOTE_HOST:-}"
REMOTE_PATH="${REMOTE_PATH:-/home/jk/bridge-ph/lemans-demo}"
QUADLET_PATH="${QUADLET_PATH:-/home/jk/.config/containers/systemd/bridge-ph/lemans-demo}"
APP_PORT=3002
DB_VOLUME="lemans-remote-demo-db-data"
NETWORK_NAME="lemans-remote-demo-net"
APP_CONTAINER="lemans-remote-demo-app"
DB_CONTAINER="lemans-remote-demo-db"
IMAGE="docker.io/library/lemans-bridge-dashboard:latest-alpine"

if [[ -z "$REMOTE_HOST" ]]; then
  echo "Error: REMOTE_HOST is required. Example: REMOTE_HOST=vps.example.com ./scripts/deploy-remote-demo.sh"
  exit 1
fi

if [[ -z "${B2_ACCESS_KEY_ID:-}" ]] || [[ -z "${B2_SECRET_ACCESS_KEY:-}" ]]; then
  echo "Backblaze B2 credentials required for remote demo."
  echo -n "B2 Access Key ID: "
  read -r B2_ACCESS_KEY_ID
  echo -n "B2 Secret Access Key: "
  read -rs B2_SECRET_ACCESS_KEY
  echo
fi

DB_PASSWORD="$(generate_password)"
BETTER_AUTH_SECRET="$(generate_password)"
DEMO_SEED_PASSWORD="${DEMO_SEED_PASSWORD:-$(generate_password)}"

echo "=== Deploying remote demo to ${REMOTE_HOST} ==="

echo "[1/7] Building local static output..."
podman run --rm \
  -v "${PROJECT_ROOT}:/app:rw" \
  -w /app \
  node:20-alpine3.20 sh -c "
    apk add --no-cache openssl
    npm ci
    npx prisma generate
    npm run build
  "

# If build produces static export, sync it; otherwise assume standalone app container image is used
if [[ -d "${PROJECT_ROOT}/out" ]]; then
  echo "[2/7] Syncing static output to remote..."
  rsync -avz --delete "${PROJECT_ROOT}/out/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"
fi

if [[ -d "${PROJECT_ROOT}/.next/standalone" ]]; then
  echo "[2/7] Syncing standalone output to remote..."
  rsync -avz --delete "${PROJECT_ROOT}/.next/standalone/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/app/"
fi

echo "[3/7] Syncing Quadlets to remote..."
rsync -avz "${PROJECT_ROOT}/quadlet/remote-demo/" "${REMOTE_USER}@${REMOTE_HOST}:${QUADLET_PATH}/"

echo "[4/7] Creating remote environment file..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ${QUADLET_PATH} && cat > ${QUADLET_PATH}/lemans-demo.env <<EOF
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@${DB_CONTAINER}:5432/lemans_remote_demo_db?schema=public
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
BETTER_AUTH_URL=http://127.0.0.1:${APP_PORT}
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
B2_ACCESS_KEY_ID=${B2_ACCESS_KEY_ID}
B2_SECRET_ACCESS_KEY=${B2_SECRET_ACCESS_KEY}
B2_BUCKET_NAME=lemans-remote-demo-attachments
DEMO_SEED_PASSWORD=${DEMO_SEED_PASSWORD}
EOF
"

echo "[5/7] Reloading systemd user services and starting demo..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "
  export PATH=\"/opt/podman/bin:\$PATH\"
  systemctl --user daemon-reload
  systemctl --user start ${APP_CONTAINER}.service
"

echo "[6/7] Running migrations and seed..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "
  export PATH=\"/opt/podman/bin:\$PATH\"
  podman exec ${APP_CONTAINER} sh -c 'npx prisma db push --accept-data-loss && npx prisma db seed'
"

echo "[7/7] Installing demo reset timer (30 minutes)..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "
  mkdir -p ~/.config/systemd/user
  cat > ~/.config/systemd/user/lemans-demo-reset.timer <>EOF
[Unit]
Description=Reset Le Mans demo every 30 minutes

[Timer]
OnBootSec=30min
OnUnitActiveSec=30min

[Install]
WantedBy=timers.target
EOF
  cat > ~/.config/systemd/user/lemans-demo-reset.service <>EOF
[Unit]
Description=Reset Le Mans demo database and attachments

[Service]
Type=oneshot
ExecStart=${REMOTE_PATH}/reset-demo.sh
EOF
  systemctl --user daemon-reload
  systemctl --user enable --now lemans-demo-reset.timer
"

echo "=== Remote demo deployed at http://${REMOTE_HOST}:${APP_PORT} ==="
