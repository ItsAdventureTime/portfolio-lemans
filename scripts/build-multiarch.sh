#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Build and publish the same two images used by build.sh for both supported
# architectures. Run this command inside the project Docker Sandbox. It
# requires an authenticated registry because buildx publishes the manifest.
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
  docker buildx build \
    --platform "$PLATFORMS" \
    --tag "$manifest" \
    -f "$dockerfile" \
    "$@" \
    --push \
    .
}

build_profile() {
  local profile="$1"
  local web_tag="${profile}-web"
  local go_tag="${profile}-go"
  local base_path="/demo/lemans"
  if [[ "$profile" == "prod" ]]; then
    base_path="/prod/lemans"
  fi

  build_and_push_manifest \
    "$WEB_IMAGE" "$web_tag" Dockerfile.web \
    --build-arg "NEXT_PUBLIC_BASE_PATH=${base_path}"
  build_and_push_manifest "$GO_IMAGE" "$go_tag" Dockerfile.go
}

promote_demo_to_prod() {
  echo "Promoting validated demo manifests to production tags..."
  docker buildx imagetools create \
    --tag "${WEB_IMAGE}:prod-web" \
    "${WEB_IMAGE}:demo-web"
  docker buildx imagetools create \
    --tag "${GO_IMAGE}:prod-go" \
    "${GO_IMAGE}:demo-go"
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
