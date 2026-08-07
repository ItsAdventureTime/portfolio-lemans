#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/podman/bin:$PATH"

cd "$PROJECT_ROOT"

source "${PROJECT_ROOT}/scripts/lib/common.sh"

APP_NAME="lemans-demo-app"
DB_NAME="lemans-demo-db"
PORT=3000

echo "=== Le Mans Phase 4/5 Verification ==="

# 1. Static analysis inside a single disposable container
echo "[1/4] Running format check, lint, and type-check inside disposable container..."
podman run --rm \
  -v "${PROJECT_ROOT}:/app:rw" \
  -w /app \
  --env-file "${PROJECT_ROOT}/.env.demo" \
  -e NODE_ENV=test \
  node:20-alpine3.20 sh -c "
    apk add --no-cache openssl curl bash
    npm run format:check
    npm run lint
    npm run typecheck
  "

# 2. Tests inside a single disposable container
echo "[2/4] Running unit/integration tests inside disposable container..."
NETWORK_NAME="lemans-demo-net"
DB_NAME="lemans-demo-db"
DB_URL="postgresql://postgres:postgres_demo_pass@${DB_NAME}:5432/lemans_demo_db?schema=public"

# Ensure demo network exists for tests
if ! podman network exists "$NETWORK_NAME"; then
  podman network create "$NETWORK_NAME"
fi

podman run --rm \
  -v "${PROJECT_ROOT}:/app:rw" \
  -w /app \
  --network "$NETWORK_NAME" \
  --env-file "${PROJECT_ROOT}/.env.demo" \
  -e NODE_ENV=test \
  -e DATABASE_URL="$DB_URL" \
  node:20-alpine3.20 sh -c "
    apk add --no-cache openssl curl bash gcompat
    npx prisma generate
    npm test
  "

# 3. Ensure local demo stack is running
echo "[3/4] Verifying local demo stack health..."
if ! podman ps --format '{{.Names}}' | grep -q "^${APP_NAME}$"; then
  echo "Local demo app not running. Starting with ./scripts/run-local.sh..."
  "${PROJECT_ROOT}/scripts/run-local.sh"
fi

check_url() {
  local url=$1
  local expected=${2:-200}
  shift 2 || true
  local status
  status=$(curl -s -o /dev/null -w '%{http_code}' "$@" "${url}")
  status=${status:0:3}
  if [[ "${status}" != "${expected}" ]]; then
    echo "FAIL: ${url} returned ${status} (expected ${expected})"
    exit 1
  fi
  echo "OK: ${url} -> ${status}"
}

# 4. Health checks on local demo
echo "[4/4] HTTP health checks on local demo..."
DEMO_TOKEN=$(curl -s "http://127.0.0.1:${PORT}/api/auth/sign-in/email" -X POST -H 'Content-Type: application/json' -d '{"email":"admin@lemans.ph","password":"demo12345"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
DEMO_COOKIE="better-auth.session_token=${DEMO_TOKEN}"

check_url "http://127.0.0.1:${PORT}/login" 200
check_url "http://127.0.0.1:${PORT}/" 307
check_url "http://127.0.0.1:${PORT}/customers" 200 -H "Cookie: ${DEMO_COOKIE}"
check_url "http://127.0.0.1:${PORT}/quotations" 200 -H "Cookie: ${DEMO_COOKIE}"
check_url "http://127.0.0.1:${PORT}/job-orders" 200 -H "Cookie: ${DEMO_COOKIE}"
check_url "http://127.0.0.1:${PORT}/job-orders/RA0003973" 200 -H "Cookie: ${DEMO_COOKIE}"
check_url "http://127.0.0.1:${PORT}/job-costing/RA0003973" 200 -H "Cookie: ${DEMO_COOKIE}"
check_url "http://127.0.0.1:${PORT}/purchasing" 200 -H "Cookie: ${DEMO_COOKIE}"
check_url "http://127.0.0.1:${PORT}/expenses" 200 -H "Cookie: ${DEMO_COOKIE}"
check_url "http://127.0.0.1:${PORT}/dcs" 200 -H "Cookie: ${DEMO_COOKIE}"
check_url "http://127.0.0.1:${PORT}/invoices" 200 -H "Cookie: ${DEMO_COOKIE}"

# Confirm DB container has no published host ports
echo "[4/4] Confirming database container does not publish host ports..."
published=$(podman inspect "${DB_NAME}" --format '{{json .NetworkSettings.Ports}}' 2> /dev/null | grep -c '"HostPort"' || true)
if [[ "${published}" -gt 0 ]]; then
  echo "FAIL: ${DB_NAME} publishes host ports"
  exit 1
fi
echo "OK: ${DB_NAME} has no published host ports"

echo "=== Verification complete ==="
