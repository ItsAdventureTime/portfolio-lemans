#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

APP_NAME="lemans-demo-app"
NETWORK_NAME="lemans-demo-net"
PLAYWRIGHT_IMAGE="mcr.microsoft.com/playwright:v1.62.1-noble"

cd "$PROJECT_ROOT"
LOCAL_PLATFORM="$(docker info --format '{{.OSType}}/{{.Architecture}}')"

if ! docker ps --format '{{.Names}}' | grep -qx "$APP_NAME"; then
  echo "Local demo app is not running. Starting it with ./scripts/run-local.sh..."
  "${PROJECT_ROOT}/scripts/run-local.sh"
fi

if ! docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
  echo "Missing required Docker network: $NETWORK_NAME" >&2
  exit 1
fi

echo "=== Playwright demo verification ==="
docker run --rm \
  --platform "$LOCAL_PLATFORM" \
  --network "$NETWORK_NAME" \
  -e PLAYWRIGHT_BASE_URL="http://${APP_NAME}:3000" \
  -v "${PROJECT_ROOT}:/src:ro" \
  "$PLAYWRIGHT_IMAGE" \
  bash -lc 'set -euo pipefail
    mkdir -p /work
    tar -C /src \
      --exclude=./node_modules \
      --exclude=./.next \
      --exclude=./test-results \
      --exclude=./playwright-report \
      --exclude=./e2e-results.json \
      -cf - . | tar -C /work -xf -
    cd /work
    npm ci --ignore-scripts
    npx playwright test'

echo "=== Playwright verification complete ==="
