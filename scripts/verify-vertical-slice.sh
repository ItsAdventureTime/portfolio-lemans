#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/podman/bin:$PATH"

cd "$PROJECT_ROOT"
source "${PROJECT_ROOT}/scripts/lib/common.sh"

APP_NAME="lemans-demo-app"
DB_NAME="lemans-demo-db"
GO_NAME="lemans-demo-go"
PORT=3000
BASE_PATH="/lemans/demo"

echo "=== Le Mans Vertical Slice Verification ==="

echo "[1/2] Static analysis already verified via verify-local.sh"

echo "[2/2] Verifying local demo stack health..."
if ! podman ps --format '{{.Names}}' | grep -q "^${APP_NAME}$"; then
  echo "Local demo app not running. Starting with ./scripts/run-local.sh..."
  "${PROJECT_ROOT}/scripts/run-local.sh"
fi

NETWORK_NAME="lemans-demo-net"

check_url() {
  local url=$1
  local expected=${2:-200}
  local network=${3:-}
  local status
  if [[ -n "$network" ]]; then
    status=$(podman run --rm --network "$network" curlimages/curl:latest \
      -sL -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || true)
  else
    status=$(curl -sL -o /dev/null -w '%{http_code}' "$url" || true)
  fi
  status=${status:0:3}
  if [[ "${status}" != "${expected}" ]]; then
    echo "FAIL: ${url} returned ${status} (expected ${expected})"
    exit 1
  fi
  echo "OK: ${url} -> ${status}"
}

check_url "http://127.0.0.1:${PORT}${BASE_PATH}" 200
check_url "http://127.0.0.1:${PORT}${BASE_PATH}/customers" 200
check_url "http://127.0.0.1:${PORT}${BASE_PATH}/quotations" 200
check_url "http://127.0.0.1:${PORT}${BASE_PATH}/job-orders" 200
check_url "http://127.0.0.1:${PORT}${BASE_PATH}/job-orders/RA0003973" 200
check_url "http://127.0.0.1:${PORT}${BASE_PATH}/job-costing/RA0003973" 200
check_url "http://127.0.0.1:${PORT}${BASE_PATH}/purchasing" 200
check_url "http://127.0.0.1:${PORT}${BASE_PATH}/expenses" 200
check_url "http://127.0.0.1:${PORT}${BASE_PATH}/dcs" 200
check_url "http://127.0.0.1:${PORT}${BASE_PATH}/invoices" 200

check_url "http://${GO_NAME}:8080/health" 200 "$NETWORK_NAME"

published=$(podman inspect "${DB_NAME}" --format '{{json .NetworkSettings.Ports}}' 2> /dev/null | grep -c '"HostPort"' || true)
if [[ "${published}" -gt 0 ]]; then
  echo "FAIL: ${DB_NAME} publishes host ports"
  exit 1
fi
echo "OK: ${DB_NAME} has no published host ports"

echo "=== Verification complete ==="
