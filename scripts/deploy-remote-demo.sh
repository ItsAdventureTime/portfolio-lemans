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
DB_VOLUME="lemans-demo-db-data"
NETWORK_NAME="lemans-demo-net"
APP_CONTAINER="lemans-demo-app"
GO_CONTAINER="lemans-demo-go"
DB_CONTAINER="lemans-demo-db"
APP_SERVICE="lemans-demo.service"
GO_SERVICE="lemans-demo-go.service"
DB_SERVICE="lemans-demo-db.service"
WEB_IMAGE="docker.io/library/lemans-bridge-dashboard:demo-web"
GO_IMAGE="docker.io/library/lemans-bridge-dashboard-go:demo-go"
PUBLIC_URL="https://${REMOTE_HOST}/lemans/demo"
RESET_FLAG="${RESET:-false}"
RELEASE_DIR="${REMOTE_PATH}/releases"

if [[ -z "$REMOTE_HOST" ]]; then
  echo "Error: REMOTE_HOST is required. Example: REMOTE_HOST=vps.example.com ./scripts/deploy-remote-demo.sh"
  exit 1
fi

PUBLIC_URL="https://${REMOTE_HOST}/lemans/demo"
RELEASE_COMMIT="$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
RELEASE_TIME="$(date -u +%Y%m%d-%H%M%S)"
RELEASE_ID="${RELEASE_TIME}-${RELEASE_COMMIT:0:8}"

if [[ -z "${B2_ACCESS_KEY_ID:-}" ]] || [[ -z "${B2_SECRET_ACCESS_KEY:-}" ]]; then
  echo "Backblaze B2 credentials required for remote demo."
  echo -n "B2 Access Key ID: "
  read -r B2_ACCESS_KEY_ID
  echo -n "B2 Secret Access Key: "
  read -rs B2_SECRET_ACCESS_KEY
  echo
fi

DB_PASSWORD="$(generate_password)"

ENV_FILE="${PROJECT_ROOT}/.lemans-demo.env.tmp"
RELEASE_FILE="${PROJECT_ROOT}/.lemans-demo-release.json.tmp"

cleanup_temp() {
  rm -f "$ENV_FILE" "$RELEASE_FILE"
}
trap cleanup_temp EXIT

cat > "$ENV_FILE" <<EOF
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@${DB_CONTAINER}:5432/lemans_demo_db
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
B2_ACCESS_KEY_ID=${B2_ACCESS_KEY_ID}
B2_SECRET_ACCESS_KEY=${B2_SECRET_ACCESS_KEY}
B2_BUCKET_NAME=lemans-demo-attachments
DEMO_MODE=true
DEMO_PUBLIC_URL=${PUBLIC_URL}
NEXT_PUBLIC_BASE_PATH=/lemans/demo
API_BASE_URL=http://${GO_CONTAINER}:8080
EOF

chmod 600 "$ENV_FILE" "$RELEASE_FILE"

cat > "$RELEASE_FILE" <<EOF
{
  "release_id": "${RELEASE_ID}",
  "commit": "${RELEASE_COMMIT}",
  "time": "${RELEASE_TIME}",
  "web_image_digest": "",
  "go_image_digest": "",
  "public_url": "${PUBLIC_URL}"
}
EOF

ssh "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ${RELEASE_DIR} ${QUADLET_PATH}"

echo "=== Deploying remote demo to ${REMOTE_HOST} ==="

echo "[1/6] Verifying local images..."
if ! podman image exists "$WEB_IMAGE"; then
  echo "Error: web image ${WEB_IMAGE} not found. Run ./scripts/build.sh demo first."
  exit 1
fi
if ! podman image exists "$GO_IMAGE"; then
  echo "Error: Go image ${GO_IMAGE} not found. Run ./scripts/build.sh demo first."
  exit 1
fi

WEB_DIGEST="$(podman image inspect "$WEB_IMAGE" --format '{{.Digest}}' 2>/dev/null || echo 'unknown')"
GO_DIGEST="$(podman image inspect "$GO_IMAGE" --format '{{.Digest}}' 2>/dev/null || echo 'unknown')"

sed -i.bak "s/\"web_image_digest\": \"\"/\"web_image_digest\": \"${WEB_DIGEST}\"/" "$RELEASE_FILE"
sed -i.bak "s/\"go_image_digest\": \"\"/\"go_image_digest\": \"${GO_DIGEST}\"/" "$RELEASE_FILE"
rm -f "${RELEASE_FILE}.bak"

echo "[2/6] Building local images (if needed)..."
./scripts/build.sh demo

WEB_DIGEST="$(podman image inspect "$WEB_IMAGE" --format '{{.Digest}}' 2>/dev/null || echo 'unknown')"
GO_DIGEST="$(podman image inspect "$GO_IMAGE" --format '{{.Digest}}' 2>/dev/null || echo 'unknown')"

sed -i.bak "s/\"web_image_digest\": \"[^\"]*\"/\"web_image_digest\": \"${WEB_DIGEST}\"/" "$RELEASE_FILE"
sed -i.bak "s/\"go_image_digest\": \"[^\"]*\"/\"go_image_digest\": \"${GO_DIGEST}\"/" "$RELEASE_FILE"
rm -f "${RELEASE_FILE}.bak"

echo "[3/6] Transferring images to remote..."
podman save "$WEB_IMAGE" | ssh "${REMOTE_USER}@${REMOTE_HOST}" "podman load"
podman save "$GO_IMAGE" | ssh "${REMOTE_USER}@${REMOTE_HOST}" "podman load"

echo "[4/6] Syncing Quadlets to remote..."
rsync -avz --delete "${PROJECT_ROOT}/quadlet/remote-demo/" "${REMOTE_USER}@${REMOTE_HOST}:${QUADLET_PATH}/"

echo "[5/6] Uploading environment, secret, and release manifest..."
scp "$ENV_FILE" "${REMOTE_USER}@${REMOTE_HOST}:${QUADLET_PATH}/lemans-demo.env"
scp "$RELEASE_FILE" "${REMOTE_USER}@${REMOTE_HOST}:${RELEASE_DIR}/${RELEASE_ID}.json"

cleanup_temp
trap - EXIT

ssh "${REMOTE_USER}@${REMOTE_HOST}" <<'REMOTE_SCRIPT'
  set -euo pipefail
  export PATH="/opt/podman/bin:$PATH"

  chmod 600 ${QUADLET_PATH}/lemans-demo.env
  ls -l ${QUADLET_PATH}/lemans-demo.env

  if ! podman secret exists db_password; then
    printf '%s' '${DB_PASSWORD}' | podman secret create db_password -
  else
    printf '%s' '${DB_PASSWORD}' | podman secret create --replace db_password -
  fi

  echo "Validating generated units..."
  if ! systemd-analyze --user --generators=true verify ${DB_SERVICE} ${GO_SERVICE} ${APP_SERVICE} lemans-demo-reset.service lemans-demo-reset.timer 2>/dev/null; then
    echo "Error: generated unit verification failed"
    exit 1
  fi

  systemctl --user daemon-reload

  echo "Enabling demo reset timer..."
  systemctl --user enable lemans-demo-reset.timer
  if ! systemctl --user start lemans-demo-reset.timer; then
    echo "Error: failed to start lemans-demo-reset.timer"
    exit 1
  fi

  echo "Starting database service..."
  if ! systemctl --user start ${DB_SERVICE}; then
    echo "Error: failed to start ${DB_SERVICE}"
    exit 1
  fi
REMOTE_SCRIPT

echo "[6/6] Waiting for services and running verification..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" <<'REMOTE_SCRIPT'
  set -euo pipefail
  export PATH="/opt/podman/bin:$PATH"

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

  echo "Starting Go API service..."
  if ! systemctl --user start ${GO_SERVICE}; then
    echo "Error: failed to start ${GO_SERVICE}"
    exit 1
  fi

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

  if [[ "${RESET_FLAG}" == "true" ]]; then
    echo "RESET=true requested; seeding demo database..."
    curl -s -X POST "http://${GO_CONTAINER}:8080/admin/seed" -H 'Content-Type: application/json' -d '{}'
    echo "Database seeded"
  fi

  echo "Starting web app service..."
  if ! systemctl --user start ${APP_SERVICE}; then
    echo "Error: failed to start ${APP_SERVICE}"
    exit 1
  fi

  for i in {1..30}; do
    status=\$(curl -sL -o /dev/null -w '%{http_code}' "http://127.0.0.1:${APP_PORT}/lemans/demo" 2>/dev/null || true)
    if [[ "\$status" == "200" ]]; then
      echo "Web app ready"
      break
    fi
    sleep 1
  done
  if [[ "\$(curl -sL -o /dev/null -w '%{http_code}' "http://127.0.0.1:${APP_PORT}/lemans/demo" 2>/dev/null || true)" != "200" ]]; then
    echo "Error: web app health check failed"
    exit 1
  fi

  echo "Checking demo reset timer status..."
  systemctl --user status lemans-demo-reset.timer --no-pager || true

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

  check "http://127.0.0.1:${APP_PORT}/lemans/demo" 200
  check "http://127.0.0.1:${APP_PORT}/lemans/demo/customers" 200
  check "http://127.0.0.1:${APP_PORT}/lemans/demo/quotations" 200
  check "http://127.0.0.1:${APP_PORT}/lemans/demo/job-orders" 200
  check "http://127.0.0.1:${APP_PORT}/lemans/demo/purchasing" 200
  check "http://127.0.0.1:${APP_PORT}/lemans/demo/dcs" 200
  check "http://127.0.0.1:${APP_PORT}/lemans/demo/invoices" 200

  static_url=\$(curl -sL "http://127.0.0.1:${APP_PORT}/lemans/demo" | grep -oE '(/lemans/demo/_next/static/[^"]+)' | head -n 1 || true)
  if [[ -n "\$static_url" ]]; then
    check "http://127.0.0.1:${APP_PORT}\$static_url" 200
  else
    echo "WARN: could not find a static asset URL to verify"
  fi

  check "http://${GO_CONTAINER}:8080/health" 200

  published=\$(podman inspect ${DB_CONTAINER} --format '{{json .NetworkSettings.Ports}}' 2>/dev/null | grep -c '"HostPort"' || true)
  if [[ "\$published" -gt 0 ]]; then
    echo "FAIL: ${DB_CONTAINER} publishes host ports"
    fail=1
  else
    echo "OK: ${DB_CONTAINER} has no published host ports"
  fi

  actor_status=\$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${APP_PORT}/lemans/demo/api/actor" 2>/dev/null || true)
  if [[ "\$actor_status" != "200" ]]; then
    echo "WARN: actor endpoint returned \$actor_status"
  else
    echo "OK: actor endpoint reachable (default Admin)"
  fi

  role_body='{"role":"ROLE_SALES"}'
  role_status=\$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d "\$role_body" "http://127.0.0.1:${APP_PORT}/lemans/demo/api/set-role" 2>/dev/null || true)
  if [[ "\$role_status" != "200" ]]; then
    echo "WARN: role-switching endpoint returned \$role_status"
  else
    echo "OK: role switching endpoint reachable"
  fi

  if [[ "\$fail" -ne 0 ]]; then
    echo "Error: deployment verification failed"
    exit 1
  fi

  echo "Deployment verification complete"
REMOTE_SCRIPT

echo "=== Remote demo deployed at ${PUBLIC_URL} ==="
echo "Release: ${RELEASE_ID}"
echo "Web digest: ${WEB_DIGEST}"
echo "Go digest: ${GO_DIGEST}"
echo "Release manifest: ${RELEASE_DIR}/${RELEASE_ID}.json"
echo "To reset: RESET=true REMOTE_HOST=${REMOTE_HOST} ./scripts/deploy-remote-demo.sh"
