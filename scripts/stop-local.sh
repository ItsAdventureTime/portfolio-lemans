#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/podman/bin:$PATH"

cd "$PROJECT_ROOT"

source "${PROJECT_ROOT}/scripts/lib/common.sh"

NETWORK_NAME="lemans-demo-net"
VOLUME_NAME="lemans-demo-db-data"
DB_NAME="lemans-demo-db"
APP_NAME="lemans-demo-app"
PORT=3000

echo "=== Stopping Le Mans local demo ==="
podman stop "$APP_NAME" 2> /dev/null || true
podman stop "$DB_NAME" 2> /dev/null || true

echo "=== Local demo stopped ==="
