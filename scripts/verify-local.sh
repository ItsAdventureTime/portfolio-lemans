#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/podman/bin:$PATH"

cd "$PROJECT_ROOT"

source "${PROJECT_ROOT}/scripts/lib/common.sh"

echo "=== Running local verification in disposable container ==="

podman run --rm \
  -v "${PROJECT_ROOT}:/app:rw" \
  -w /app \
  --env-file "${PROJECT_ROOT}/.env.demo" \
  -e NODE_ENV=test \
  node:20-alpine sh -c "
    apk add --no-cache openssl curl bash
    npm run format:check
    npm run lint
    npm run typecheck
  "

echo "=== Running unit tests in disposable container ==="

podman run --rm \
  -v "${PROJECT_ROOT}:/app:rw" \
  -w /app \
  --env-file "${PROJECT_ROOT}/.env.demo" \
  -e NODE_ENV=test \
  node:20-alpine sh -c "
    apk add --no-cache openssl curl bash
    npm test
  "

echo "=== Local verification complete ==="
