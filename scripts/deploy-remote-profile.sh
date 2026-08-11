#!/usr/bin/env bash
set -euo pipefail

# Local orchestrator. It only prepares a committed source snapshot and sends it
# with rsync. Builds and application execution happen on the VPS activation
# script under rootless Podman.

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
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

BASE_PATH="/lemans/demo"
PROFILE_LABEL="remote demo"
DEFAULT_PUBLIC_URL="https://delegateops.business/lemans/demo"
DEFAULT_REMOTE_ROOT="/home/jk/bridge-ph/lemans-demo"
DEFAULT_QUADLET_PATH="/home/jk/.config/containers/systemd/bridge-ph/lemans-demo"
ACTIVATE_SCRIPT="activate-remote-demo.sh"
if [[ "$PROFILE" == prod ]]; then
  BASE_PATH="/lemans"
  PROFILE_LABEL="remote production"
  DEFAULT_PUBLIC_URL="https://delegateops.business/lemans"
  DEFAULT_REMOTE_ROOT="/home/jk/bridge-ph/lemans"
  DEFAULT_QUADLET_PATH="/home/jk/.config/containers/systemd/bridge-ph/lemans"
  ACTIVATE_SCRIPT="activate-remote-prod.sh"
fi
REMOTE_ROOT="${REMOTE_ROOT_OVERRIDE:-$DEFAULT_REMOTE_ROOT}"
QUADLET_PATH="${QUADLET_PATH_OVERRIDE:-$DEFAULT_QUADLET_PATH}"

KEYCHAIN_SERVICE_PREFIX="lemans-bridge-dashboard/${PROFILE}"
keychain_value() {
  /usr/bin/security find-generic-password -s "$KEYCHAIN_SERVICE_PREFIX/$1" -w 2>/dev/null || true
}
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

for tool in git ssh rsync mktemp; do
  command -v "$tool" >/dev/null 2>&1 || {
    echo "Error: required local tool not found: $tool" >&2
    exit 1
  }
done
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: worktree must be clean; commit the release before syncing." >&2
  exit 1
fi

RELEASE_COMMIT="$(git rev-parse HEAD)"
RELEASE_TIME="$(date -u +%Y%m%d-%H%M%S)"
RELEASE_ID="${RELEASE_TIME}-${RELEASE_COMMIT:0:8}"
REMOTE="${REMOTE_USER}@${REMOTE_HOST}"
REMOTE_RELEASE_DIR="${REMOTE_ROOT}/releases/${RELEASE_ID}"
REMOTE_SOURCE_DIR="${REMOTE_RELEASE_DIR}/source"
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
  rm -rf "$STAGING_DIR" "$SSH_CONTROL_DIR"
}
trap cleanup EXIT

# Export the clean index into a temporary directory; no archive file is created
# or transferred. The temporary tree is removed on every exit path.
git checkout-index --all --force --prefix="$STAGING_DIR/"

echo "=== Remote ${PROFILE_LABEL} source sync ==="
echo "Host: ${REMOTE}"
echo "Release: ${RELEASE_ID}"
echo "Local actions: committed source snapshot + resumable rsync only"

ssh_remote() {
  # shellcheck disable=SC2029
  ssh "${SSH_OPTIONS[@]}" "$REMOTE" "$@"
}

ssh_remote "command -v rsync >/dev/null 2>&1 || { echo 'Error: rsync is required on the VPS.' >&2; exit 1; }; mkdir -p '$REMOTE_SOURCE_DIR' '$QUADLET_PATH'"
rsync -a --delete --partial --info=progress2 -e "$RSYNC_RSH" \
  "$STAGING_DIR/" "$REMOTE:${REMOTE_SOURCE_DIR}/"

echo "Source synced to ${REMOTE_SOURCE_DIR}"
echo "VPS activation command:"
echo "  cd ${REMOTE_SOURCE_DIR}"
echo "  ./scripts/${ACTIVATE_SCRIPT} --release-id ${RELEASE_ID} --release-commit ${RELEASE_COMMIT} --public-url '${PUBLIC_URL}'"

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

echo "Activating release on the VPS..."
{
  printf '%s\n' "$B2_ACCESS_KEY_ID" "$B2_SECRET_ACCESS_KEY"
} | ssh_remote \
  "cd '$REMOTE_SOURCE_DIR' && B2_FROM_STDIN=true RESET='$RESET_FLAG' ./scripts/${ACTIVATE_SCRIPT} --release-id '$RELEASE_ID' --release-commit '$RELEASE_COMMIT' --public-url '$PUBLIC_URL' --remote-root '$REMOTE_ROOT' --quadlet-path '$QUADLET_PATH' --caddy-network-name '$CADDY_NETWORK_NAME' --caddy-config-file '$CADDY_CONFIG_FILE'"

echo "=== ${PROFILE_LABEL} deployed ==="
echo "Release: ${RELEASE_ID}"
echo "Public URL: ${PUBLIC_URL}"
