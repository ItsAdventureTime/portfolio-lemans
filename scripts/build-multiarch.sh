#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/podman/bin:$PATH"

cd "$PROJECT_ROOT"

source "${PROJECT_ROOT}/scripts/lib/common.sh"

echo "=== Multi-arch build for demo and production ==="

REGISTRY="${REGISTRY:-docker.io}"
IMAGE_PREFIX="${IMAGE_PREFIX:-library}"
DEMO_TAG="${DEMO_TAG:-latest-alpine}"
PROD_TAG="${PROD_TAG:-lts-alpine}"
IMAGE_NAME="${REGISTRY}/${IMAGE_PREFIX}/lemans-bridge-dashboard"

BUILDER="${BUILDER:-lemans-multiarch}"

ensure_builder() {
  if ! podman buildx inspect "${BUILDER}" > /dev/null 2>&amp;1; then
    podman buildx create --name "${BUILDER}" --platform linux/amd64,linux/arm64 --use
  fi
}

build_demo() {
  echo "Building demo image ${IMAGE_NAME}:${DEMO_TAG}..."
  podman buildx build \
    --platform linux/amd64,linux/arm64 \
    -t "${IMAGE_NAME}:${DEMO_TAG}" \
    -f Dockerfile.prod \
    --push \
    .
}

build_prod() {
  echo "Building production image ${IMAGE_NAME}:${PROD_TAG}..."
  podman buildx build \
    --platform linux/amd64,linux/arm64 \
    -t "${IMAGE_NAME}:${PROD_TAG}" \
    -f Dockerfile.prod \
    --push \
    .
}

promote_demo_to_prod() {
  demo_cmd=$(podman inspect "${IMAGE_NAME}:${DEMO_TAG}" --format '{{json .Config.Cmd}}' 2> /dev/null || true)
  if [[ "$demo_cmd" != *"node server.js"* ]]; then
    echo "Refusing to promote ${IMAGE_NAME}:${DEMO_TAG}: not built from Dockerfile.prod (Cmd: ${demo_cmd})"
    exit 1
  fi
  digest=$(podman inspect "${IMAGE_NAME}:${DEMO_TAG}" --format '{{index .RepoDigests 0}}' || true)
  if [[ -z "$digest" ]]; then
    echo "Could not resolve digest for ${IMAGE_NAME}:${DEMO_TAG}"
    exit 1
  fi
  echo "Promoting ${digest} to ${IMAGE_NAME}:${PROD_TAG}"
  podman buildx imagetools create -t "${IMAGE_NAME}:${PROD_TAG}" "$digest"
}

case "${1:-all}" in
  demo)
    ensure_builder
    build_demo
    ;;
  prod)
    ensure_builder
    build_prod
    ;;
  promote)
    promote_demo_to_prod
    ;;
  all)
    ensure_builder
    build_demo
    build_prod
    ;;
  *)
    echo "Usage: $0 {demo|prod|promote|all}"
    exit 1
    ;;
esac

echo "Build complete."
