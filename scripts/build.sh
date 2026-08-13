#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/homebrew/bin:/opt/podman/bin:$PATH"

cd "$PROJECT_ROOT"
source "${PROJECT_ROOT}/scripts/lib/common.sh"

MODE="${1:-demo}"
if [[ "$MODE" != "demo" && "$MODE" != "prod" ]]; then
  echo "Usage: $0 [demo|prod]"
  exit 1
fi

WEB_TAG="demo-web"
GO_TAG="demo-go"
if [[ "$MODE" == "prod" ]]; then
  WEB_TAG="prod-web"
  GO_TAG="prod-go"
fi

echo "=== Building Le Mans ${MODE} images ==="

BASE_PATH="/lemans/demo"
if [[ "$MODE" == "prod" ]]; then
  BASE_PATH="/lemans"
fi

podman build -f Dockerfile.web -t "lemans-bridge-dashboard:${WEB_TAG}" --build-arg NEXT_PUBLIC_BASE_PATH="${BASE_PATH}" .
podman build -f Dockerfile.go -t "lemans-bridge-dashboard-go:${GO_TAG}" .

echo "=== Build complete ==="
echo "Web image: lemans-bridge-dashboard:${WEB_TAG}"
echo "Go image:  lemans-bridge-dashboard-go:${GO_TAG}"
