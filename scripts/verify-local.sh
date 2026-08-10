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
  node:lts-alpine sh -c "
    npm ci
    npm run format:check
    npm run typecheck
  "

echo "=== Running Go checks ==="
podman run --rm \
  -v "${PROJECT_ROOT}/backend:/app:rw" \
  -w /app \
  golang:alpine sh -c "
    apk add --no-cache git curl tar
    curl -fsSL -o /tmp/sqlc.tgz https://github.com/sqlc-dev/sqlc/releases/download/v1.29.0/sqlc_1.29.0_linux_arm64.tar.gz
    tar -xzf /tmp/sqlc.tgz -C /usr/local/bin sqlc
    sqlc generate
    go mod tidy
    go build ./cmd/api
    go test ./...
  "

echo "=== Local verification complete ==="
