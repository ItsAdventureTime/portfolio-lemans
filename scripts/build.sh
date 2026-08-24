#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

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

BUILD_PLATFORM_ARGS=()
if [[ -n "${TARGET_PLATFORM:-}" ]]; then
  BUILD_PLATFORM_ARGS=(--platform "$TARGET_PLATFORM")
  echo "Target platform: ${TARGET_PLATFORM}"
fi

BASE_PATH="/demo/lemans"
if [[ "$MODE" == "prod" ]]; then
  BASE_PATH="/prod/lemans"
fi

docker build --pull --force-rm "${BUILD_PLATFORM_ARGS[@]}" \
  -f Dockerfile.web \
  -t "lemans-bridge-dashboard:${WEB_TAG}" \
  --build-arg NEXT_PUBLIC_BASE_PATH="${BASE_PATH}" .
docker build --pull --force-rm "${BUILD_PLATFORM_ARGS[@]}" \
  -f Dockerfile.go \
  -t "lemans-bridge-dashboard-go:${GO_TAG}" .

echo "=== Build complete ==="
echo "Web image: lemans-bridge-dashboard:${WEB_TAG}"
echo "Go image:  lemans-bridge-dashboard-go:${GO_TAG}"
