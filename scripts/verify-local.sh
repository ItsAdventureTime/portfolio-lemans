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
  node:20-alpine3.20 sh -c "
    apk add --no-cache openssl curl bash
    npm run format:check
    npm run lint
    npm run typecheck
  "

echo "=== Running unit tests in disposable container ==="

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
    apk add --no-cache openssl curl bash
    npx prisma generate
    npm test
  "

echo "=== Local verification complete ==="
