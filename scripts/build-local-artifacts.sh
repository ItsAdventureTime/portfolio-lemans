#!/usr/bin/env bash
set -euo pipefail

# Build deployable Linux images inside the project Docker Sandbox and export
# one ephemeral Docker archive for the remote Podman runtime to import.

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

PROFILE="${1:-}"
ARTIFACT_RELATIVE_PATH="${2:-.deployment-artifacts/${PROFILE}}"
if [[ "$PROFILE" != demo && "$PROFILE" != prod ]]; then
  echo "Usage: $0 {demo|prod} [artifact-directory]" >&2
  exit 1
fi
if [[ "$ARTIFACT_RELATIVE_PATH" = /* || "$ARTIFACT_RELATIVE_PATH" == *..* ]]; then
  echo "Error: artifact directory must be a safe relative project path." >&2
  exit 1
fi

ARTIFACT_DIR="${PROJECT_ROOT}/${ARTIFACT_RELATIVE_PATH#./}"
WEB_TAG="${PROFILE}-web"
GO_TAG="${PROFILE}-go"
# The remote VPS is currently Linux amd64. Keep this override explicit so the
# same workflow can target another verified VPS architecture without changing
# the source. The Dockerfiles use native build stages for cross-architecture
# packaging, so this does not require installing privileged binfmt handlers.
TARGET_PLATFORM="${TARGET_PLATFORM:-linux/amd64}"
WEB_IMAGE="lemans-bridge-dashboard:${WEB_TAG}"
GO_IMAGE="lemans-bridge-dashboard-go:${GO_TAG}"
REMOTE_WEB_IMAGE="localhost/${WEB_IMAGE}"
REMOTE_GO_IMAGE="localhost/${GO_IMAGE}"
BUNDLE_NAME=".lemans-${PROFILE}-images.tar"
BUNDLE_PATH="${ARTIFACT_DIR}/${BUNDLE_NAME}"
CHECKSUM_PATH="${BUNDLE_PATH}.sha256"

command -v docker >/dev/null 2>&1 || {
  echo "Error: Docker is required inside the project Docker Sandbox." >&2
  exit 1
}
command -v sha256sum >/dev/null 2>&1 || {
  echo "Error: sha256sum is required inside the project Docker Sandbox." >&2
  exit 1
}

mkdir -p "$ARTIFACT_DIR"
rm -f "$BUNDLE_PATH" "$CHECKSUM_PATH"

echo "=== Building Le Mans ${PROFILE} deployment images locally ==="
echo "Build platform: ${TARGET_PLATFORM}"
TARGET_PLATFORM="$TARGET_PLATFORM" ./scripts/build.sh "$PROFILE"

docker tag "$WEB_IMAGE" "$REMOTE_WEB_IMAGE"
docker tag "$GO_IMAGE" "$REMOTE_GO_IMAGE"
docker image inspect "$REMOTE_WEB_IMAGE" "$REMOTE_GO_IMAGE" >/dev/null

echo "Exporting ephemeral image bundle: ${BUNDLE_NAME}"
docker save --output "$BUNDLE_PATH" "$REMOTE_WEB_IMAGE" "$REMOTE_GO_IMAGE"
(cd "$ARTIFACT_DIR" && sha256sum "$BUNDLE_NAME" > "${BUNDLE_NAME}.sha256")

echo "Local image artifacts ready"
echo "Web image: ${REMOTE_WEB_IMAGE}"
echo "Go image: ${REMOTE_GO_IMAGE}"
echo "Bundle: ${BUNDLE_PATH}"
echo "Checksum: ${CHECKSUM_PATH}"
