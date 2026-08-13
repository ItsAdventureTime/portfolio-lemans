#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/homebrew/bin:/opt/podman/bin:$PATH"

cd "$PROJECT_ROOT"
source "${PROJECT_ROOT}/scripts/lib/common.sh"

APP_NAME="lemans-demo-app"
GO_NAME="lemans-demo-go"
DB_NAME="lemans-demo-db"
VOLUME_NAME="lemans-demo-db-data"

echo "=== Resetting local demo to seeded state ==="

podman rm -f "$APP_NAME" 2>/dev/null || true
podman rm -f "$GO_NAME" 2>/dev/null || true
podman rm -f "$DB_NAME" 2>/dev/null || true
podman volume rm "$VOLUME_NAME" 2>/dev/null || true

echo "Local demo reset. Run ./scripts/run-local.sh to restart."
