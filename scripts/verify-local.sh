#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/podman/bin:$PATH"

cd "$PROJECT_ROOT"
source "${PROJECT_ROOT}/scripts/lib/common.sh"

NODE_IMAGE="node:lts-alpine"
GO_IMAGE="golang:alpine"

echo "=== Running local verification in disposable containers ==="

fail=0

run_node() {
  podman run --rm \
    -v "${PROJECT_ROOT}:/app:rw" \
    -w /app \
    --env-file "${PROJECT_ROOT}/.env.demo" \
    "$NODE_IMAGE" sh -c "
      set -euo pipefail
      npm ci
      npm run format:check
      npm run typecheck
    " || fail=1
}

run_go() {
  podman run --rm \
    -v "${PROJECT_ROOT}/backend:/app:rw" \
    -w /app \
    "$GO_IMAGE" sh -c "
      set -euo pipefail
      apk add --no-cache git curl tar
      curl -fsSL -o /tmp/sqlc.tgz https://github.com/sqlc-dev/sqlc/releases/download/v1.29.0/sqlc_1.29.0_linux_arm64.tar.gz
      tar -xzf /tmp/sqlc.tgz -C /usr/local/bin sqlc
      sqlc generate
      go mod tidy
      go build ./cmd/api
      go test ./...
    " || fail=1
}

echo "[1/2] Node format + typecheck..."
run_node

echo "[2/2] Go generate + build + test..."
run_go

if [[ "$fail" -ne 0 ]]; then
  echo "=== Local verification FAILED ==="
  exit 1
fi

echo "=== Local verification complete ==="
