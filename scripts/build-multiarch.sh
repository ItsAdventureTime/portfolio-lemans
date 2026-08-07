#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/podman/bin:$PATH"

cd "$PROJECT_ROOT"

source "${PROJECT_ROOT}/scripts/lib/common.sh"

# Pure Podman multi-arch build using manifests.
# Requires qemu-user-static for cross-architecture builds.

REGISTRY="${REGISTRY:-docker.io}"
IMAGE_PREFIX="${IMAGE_PREFIX:-library}"
DEMO_TAG="${DEMO_TAG:-latest-alpine}"
PROD_TAG="${PROD_TAG:-lts-alpine}"
IMAGE_NAME="${REGISTRY}/${IMAGE_PREFIX}/lemans-bridge-dashboard"

PLATFORMS="linux/amd64,linux/arm64"

build_and_push_manifest() {
  local tag="$1"
  local manifest_name="${IMAGE_NAME}:${tag}"

  echo "Building multi-arch manifest ${manifest_name}..."

  # Remove any existing manifest with this name to avoid conflicts
  podman manifest rm "${manifest_name}" 2> /dev/null || true

  podman build \
    --platform "$PLATFORMS" \
    --manifest "${manifest_name}" \
    -f Dockerfile.prod \
    .

  echo "Pushing manifest ${manifest_name}..."
  podman manifest push --all "${manifest_name}" "${manifest_name}"

  echo "Manifest ${manifest_name} pushed."
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
  podman manifest push --all "${IMAGE_NAME}:${DEMO_TAG}" "${IMAGE_NAME}:${PROD_TAG}"
}

case "${1:-all}" in
  demo)
    build_and_push_manifest "$DEMO_TAG"
    ;;
  prod)
    build_and_push_manifest "$PROD_TAG"
    ;;
  promote)
    promote_demo_to_prod
    ;;
  all)
    build_and_push_manifest "$DEMO_TAG"
    build_and_push_manifest "$PROD_TAG"
    ;;
  *)
    echo "Usage: $0 {demo|prod|promote|all}"
    exit 1
    ;;
esac

echo "Build complete."
