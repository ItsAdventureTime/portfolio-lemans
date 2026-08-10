#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/podman/bin:$PATH"

cd "$PROJECT_ROOT"
source "${PROJECT_ROOT}/scripts/lib/common.sh"

APP_NAME="lemans-demo-app"
GO_NAME="lemans-demo-go"
DB_NAME="lemans-demo-db"

echo "=== Stopping Le Mans local demo ==="
podman stop "$APP_NAME" 2>/dev/null || true
podman stop "$GO_NAME" 2>/dev/null || true
podman stop "$DB_NAME" 2>/dev/null || true

echo "=== Local demo stopped ==="
