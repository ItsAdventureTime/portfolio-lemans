#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_ROOT"
source "${PROJECT_ROOT}/scripts/lib/common.sh"

APP_NAME="lemans-demo-app"
GO_NAME="lemans-demo-go"
DB_NAME="lemans-demo-db"

echo "=== Stopping Le Mans local demo ==="
docker stop "$APP_NAME" 2>/dev/null || true
docker stop "$GO_NAME" 2>/dev/null || true
docker stop "$DB_NAME" 2>/dev/null || true
docker rm "$APP_NAME" "$GO_NAME" "$DB_NAME" 2>/dev/null || true

echo "=== Local demo stopped ==="
