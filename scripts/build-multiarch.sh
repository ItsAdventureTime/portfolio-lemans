#!/usr/bin/env bash
set -euo pipefail

# Multi-arch image build for Le Mans Operations app.
# Run inside a CI runner with podman + buildah and qemu-user-static for cross-builds.
#
# Targets:
#   - docker.io/library/lemans-bridge-dashboard:latest-slim  (demo / remote demo)
#   - docker.io/library/lemans-bridge-dashboard:lts-slim     (production)
#
# The image is built locally on ARM64 macOS, pushed to a registry, and pulled by
# remote x86_64 Linux hosts. The same digest that passes demo health checks is
# promoted to production by re-tagging the already-tested image.

REGISTRY="${REGISTRY:-docker.io}"
IMAGE_PREFIX="${IMAGE_PREFIX:-library}"
DEMO_TAG="${DEMO_TAG:-latest-slim}"
PROD_TAG="${PROD_TAG:-lts-slim}"
IMAGE_NAME="${REGISTRY}/${IMAGE_PREFIX}/lemans-bridge-dashboard"

BUILDER="${BUILDER:-lemans-multiarch}"

ensure_builder() {
  if ! podman buildx inspect "${BUILDER}" >/dev/null 2>&1; then
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
  echo "Building prod image ${IMAGE_NAME}:${PROD_TAG}..."
  podman buildx build \
    --platform linux/amd64,linux/arm64 \
    -t "${IMAGE_NAME}:${PROD_TAG}" \
    -f Dockerfile.prod \
    --push \
    .
}

promote_demo_to_prod() {
  # Only permit promotion when demo was built from the production Dockerfile.
  # Verify the demo image runs the standalone Next.js server (node server.js).
  demo_cmd=$(podman inspect "${IMAGE_NAME}:${DEMO_TAG}" --format '{{json .Config.Cmd}}' 2>/dev/null || true)
  if [[ "$demo_cmd" != *"node server.js"* ]]; then
    echo "Refusing to promote ${IMAGE_NAME}:${DEMO_TAG}: not built from Dockerfile.prod (Cmd: ${demo_cmd})"
    exit 1
  fi
  digest=$(podman inspect "${IMAGE_NAME}:${DEMO_TAG}" --format '{{index .RepoDigests 0}}' || true)
  if [[ -z "${digest}" ]]; then
    echo "Could not resolve digest for ${IMAGE_NAME}:${DEMO_TAG}"
    exit 1
  fi
  echo "Promoting ${digest} to ${IMAGE_NAME}:${PROD_TAG}"
  podman buildx imagetools create -t "${IMAGE_NAME}:${PROD_TAG}" "${digest}"
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
