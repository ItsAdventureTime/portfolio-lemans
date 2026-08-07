#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/podman/bin:$PATH"

cd "$PROJECT_ROOT"

source "${PROJECT_ROOT}/scripts/lib/common.sh"

MODE="${1:-demo}"
if [[ "$MODE" != "demo" && "$MODE" != "prod" ]]; then
  echo "Usage: $0 [demo|prod]"
  exit 1
fi

echo "=== Building Le Mans ${MODE} image ==="

TAG="latest-alpine"
if [[ "$MODE" == "prod" ]]; then
  TAG="lts-alpine"
fi

podman build -f Dockerfile.prod -t "lemans-bridge-dashboard:${TAG}" .

echo "=== Build complete: lemans-bridge-dashboard:${TAG} ==="
