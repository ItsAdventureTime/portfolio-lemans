#!/usr/bin/env bash
set -euo pipefail

# Local orchestrator. It builds Linux deployment images inside the project
# Docker Sandbox, exports an ephemeral image bundle, and sends the committed
# source plus bundle with rsync. The VPS imports the images and activates its
# existing rootless Podman runtime; it does not compile or build the app.

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_DIR="${PROJECT_ROOT}/scripts"
cd "$PROJECT_ROOT"

PROFILE="${1:-}"
shift || true
SYNC_ONLY=false
RESET_FLAG="${RESET:-false}"
REMOTE_USER="${REMOTE_USER:-}"
REMOTE_HOST="${REMOTE_HOST:-}"
PUBLIC_URL="${PUBLIC_URL:-}"
CADDY_NETWORK_NAME="${CADDY_NETWORK_NAME:-}"
CADDY_CONFIG_FILE="${CADDY_CONFIG_FILE:-/home/jk/caddy/conf/Caddyfile}"
REMOTE_ROOT_OVERRIDE="${REMOTE_PATH:-}"
QUADLET_PATH_OVERRIDE="${QUADLET_PATH:-}"
ARTIFACT_ROOT="${PROJECT_ROOT}/.deployment-artifacts"

while (($# > 0)); do
  case "$1" in
    --sync-only) SYNC_ONLY=true; shift ;;
    --reset) RESET_FLAG=true; shift ;;
    *) echo "Error: unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ "$PROFILE" != demo && "$PROFILE" != prod ]]; then
  echo "Usage: $0 {demo|prod} [--sync-only] [--reset]" >&2
  exit 1
fi

BASE_PATH="/demo/lemans"
PROFILE_LABEL="remote demo"
DEFAULT_PUBLIC_URL="https://delegateops.business/demo/lemans"
DEFAULT_REMOTE_ROOT="/home/jk/bridge-ph/lemans-demo"
DEFAULT_QUADLET_PATH="/home/jk/.config/containers/systemd/bridge-ph/lemans-demo"
ACTIVATE_SCRIPT="activate-remote-demo.sh"
if [[ "$PROFILE" == prod ]]; then
  BASE_PATH="/prod/lemans"
  PROFILE_LABEL="remote production"
  DEFAULT_PUBLIC_URL="https://delegateops.business/lemans"
  DEFAULT_REMOTE_ROOT="/home/jk/bridge-ph/lemans"
  DEFAULT_QUADLET_PATH="/home/jk/.config/containers/systemd/bridge-ph/lemans"
  ACTIVATE_SCRIPT="activate-remote-prod.sh"
fi
REMOTE_ROOT="${REMOTE_ROOT_OVERRIDE:-$DEFAULT_REMOTE_ROOT}"
QUADLET_PATH="${QUADLET_PATH_OVERRIDE:-$DEFAULT_QUADLET_PATH}"
IMAGE_BUNDLE_NAME=".lemans-${PROFILE}-images.tar"
IMAGE_ARTIFACT_DIR="${ARTIFACT_ROOT}/${PROFILE}"
IMAGE_BUNDLE_PATH="${IMAGE_ARTIFACT_DIR}/${IMAGE_BUNDLE_NAME}"
IMAGE_CHECKSUM_PATH="${IMAGE_BUNDLE_PATH}.sha256"

KEYCHAIN_SERVICE_PREFIX="lemans-bridge-dashboard/${PROFILE}"
keychain_value() {
  /usr/bin/security find-generic-password -s "$KEYCHAIN_SERVICE_PREFIX/$1" -w 2>/dev/null || true
}

if [[ "$SYNC_ONLY" != true ]] && [[ "$(uname -s)" == Darwin ]] && command -v security >/dev/null 2>&1; then
  if [[ -z "$REMOTE_HOST" && -z "$(keychain_value remote-host)" ]]; then
    echo "No saved ${PROFILE} deployment settings found. Starting one-time Keychain setup."
    "${SCRIPT_DIR}/configure-remote-profile.sh" "$PROFILE"
  fi
fi

if [[ "$(uname -s)" == Darwin ]] && command -v security >/dev/null 2>&1; then
  REMOTE_HOST="${REMOTE_HOST:-$(keychain_value remote-host)}"
  REMOTE_USER="${REMOTE_USER:-$(keychain_value remote-user)}"
  PUBLIC_URL="${PUBLIC_URL:-$(keychain_value public-url)}"
  CADDY_NETWORK_NAME="${CADDY_NETWORK_NAME:-$(keychain_value caddy-network-name)}"
  if [[ "$SYNC_ONLY" != true ]]; then
    B2_ACCESS_KEY_ID="${B2_ACCESS_KEY_ID:-$(keychain_value b2-access-key-id)}"
    B2_SECRET_ACCESS_KEY="${B2_SECRET_ACCESS_KEY:-$(keychain_value b2-secret-access-key)}"
  fi
fi
REMOTE_USER="${REMOTE_USER:-jk}"
REMOTE_HOST="${REMOTE_HOST:-}"
PUBLIC_URL="${PUBLIC_URL:-$DEFAULT_PUBLIC_URL}"
CADDY_NETWORK_NAME="${CADDY_NETWORK_NAME:-caddy}"

if [[ -z "$REMOTE_HOST" ]]; then
  echo "Error: REMOTE_HOST is required. Run ./scripts/configure-remote-${PROFILE}.sh once." >&2
  exit 1
fi
if [[ "$PUBLIC_URL" != https://* || "$PUBLIC_URL" != *"${BASE_PATH}"* ]]; then
  echo "Error: PUBLIC_URL must be HTTPS and include ${BASE_PATH}." >&2
  exit 1
fi
if [[ ! "$CADDY_NETWORK_NAME" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]*$ ]]; then
  echo "Error: CADDY_NETWORK_NAME is invalid." >&2
  exit 1
fi
if [[ ! "$CADDY_CONFIG_FILE" =~ ^/[A-Za-z0-9._/-]+$ ]]; then
  echo "Error: CADDY_CONFIG_FILE must be an absolute path." >&2
  exit 1
fi
if [[ "$PROFILE" == prod && "$RESET_FLAG" == true ]]; then
  echo "Error: --reset is not allowed for production." >&2
  exit 1
fi

for tool in git ssh rsync mktemp tar jk-sbx-project; do
  command -v "$tool" >/dev/null 2>&1 || {
    echo "Error: required local tool not found: $tool" >&2
    exit 1
  }
done

# Serena refreshes this tracked project metadata locally. It does not affect
# the application or deployment and is intentionally excluded from the
# deployable-source guard. All other tracked, staged, and untracked changes
# must be committed before a remote sync is allowed.
DEPLOYABLE_STATUS="$(
  git -c core.quotePath=false status --porcelain=v1 --untracked-files=all -- \
    . ':(exclude).serena/project.yml'
)"
LOCAL_METADATA_STATUS="$(
  git -c core.quotePath=false status --porcelain=v1 --untracked-files=all -- \
    .serena/project.yml
)"
if [[ -n "$DEPLOYABLE_STATUS" ]]; then
  echo "Error: deployment requires a clean committed source tree." >&2
  echo "Uncommitted deployable changes:" >&2
  printf '%s\n' "$DEPLOYABLE_STATUS" >&2
  echo "Commit those changes, then rerun this command." >&2
  exit 1
fi
if [[ -n "$LOCAL_METADATA_STATUS" ]]; then
  echo "Note: excluding local Serena metadata from the deployment snapshot:" >&2
  printf '%s\n' "$LOCAL_METADATA_STATUS" >&2
fi

rm -f "$IMAGE_BUNDLE_PATH" "$IMAGE_CHECKSUM_PATH"
echo "Building ${PROFILE_LABEL} images inside the Docker Sandbox..."
jk-sbx-project exec -- ./scripts/build-local-artifacts.sh \
  "$PROFILE" ".deployment-artifacts/${PROFILE}"
if [[ ! -s "$IMAGE_BUNDLE_PATH" || ! -s "$IMAGE_CHECKSUM_PATH" ]]; then
  echo "Error: local image bundle was not created." >&2
  exit 1
fi

SOURCE_COMMIT="$(git rev-parse HEAD)"
REMOTE="${REMOTE_USER}@${REMOTE_HOST}"
REMOTE_SOURCE_DIR="${REMOTE_ROOT}/current"
STAGING_DIR="$(mktemp -d "${TMPDIR:-/tmp}/lemans-source.XXXXXX")"
SSH_CONTROL_DIR="$(mktemp -d "${TMPDIR:-/tmp}/lemans-deploy-ssh.XXXXXX")"
SSH_CONTROL_PATH="${SSH_CONTROL_DIR}/m"
SSH_OPTIONS=(
  -o ControlMaster=auto
  -o ControlPersist=5m
  -o "ControlPath=${SSH_CONTROL_PATH}"
)
RSYNC_RSH="ssh -o ControlMaster=auto -o ControlPersist=5m -o ControlPath=${SSH_CONTROL_PATH}"
cleanup() {
  ssh "${SSH_OPTIONS[@]}" -O exit "$REMOTE" >/dev/null 2>&1 || true
  rm -f "$IMAGE_BUNDLE_PATH" "$IMAGE_CHECKSUM_PATH"
  rm -rf "$STAGING_DIR" "$SSH_CONTROL_DIR"
}
trap cleanup EXIT

# Export HEAD into a temporary directory; this avoids accidentally syncing
# staged-but-uncommitted content. The tar stream is not retained or transferred
# as an archive, and the temporary tree is removed on every exit path. The
# separately generated image bundle is transferred below and also removed
# from the workspace on every exit path.
git archive --format=tar HEAD -- . ':(exclude).serena/project.yml' |
  tar -xf - -C "$STAGING_DIR"
printf '%s\n' "$SOURCE_COMMIT" > "$STAGING_DIR/.lemans-source-commit"
printf '%s\n' "$PUBLIC_URL" > "$STAGING_DIR/.lemans-public-url"

echo "=== Remote ${PROFILE_LABEL} source sync ==="
echo "Host: ${REMOTE}"
echo "Local actions: Docker Sandbox build + committed source snapshot + resumable rsync"

ssh_remote() {
  # shellcheck disable=SC2029
  ssh "${SSH_OPTIONS[@]}" "$REMOTE" "$@"
}

ssh_remote "command -v rsync >/dev/null 2>&1 || { echo 'Error: rsync is required on the VPS.' >&2; exit 1; }; mkdir -p '$REMOTE_SOURCE_DIR' '$QUADLET_PATH'"
rsync -a --delete --partial --info=progress2 -e "$RSYNC_RSH" \
  "$STAGING_DIR/" "$REMOTE:${REMOTE_SOURCE_DIR}/"

echo "Source synced to ${REMOTE_SOURCE_DIR}"
echo "Transferring prebuilt image bundle to ${REMOTE_SOURCE_DIR}/${IMAGE_BUNDLE_NAME}"
rsync -a --partial --info=progress2 -e "$RSYNC_RSH" \
  "$IMAGE_BUNDLE_PATH" "$IMAGE_CHECKSUM_PATH" \
  "$REMOTE:${REMOTE_SOURCE_DIR}/"

echo "Source and image bundle synced to ${REMOTE_SOURCE_DIR}"
echo "After logging in to the VPS, run:"
echo "  cd '${REMOTE_SOURCE_DIR}' && ./scripts/${ACTIVATE_SCRIPT}"

if [[ "$SYNC_ONLY" == true ]]; then
  echo "Sync complete. Log in to the VPS and run the activation command above."
  exit 0
fi

if [[ -z "${B2_ACCESS_KEY_ID:-}" || -z "${B2_SECRET_ACCESS_KEY:-}" ]]; then
  echo "Backblaze B2 credentials required for ${PROFILE_LABEL}."
  echo -n "B2 Access Key ID: "
  read -r B2_ACCESS_KEY_ID
  echo -n "B2 Secret Access Key: "
  read -rs B2_SECRET_ACCESS_KEY
  echo
fi

echo "Activating deployment on the VPS..."
{
  printf '%s\n' "$B2_ACCESS_KEY_ID" "$B2_SECRET_ACCESS_KEY"
} | ssh_remote \
  "cd '$REMOTE_SOURCE_DIR' && B2_FROM_STDIN=true RESET='$RESET_FLAG' ./scripts/${ACTIVATE_SCRIPT} --remote-root '$REMOTE_ROOT' --quadlet-path '$QUADLET_PATH' --image-bundle '$REMOTE_SOURCE_DIR/$IMAGE_BUNDLE_NAME' --caddy-network-name '$CADDY_NETWORK_NAME' --caddy-config-file '$CADDY_CONFIG_FILE'"

echo "=== ${PROFILE_LABEL} deployed ==="
echo "Public URL: ${PUBLIC_URL}"
