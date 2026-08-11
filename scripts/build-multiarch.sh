#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/podman/bin:$PATH"
cd "$PROJECT_ROOT"

# Build and publish the same two images used by build.sh for both supported
# architectures. Requires a Podman machine configured for multi-arch builds.
REGISTRY="${REGISTRY:-docker.io}"
IMAGE_PREFIX="${IMAGE_PREFIX:-library}"
WEB_IMAGE="${REGISTRY}/${IMAGE_PREFIX}/lemans-bridge-dashboard"
GO_IMAGE="${REGISTRY}/${IMAGE_PREFIX}/lemans-bridge-dashboard-go"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"

build_and_push_manifest() {
  local image="$1"
  local tag="$2"
  local dockerfile="$3"
  local manifest="${image}:${tag}"
  shift 3

  echo "Building multi-arch manifest ${manifest}..."
  podman manifest rm "$manifest" 2>/dev/null || true
  podman build \
    --platform "$PLATFORMS" \
    --manifest "$manifest" \
    -f "$dockerfile" \
    "$@" \
    .
  podman manifest push --all "$manifest" "$manifest"
}

build_profile() {
  local profile="$1"
  local web_tag="${profile}-web"
  local go_tag="${profile}-go"
  local base_path="/lemans/demo"
  if [[ "$profile" == "prod" ]]; then
    base_path="/lemans"
  fi

  build_and_push_manifest \
    "$WEB_IMAGE" "$web_tag" Dockerfile.web \
    --build-arg "NEXT_PUBLIC_BASE_PATH=${base_path}"
  build_and_push_manifest "$GO_IMAGE" "$go_tag" Dockerfile.go
}

promote_demo_to_prod() {
  echo "Promoting validated demo manifests to production tags..."
  podman manifest push --all \
    "${WEB_IMAGE}:demo-web" "${WEB_IMAGE}:prod-web"
  podman manifest push --all \
    "${GO_IMAGE}:demo-go" "${GO_IMAGE}:prod-go"
}

case "${1:-all}" in
  demo) build_profile demo ;;
  prod) build_profile prod ;;
  promote) promote_demo_to_prod ;;
  all)
    build_profile demo
    build_profile prod
    ;;
  *)
    echo "Usage: $0 {demo|prod|promote|all}" >&2
    exit 1
    ;;
esac

echo "Build complete."
