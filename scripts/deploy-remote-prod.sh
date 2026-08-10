#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/podman/bin:$PATH"

cd "$PROJECT_ROOT"
source "${PROJECT_ROOT}/scripts/lib/common.sh"

REMOTE_USER="${REMOTE_USER:-jk}"
REMOTE_HOST="${REMOTE_HOST:-}"
REMOTE_PATH="${REMOTE_PATH:-/home/jk/bridge-ph/lemans}"
QUADLET_PATH="${QUADLET_PATH:-/home/jk/.config/containers/systemd/bridge-ph/lemans}"
APP_PORT=3003
DB_VOLUME="lemans-prod-db-data"
DB_CONTAINER="lemans-prod-db"
GO_CONTAINER="lemans-prod-go"
APP_CONTAINER="lemans-prod-app"
WEB_IMAGE="docker.io/library/lemans-bridge-dashboard:prod-web"
GO_IMAGE="docker.io/library/lemans-bridge-dashboard-go:prod-go"

if [[ -z "$REMOTE_HOST" ]]; then
  echo "Error: REMOTE_HOST is required."
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
RELEASE_COMMIT="$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
RELEASE_TIME="$(date -u +%Y%m%d-%H%M%S)"
RELEASE_ID="${RELEASE_TIME}-${RELEASE_COMMIT:0:8}"
RELEASE_DIR="${REMOTE_PATH}/releases"

echo "=== Deploying remote production to ${REMOTE_HOST} ==="

echo "[1/5] Verifying local images..."
if ! podman image exists "$WEB_IMAGE"; then
  echo "Error: web image ${WEB_IMAGE} not found. Run ./scripts/build.sh prod first."
  exit 1
fi
if ! podman image exists "$GO_IMAGE"; then
  echo "Error: Go image ${GO_IMAGE} not found. Run ./scripts/build.sh prod first."
  exit 1
fi

WEB_DIGEST="$(podman image inspect "$WEB_IMAGE" --format '{{.Digest}}' 2>/dev/null || echo 'unknown')"
GO_DIGEST="$(podman image inspect "$GO_IMAGE" --format '{{.Digest}}' 2>/dev/null || echo 'unknown')"

echo "[2/5] Building local images (if needed)..."
./scripts/build.sh prod

WEB_DIGEST="$(podman image inspect "$WEB_IMAGE" --format '{{.Digest}}' 2>/dev/null || echo 'unknown')"
GO_DIGEST="$(podman image inspect "$GO_IMAGE" --format '{{.Digest}}' 2>/dev/null || echo 'unknown')"

echo "[3/5] Transferring images to remote..."
podman save "$WEB_IMAGE" | ssh "${REMOTE_USER}@${REMOTE_HOST}" "podman load"
podman save "$GO_IMAGE" | ssh "${REMOTE_USER}@${REMOTE_HOST}" "podman load"

echo "[4/5] Syncing Quadlets to remote..."
rsync -avz --delete "${PROJECT_ROOT}/quadlet/remote-prod/" "${REMOTE_USER}@${REMOTE_HOST}:${QUADLET_PATH}/"

echo "[5/5] Creating remote environment, secret, and release manifest..."
ENV_FILE="${PROJECT_ROOT}/.lemans-prod.env.tmp"
cat > "$ENV_FILE" <<EOF
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@${DB_CONTAINER}:5432/lemans_prod_db
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
B2_ACCESS_KEY_ID=${B2_ACCESS_KEY_ID}
B2_SECRET_ACCESS_KEY=${B2_SECRET_ACCESS_KEY}
B2_BUCKET_NAME=lemans-prod-attachments
DEMO_MODE=false
API_BASE_URL=http://${GO_CONTAINER}:8080
EOF

RELEASE_FILE="${PROJECT_ROOT}/.lemans-prod-release.json.tmp"
cat > "$RELEASE_FILE" <<EOF
{
  "release_id": "${RELEASE_ID}",
  "commit": "${RELEASE_COMMIT}",
  "time": "${RELEASE_TIME}",
  "web_image_digest": "${WEB_DIGEST}",
  "go_image_digest": "${GO_DIGEST}"
}
EOF

scp "$ENV_FILE" "${REMOTE_USER}@${REMOTE_HOST}:${QUADLET_PATH}/lemans.env"
scp "$RELEASE_FILE" "${REMOTE_USER}@${REMOTE_HOST}:${RELEASE_DIR}/${RELEASE_ID}.json"
rm -f "$ENV_FILE" "$RELEASE_FILE"

ssh "${REMOTE_USER}@${REMOTE_HOST}" <<REMOTE_SCRIPT
  set -euo pipefail
  export PATH="/opt/podman/bin:\$PATH"

  mkdir -p ${RELEASE_DIR}
  chmod 600 ${QUADLET_PATH}/lemans.env

  if ! podman secret exists db_password; then
    printf '%s' '${DB_PASSWORD}' | podman secret create db_password -
  else
    printf '%s' '${DB_PASSWORD}' | podman secret create --replace db_password -
  fi

  systemctl --user daemon-reload

  echo "Starting database service..."
  systemctl --user start ${DB_CONTAINER}.service
REMOTE_SCRIPT

echo "Waiting for services and running verification..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" <<REMOTE_SCRIPT
  set -euo pipefail
  export PATH="/opt/podman/bin:\$PATH"

  for i in {1..30}; do
    if podman exec ${DB_CONTAINER} pg_isready -U postgres > /dev/null 2>&1; then
      echo "DB ready"
      break
    fi
    sleep 1
  done
  if ! podman exec ${DB_CONTAINER} pg_isready -U postgres > /dev/null 2>&1; then
    echo "Error: database did not become ready"
    exit 1
  fi

  systemctl --user start ${GO_CONTAINER}.service
  for i in {1..30}; do
    status=\$(curl -s -o /dev/null -w '%{http_code}' "http://${GO_CONTAINER}:8080/health" 2>/dev/null || true)
    if [[ "\$status" == "200" ]]; then
      echo "Go API ready"
      break
    fi
    sleep 1
  done
  if [[ "\$(curl -s -o /dev/null -w '%{http_code}' "http://${GO_CONTAINER}:8080/health" 2>/dev/null || true)" != "200" ]]; then
    echo "Error: Go API health check failed"
    exit 1
  fi

  systemctl --user start ${APP_CONTAINER}.service
  for i in {1..30}; do
    status=\$(curl -sL -o /dev/null -w '%{http_code}' "http://127.0.0.1:${APP_PORT}/lemans" 2>/dev/null || true)
    if [[ "\$status" == "200" ]]; then
      echo "Web app ready"
      break
    fi
    sleep 1
  done
  if [[ "\$(curl -sL -o /dev/null -w '%{http_code}' "http://127.0.0.1:${APP_PORT}/lemans" 2>/dev/null || true)" != "200" ]]; then
    echo "Error: web app health check failed"
    exit 1
  fi

  echo "Running deployment verification..."
  fail=0
  check() {
    local url=\$1
    local expected=\${2:-200}
    local status
    status=\$(curl -sL -o /dev/null -w '%{http_code}' "\$url" 2>/dev/null || true)
    if [[ "\$status" != "\$expected" ]]; then
      echo "FAIL: \$url returned \$status (expected \$expected)"
      fail=1
    else
      echo "OK: \$url -> \$status"
    fi
  }

  check "http://127.0.0.1:${APP_PORT}/lemans" 200
  check "http://${GO_CONTAINER}:8080/health" 200

  published=\$(podman inspect ${DB_CONTAINER} --format '{{json .NetworkSettings.Ports}}' 2>/dev/null | grep -c '"HostPort"' || true)
  if [[ "\$published" -gt 0 ]]; then
    echo "FAIL: ${DB_CONTAINER} publishes host ports"
    fail=1
  else
    echo "OK: ${DB_CONTAINER} has no published host ports"
  fi

  if [[ "\$fail" -ne 0 ]]; then
    echo "Error: deployment verification failed"
    exit 1
  fi

  echo "Deployment verification complete"
REMOTE_SCRIPT

echo "=== Remote production deployed at https://${REMOTE_HOST}/lemans ==="
echo "Release: ${RELEASE_ID}"
echo "Web digest: ${WEB_DIGEST}"
echo "Go digest: ${GO_DIGEST}"
