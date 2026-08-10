#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/podman/bin:$PATH"

cd "$PROJECT_ROOT"
source "${PROJECT_ROOT}/scripts/lib/common.sh"

REMOTE_USER="${REMOTE_USER:-jk}"
REMOTE_HOST="${REMOTE_HOST:-}"
REMOTE_PATH="${REMOTE_PATH:-/home/jk/bridge-ph/lemans-demo}"
QUADLET_PATH="${QUADLET_PATH:-/home/jk/.config/containers/systemd/bridge-ph/lemans-demo}"
APP_PORT=3002
DB_VOLUME="lemans-remote-demo-db-data"
NETWORK_NAME="lemans-remote-demo-net"
APP_CONTAINER="lemans-remote-demo-app"
GO_CONTAINER="lemans-remote-demo-go"
DB_CONTAINER="lemans-remote-demo-db"
WEB_IMAGE="docker.io/library/lemans-bridge-dashboard:demo-web"
GO_IMAGE="docker.io/library/lemans-bridge-dashboard-go:demo-go"

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

echo "=== Deploying remote demo to ${REMOTE_HOST} ==="

echo "[1/4] Building local images..."
./scripts/build.sh demo

# Save and transfer images to remote when no registry is configured.
echo "[2/4] Transferring images to remote..."
podman save "${WEB_IMAGE}" | ssh "${REMOTE_USER}@${REMOTE_HOST}" "podman load"
podman save "${GO_IMAGE}" | ssh "${REMOTE_USER}@${REMOTE_HOST}" "podman load"

echo "[3/4] Syncing Quadlets to remote..."
rsync -avz "${PROJECT_ROOT}/quadlet/remote-demo/" "${REMOTE_USER}@${REMOTE_HOST}:${QUADLET_PATH}/"

echo "[4/4] Creating remote environment file and starting services..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ${QUADLET_PATH} && cat > ${QUADLET_PATH}/lemans-demo.env <>EOF
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@${DB_CONTAINER}:5432/lemans_remote_demo_db
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
B2_ACCESS_KEY_ID=${B2_ACCESS_KEY_ID}
B2_SECRET_ACCESS_KEY=${B2_SECRET_ACCESS_KEY}
B2_BUCKET_NAME=lemans-remote-demo-attachments
EOF
  export PATH=\"/opt/podman/bin:\$PATH\"
  systemctl --user daemon-reload
  systemctl --user start ${DB_CONTAINER}.service
  for i in {1..30}; do
    if podman exec ${DB_CONTAINER} pg_isready -U postgres > /dev/null 2>&1; then echo 'DB ready'; break; fi
    sleep 1
  done
  systemctl --user start ${GO_CONTAINER}.service
  for i in {1..30}; do
    if curl -s -o /dev/null -w '%{http_code}' http://${GO_CONTAINER}:8080/health 2>/dev/null | grep -q '^200$'; then echo 'Go API ready'; break; fi
    sleep 1
  done
  curl -s -X POST http://${GO_CONTAINER}:8080/admin/seed -H 'Content-Type: application/json' -d '{}'
  echo 'Database seeded'
  systemctl --user start ${APP_CONTAINER}.service
"

echo "=== Remote demo deployed at https://${REMOTE_HOST}/lemans/demo ==="
