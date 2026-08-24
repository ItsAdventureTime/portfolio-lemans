#!/usr/bin/env bash
set -euo pipefail

PROFILE="${1:-}"
if [[ "$PROFILE" != "demo" && "$PROFILE" != "prod" ]]; then
  echo "Usage: $0 {demo|prod}" >&2
  exit 1
fi

if [[ "$(uname -s)" != "Darwin" ]] || ! command -v security >/dev/null 2>&1; then
  echo "Error: this helper requires the macOS Keychain security command." >&2
  exit 1
fi

BASE_PATH="/prod/lemans"
DEFAULT_PUBLIC_URL=""
if [[ "$PROFILE" == "demo" ]]; then
  BASE_PATH="/demo/lemans"
  DEFAULT_PUBLIC_URL="https://delegateops.business${BASE_PATH}"
fi

SERVICE_PREFIX="lemans-bridge-dashboard/${PROFILE}"
ACCOUNT_NAME="${USER:?Error: USER must be set.}"

read_required() {
  local label="$1"
  local default_value="$2"
  local secret="$3"
  local value=""

  while [[ -z "$value" ]]; do
    if [[ -n "$default_value" ]]; then
      if [[ "$secret" == "true" ]]; then
        read -r -s -p "${label} [saved]: " value
        echo
      else
        read -r -p "${label} [${default_value}]: " value
      fi
      value="${value:-$default_value}"
    elif [[ "$secret" == "true" ]]; then
      read -r -s -p "${label}: " value
      echo
    else
      read -r -p "${label}: " value
    fi
  done

  REPLY="$value"
}

stored_value() {
  security find-generic-password -s "${SERVICE_PREFIX}/$1" -w 2>/dev/null || true
}

save_value() {
  security add-generic-password -U -a "$ACCOUNT_NAME" -s "${SERVICE_PREFIX}/$1" -w "$2" >/dev/null
}

read_required "Remote host or IP" "$(stored_value remote-host)" false
REMOTE_HOST="$REPLY"
read_required "Remote user" "${REMOTE_USER:-$(stored_value remote-user)}" false
REMOTE_USER="$REPLY"
SAVED_PUBLIC_URL="$(stored_value public-url)"
read_required "Public HTTPS URL" "${PUBLIC_URL:-${SAVED_PUBLIC_URL:-$DEFAULT_PUBLIC_URL}}" false
PUBLIC_URL="$REPLY"
SAVED_CADDY_NETWORK_NAME="$(stored_value caddy-network-name)"
read_required "Caddy Podman network name" "${CADDY_NETWORK_NAME:-${SAVED_CADDY_NETWORK_NAME:-caddy}}" false
CADDY_NETWORK_NAME="$REPLY"
read_required "Backblaze B2 Access Key ID" "$(stored_value b2-access-key-id)" false
B2_ACCESS_KEY_ID="$REPLY"
read_required "Backblaze B2 Secret Access Key" "$(stored_value b2-secret-access-key)" true
B2_SECRET_ACCESS_KEY="$REPLY"

if [[ "$PUBLIC_URL" != https://* ]] || [[ "$PUBLIC_URL" != *"${BASE_PATH}"* ]]; then
  echo "Error: public URL must start with https:// and include ${BASE_PATH}." >&2
  exit 1
fi
if [[ ! "$CADDY_NETWORK_NAME" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]*$ ]]; then
  echo "Error: Caddy network name must be a valid Podman network name." >&2
  exit 1
fi

save_value remote-host "$REMOTE_HOST"
save_value remote-user "$REMOTE_USER"
save_value public-url "$PUBLIC_URL"
save_value caddy-network-name "$CADDY_NETWORK_NAME"
save_value b2-access-key-id "$B2_ACCESS_KEY_ID"
save_value b2-secret-access-key "$B2_SECRET_ACCESS_KEY"

echo "Saved ${PROFILE} deployment settings to the macOS login Keychain."
echo "Run ./scripts/deploy-remote-${PROFILE}.sh; no deployment variables are required."
