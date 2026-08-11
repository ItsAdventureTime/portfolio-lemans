#!/usr/bin/env bash
set -euo pipefail

# Remote-only deployment entry point. The local machine packages the committed
# source and transfers it; all image builds and runtime checks happen remotely.

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/podman/bin:$PATH"
cd "$PROJECT_ROOT"
source "${PROJECT_ROOT}/scripts/lib/common.sh"

PROFILE="${1:-}"
if [[ "$PROFILE" != "demo" && "$PROFILE" != "prod" ]]; then
  echo "Usage: $0 {demo|prod}" >&2
  exit 1
fi

REMOTE_USER="${REMOTE_USER:-}"
REMOTE_HOST="${REMOTE_HOST:-}"
REMOTE_PATH_OVERRIDE="${REMOTE_PATH:-}"
QUADLET_PATH_OVERRIDE="${QUADLET_PATH:-}"
REMOTE_ROOT=""
QUADLET_PATH=""
BASE_PATH="/lemans/demo"
APP_PORT=3002
PROFILE_LABEL="remote demo"
WEB_SOURCE_TAG="demo-web"
GO_SOURCE_TAG="demo-go"
WEB_SERVICE="lemans-demo.service"
GO_SERVICE="lemans-demo-go.service"
DB_SERVICE="lemans-demo-db.service"
NETWORK_SERVICE="lemans-demo-network.service"
VOLUME_SERVICE="lemans-demo-volume.service"
CADDY_NETWORK_NAME="${CADDY_NETWORK_NAME:-}"
CADDY_SERVICE="caddy.service"
CADDY_CONTAINER="caddy"
CADDY_CONFIG_FILE="${CADDY_CONFIG_FILE:-/home/jk/caddy/conf/Caddyfile}"
CADDY_ROUTE_SOURCE="caddy/lemans-demo.handlers.Caddyfile"
CADDY_ROUTE_TARGET_NAME="lemans-demo.handlers.Caddyfile"
CADDY_ROUTE_IMPORT="/etc/caddy/lemans-demo.handlers.Caddyfile"
BACKUP_TIMER=""
DB_CONTAINER="lemans-demo-db"
GO_CONTAINER="lemans-demo-go"
APP_CONTAINER="lemans-demo-app"
DB_NAME="lemans_demo_db"
QUADLET_SOURCE_DIR="quadlet/remote-demo"
RESET_FLAG="${RESET:-false}"

if [[ "$PROFILE" == "prod" ]]; then
  REMOTE_ROOT="${REMOTE_PATH_OVERRIDE:-/home/jk/bridge-ph/lemans}"
  QUADLET_PATH="${QUADLET_PATH_OVERRIDE:-/home/jk/.config/containers/systemd/bridge-ph/lemans}"
  BASE_PATH="/lemans"
  APP_PORT=3003
  PROFILE_LABEL="remote production"
  WEB_SOURCE_TAG="prod-web"
  GO_SOURCE_TAG="prod-go"
  WEB_SERVICE="lemans.service"
  GO_SERVICE="lemans-go.service"
  DB_SERVICE="lemans-db.service"
  NETWORK_SERVICE="lemans-network.service"
  VOLUME_SERVICE="lemans-volume.service"
  BACKUP_TIMER="lemans-backup.timer"
  DB_CONTAINER="lemans-prod-db"
  GO_CONTAINER="lemans-prod-go"
  APP_CONTAINER="lemans-prod-app"
  DB_NAME="lemans_prod_db"
  QUADLET_SOURCE_DIR="quadlet/remote-prod"
  CADDY_ROUTE_SOURCE=""
  CADDY_ROUTE_TARGET_NAME=""
  CADDY_ROUTE_IMPORT=""
else
  REMOTE_ROOT="${REMOTE_PATH_OVERRIDE:-/home/jk/bridge-ph/lemans-demo}"
  QUADLET_PATH="${QUADLET_PATH_OVERRIDE:-/home/jk/.config/containers/systemd/bridge-ph/lemans-demo}"
fi

KEYCHAIN_SERVICE_PREFIX="lemans-bridge-dashboard/${PROFILE}"
keychain_value() {
  /usr/bin/security find-generic-password -s "$KEYCHAIN_SERVICE_PREFIX/$1" -w 2>/dev/null || true
}

if [[ "$(uname -s)" == "Darwin" ]] && command -v security >/dev/null 2>&1; then
  REMOTE_HOST="${REMOTE_HOST:-$(keychain_value remote-host)}"
  REMOTE_USER="${REMOTE_USER:-$(keychain_value remote-user)}"
  CADDY_NETWORK_NAME="${CADDY_NETWORK_NAME:-$(keychain_value caddy-network-name)}"
  KEYCHAIN_PUBLIC_URL="$(keychain_value public-url)"
  B2_ACCESS_KEY_ID="${B2_ACCESS_KEY_ID:-$(keychain_value b2-access-key-id)}"
  B2_SECRET_ACCESS_KEY="${B2_SECRET_ACCESS_KEY:-$(keychain_value b2-secret-access-key)}"
else
  KEYCHAIN_PUBLIC_URL=""
fi

REMOTE_USER="${REMOTE_USER:-jk}"
CADDY_NETWORK_NAME="${CADDY_NETWORK_NAME:-caddy}"

DEMO_MODE_VALUE=false
if [[ "$PROFILE" == "demo" ]]; then
  DEMO_MODE_VALUE=true
fi

if [[ -z "$REMOTE_HOST" ]]; then
  echo "Error: REMOTE_HOST is required." >&2
  exit 1
fi

DEFAULT_PUBLIC_URL="https://${REMOTE_HOST}${BASE_PATH}"
if [[ "$PROFILE" == "demo" ]]; then
  DEFAULT_PUBLIC_URL="https://delegateops.business${BASE_PATH}"
fi
PUBLIC_URL="${PUBLIC_URL:-${KEYCHAIN_PUBLIC_URL:-$DEFAULT_PUBLIC_URL}}"
if [[ "$PUBLIC_URL" != https://* ]]; then
  echo "Error: PUBLIC_URL must start with https://" >&2
  exit 1
fi
if [[ "$PUBLIC_URL" != *"${BASE_PATH}" && "$PUBLIC_URL" != *"${BASE_PATH}/" ]]; then
  echo "Error: PUBLIC_URL must include the ${BASE_PATH} base path." >&2
  exit 1
fi
if [[ ! "$CADDY_NETWORK_NAME" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]*$ ]]; then
  echo "Error: CADDY_NETWORK_NAME must be a valid Podman network name." >&2
  exit 1
fi
if [[ ! "$CADDY_CONFIG_FILE" =~ ^/[A-Za-z0-9._/-]+$ ]]; then
  echo "Error: CADDY_CONFIG_FILE must be an absolute path without shell-special characters." >&2
  exit 1
fi

for tool in git ssh rsync tar install sed openssl mktemp; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Error: required local tool not found: $tool" >&2
    exit 1
  fi
done

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: worktree must be clean; commit the release before deploying." >&2
  exit 1
fi

if [[ "$PROFILE" == "prod" && "$RESET_FLAG" == "true" ]]; then
  echo "Error: RESET=true is not allowed for production." >&2
  exit 1
fi

if [[ -z "${B2_ACCESS_KEY_ID:-}" || -z "${B2_SECRET_ACCESS_KEY:-}" ]]; then
  echo "Backblaze B2 credentials required for ${PROFILE_LABEL}."
  echo "On macOS, run ./scripts/configure-remote-${PROFILE}.sh once to save them in Keychain."
  echo -n "B2 Access Key ID: "
  read -r B2_ACCESS_KEY_ID
  echo -n "B2 Secret Access Key: "
  read -rs B2_SECRET_ACCESS_KEY
  echo
fi

RELEASE_COMMIT="$(git rev-parse HEAD)"
RELEASE_TIME="$(date -u +%Y%m%d-%H%M%S)"
RELEASE_ID="${RELEASE_TIME}-${RELEASE_COMMIT:0:8}"
RELEASE_DIR="${REMOTE_ROOT}/releases/${RELEASE_ID}"
SOURCE_ARCHIVE="${PROJECT_ROOT}/.${PROFILE}-source-${RELEASE_ID}.tar.gz"
REMOTE="${REMOTE_USER}@${REMOTE_HOST}"
CADDY_ROUTE_SOURCE_REMOTE=""
if [[ -n "$CADDY_ROUTE_SOURCE" ]]; then
  CADDY_ROUTE_SOURCE_REMOTE="${RELEASE_DIR}/source/${CADDY_ROUTE_SOURCE}"
fi
SSH_CONTROL_DIR="$(mktemp -d "${TMPDIR:-/tmp}/lemans-deploy-ssh.XXXXXX")"
SSH_CONTROL_PATH="${SSH_CONTROL_DIR}/m"
SSH_OPTIONS=(
  -o ControlMaster=auto
  -o ControlPersist=5m
  -o "ControlPath=${SSH_CONTROL_PATH}"
)
RSYNC_RSH="ssh -o ControlMaster=auto -o ControlPersist=5m -o ControlPath=${SSH_CONTROL_PATH}"
ssh_remote() {
  # shellcheck disable=SC2029
  ssh "${SSH_OPTIONS[@]}" "$REMOTE" "$@"
}

WEB_IMAGE="localhost/lemans-bridge-dashboard:${WEB_SOURCE_TAG}-${RELEASE_ID}"
GO_IMAGE="localhost/lemans-bridge-dashboard-go:${GO_SOURCE_TAG}-${RELEASE_ID}"
DB_PASSWORD="$(generate_password)"
cleanup_local() {
  ssh "${SSH_OPTIONS[@]}" -O exit "$REMOTE" >/dev/null 2>&1 || true
  rm -f "$SOURCE_ARCHIVE"
  rm -rf "$SSH_CONTROL_DIR"
}
trap cleanup_local EXIT

git archive --format=tar.gz --output="$SOURCE_ARCHIVE" HEAD

echo "=== Remote-only ${PROFILE_LABEL} deployment ==="
echo "Host: ${REMOTE}"
echo "Release: ${RELEASE_ID}"
echo "Local actions: source archive + resumable rsync transfer only"

# Values are intentionally expanded locally into the remote command.
# shellcheck disable=SC2029
ssh_remote "command -v rsync >/dev/null 2>&1 || { echo 'Error: rsync is required on the remote host.' >&2; exit 1; }; mkdir -p '$RELEASE_DIR' '$QUADLET_PATH'"
rsync -a --partial --progress -e "$RSYNC_RSH" \
  "$SOURCE_ARCHIVE" "$REMOTE:${RELEASE_DIR}/source.tar.gz"

# Values are intentionally expanded locally into the remote environment.
# shellcheck disable=SC2029
ssh_remote \
  "PROFILE='$PROFILE' RELEASE_ID='$RELEASE_ID' RELEASE_COMMIT='$RELEASE_COMMIT' RELEASE_DIR='$RELEASE_DIR' QUADLET_PATH='$QUADLET_PATH' BASE_PATH='$BASE_PATH' WEB_IMAGE='$WEB_IMAGE' GO_IMAGE='$GO_IMAGE' WEB_SOURCE_TAG='$WEB_SOURCE_TAG' GO_SOURCE_TAG='$GO_SOURCE_TAG' QUADLET_SOURCE_DIR='$QUADLET_SOURCE_DIR' DEMO_MODE='$DEMO_MODE_VALUE' bash -s" <<'REMOTE_BUILD'
set -euo pipefail
export PATH="/opt/podman/bin:$PATH"

cd "$RELEASE_DIR"
mkdir -p source
tar -xzf source.tar.gz -C source
cd source

rootless="$(podman info --format '{{.Host.Security.Rootless}}')"
if [[ "$rootless" != "true" ]]; then
  echo "Error: remote Podman is not rootless" >&2
  exit 1
fi

echo "[1/5] Building web image on the VPS..."
podman build --pull=missing --force-rm \
  --build-arg "NEXT_PUBLIC_BASE_PATH=${BASE_PATH}" \
  -f Dockerfile.web -t "$WEB_IMAGE" .

echo "[2/5] Building Go API image on the VPS..."
podman build --pull=missing --force-rm \
  -f Dockerfile.go -t "$GO_IMAGE" .

echo "[3/5] Running disposable image smoke checks..."
podman run --rm --entrypoint /bin/sh "$WEB_IMAGE" \
  -c 'test -f /app/server.js && test -d /app/.next/static'
podman run --rm --entrypoint /bin/sh "$GO_IMAGE" \
  -c 'test -x /lemans-api && test -x /usr/local/bin/reset-demo.sh'

WEB_ID="$(podman image inspect "$WEB_IMAGE" --format '{{.Id}}')"
GO_ID="$(podman image inspect "$GO_IMAGE" --format '{{.Id}}')"

echo "[4/5] Installing release-specific Quadlets and runtime config..."
for file in "$QUADLET_SOURCE_DIR"/*.container "$QUADLET_SOURCE_DIR"/*.network "$QUADLET_SOURCE_DIR"/*.volume; do
  [[ -f "$file" ]] || continue
  install -m 0644 "$file" "$QUADLET_PATH/$(basename "$file")"
done
for file in "$QUADLET_SOURCE_DIR"/*.service "$QUADLET_SOURCE_DIR"/*.sh; do
  [[ -f "$file" ]] || continue
  mode=0644
  [[ "$file" == *.sh ]] && mode=0755
  install -m "$mode" "$file" "$QUADLET_PATH/$(basename "$file")"
done
systemd_user_dir="$HOME/.config/systemd/user"
install -d -m 0755 "$systemd_user_dir"
for file in "$QUADLET_SOURCE_DIR"/*.timer; do
  [[ -f "$file" ]] || continue
  install -m 0644 "$file" "$systemd_user_dir/$(basename "$file")"
done

# Remove the legacy external environment files created by older releases.
rm -f "$QUADLET_PATH/lemans-demo.env" "$QUADLET_PATH/lemans.env"
if grep -R -n --fixed-strings 'EnvironmentFile=' "$QUADLET_PATH"/*.container; then
  echo "Error: external EnvironmentFile= references are not allowed in remote Quadlets." >&2
  exit 1
fi

sed -i \
  -e "s#docker.io/library/lemans-bridge-dashboard:${WEB_SOURCE_TAG}#${WEB_IMAGE}#g" \
  -e "s#docker.io/library/lemans-bridge-dashboard-go:${GO_SOURCE_TAG}#${GO_IMAGE}#g" \
  "$QUADLET_PATH"/*.container

cat > "$RELEASE_DIR/${RELEASE_ID}.json" <<EOF
{
  "release_id": "${RELEASE_ID}",
  "commit": "${RELEASE_COMMIT}",
  "web_image": "${WEB_IMAGE}",
  "web_image_id": "${WEB_ID}",
  "go_image": "${GO_IMAGE}",
  "go_image_id": "${GO_ID}",
  "base_path": "${BASE_PATH}"
}
EOF

echo "[5/5] Installed Quadlets, native timer units, and runtime configuration."
REMOTE_BUILD

# The secret is created separately so it never appears in a command-line
# argument or release manifest. Replacing an existing secret is done remotely.
printf '%s' "$DB_PASSWORD" | ssh "${SSH_OPTIONS[@]}" "$REMOTE" "podman secret create --replace db_password -"

# Runtime credentials are streamed over the encrypted SSH stdin channel rather
# than passed as command-line arguments. The remote script writes them only to
# the mode-600 Go API Quadlet.
{
  printf '%s\n' "$DB_PASSWORD" "$B2_ACCESS_KEY_ID" "$B2_SECRET_ACCESS_KEY"
  cat <<'REMOTE_ACTIVATE'
set -euo pipefail
export PATH="/opt/podman/bin:$PATH"

if [[ "$(loginctl show-user "$(id -un)" -p Linger --value 2>/dev/null || true)" != "yes" ]]; then
  echo "Error: rootless user linger is not enabled for $(id -un)." >&2
  echo "Ask the VPS operator to run: loginctl enable-linger $(id -un)" >&2
  exit 1
fi

profile_units=()
if [[ "$DEMO_MODE" == "true" ]]; then
  profile_units=(lemans-demo-reset.service lemans-demo-reset.timer)
elif [[ -n "$BACKUP_TIMER" ]]; then
  profile_units=(lemans-backup.service lemans-backup.timer)
fi
systemctl --user daemon-reload

expected_units=("$NETWORK_SERVICE" "$VOLUME_SERVICE" "$DB_SERVICE" "$GO_SERVICE" "$WEB_SERVICE" "${profile_units[@]}")
for unit in "${expected_units[@]}"; do
  load_state="$(systemctl --user show "$unit" --property=LoadState --value 2>/dev/null || true)"
  if [[ "$load_state" != "loaded" ]]; then
    echo "Error: required unit did not load: $unit (LoadState=${load_state:-not-found})" >&2
    exit 1
  fi
done

echo "All required Quadlet, volume, network, and timer units are loaded."

report_unit_failure() {
  local unit="$1"
  echo "--- $unit status ---" >&2
  systemctl --user status "$unit" --no-pager --full || true
  echo "--- $unit journal (current boot) ---" >&2
  journalctl --user -u "$unit" -b -n 200 --no-pager || true
}

run_unit() {
  local action="$1"
  local unit="$2"
  if ! systemctl --user "$action" "$unit"; then
    echo "Error: could not $action $unit." >&2
    report_unit_failure "$unit"
    exit 1
  fi
}

write_runtime_environment() {
  local file="$1"
  local db_container="$2"
  local db_name="$3"
  local runtime_lines
  local temp

  runtime_lines="$(printf '%s\n' \
    "Environment=DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@${db_container}:5432/${db_name}" \
    "Environment=B2_ACCESS_KEY_ID=${B2_ACCESS_KEY_ID}" \
    "Environment=B2_SECRET_ACCESS_KEY=${B2_SECRET_ACCESS_KEY}")"
  temp="$(mktemp)"
  if ! awk -v runtime_lines="$runtime_lines" '
    $0 == "[Service]" && !inserted {
      printf "%s\n", runtime_lines
      inserted=1
    }
    { print }
    END { if (!inserted) exit 7 }
  ' "$file" > "$temp"; then
    echo "Error: could not inject runtime Environment= entries into $file." >&2
    rm -f "$temp"
    exit 1
  fi
  install -m 0600 "$temp" "$file"
  rm -f "$temp"
}

if [[ "$DEMO_MODE" == "true" ]]; then
  write_runtime_environment "$QUADLET_PATH/lemans-demo-go.container" "$DB_CONTAINER" "$DB_NAME"
else
  write_runtime_environment "$QUADLET_PATH/lemans-go.container" "$DB_CONTAINER" "$DB_NAME"
fi

# Remove legacy generated env files. Runtime values now live in the generated
# .container file, so no external env file is required.
rm -f "$QUADLET_PATH/lemans-demo.env" "$QUADLET_PATH/lemans.env"
release_root="${RELEASE_DIR%/*}"
if [[ -d "$release_root" ]]; then
  find "$release_root" -maxdepth 2 -type f \
    \( -name 'lemans-demo.env' -o -name 'lemans.env' \) -delete
fi
systemctl --user daemon-reload

ensure_caddy_route() {
  [[ -n "$CADDY_ROUTE_SOURCE" ]] || return 0

  if [[ ! -f "$CADDY_ROUTE_SOURCE" ]]; then
    echo "Error: tracked Caddy route source is missing: $CADDY_ROUTE_SOURCE" >&2
    exit 1
  fi
  if ! systemctl --user is-active --quiet "$CADDY_SERVICE"; then
    run_unit start "$CADDY_SERVICE"
  fi

  caddy_config_dir="${CADDY_CONFIG_FILE%/*}"
  caddy_route_file="${caddy_config_dir}/${CADDY_ROUTE_TARGET_NAME}"
  caddy_import_line="import ${CADDY_ROUTE_IMPORT}"
  caddy_config_backup="${CADDY_CONFIG_FILE}.bak.${RELEASE_ID}"
  caddy_route_backup="${caddy_route_file}.bak.${RELEASE_ID}"
  caddy_temp="$(mktemp)"
  caddy_route_temp="$(mktemp)"
  caddy_route_had_backup=false
  caddy_changed=false

  install -m 0644 "$CADDY_CONFIG_FILE" "$caddy_config_backup"
  if [[ -f "$caddy_route_file" ]]; then
    install -m 0644 "$caddy_route_file" "$caddy_route_backup"
    caddy_route_had_backup=true
  fi
  if [[ ! -f "$caddy_route_file" ]] || ! cmp -s "$CADDY_ROUTE_SOURCE" "$caddy_route_file"; then
    caddy_changed=true
  fi
  install -m 0644 "$CADDY_ROUTE_SOURCE" "$caddy_route_file"

  if ! grep -Fq "$caddy_import_line" "$CADDY_CONFIG_FILE"; then
    if ! awk -v import_line="$caddy_import_line" '
      !inserted && $0 ~ /^[[:space:]]*# DelegateOps static-site fallback[[:space:]]*$/ {
        print "\t" import_line
        inserted=1
      }
      { print }
      END { if (!inserted) exit 7 }
    ' "$CADDY_CONFIG_FILE" > "$caddy_temp"; then
      echo "Error: could not find the DelegateOps fallback marker in $CADDY_CONFIG_FILE." >&2
      rm -f "$caddy_temp" "$caddy_route_temp"
      exit 1
    fi
    install -m 0644 "$caddy_temp" "$CADDY_CONFIG_FILE"
    caddy_changed=true
  fi

  if ! podman exec "$CADDY_CONTAINER" caddy fmt "/etc/caddy/${CADDY_ROUTE_TARGET_NAME}" > "$caddy_route_temp"; then
    echo "Error: Caddy could not format ${CADDY_ROUTE_TARGET_NAME}." >&2
    install -m 0644 "$caddy_config_backup" "$CADDY_CONFIG_FILE"
    if [[ "$caddy_route_had_backup" == true ]]; then
      install -m 0644 "$caddy_route_backup" "$caddy_route_file"
    else
      rm -f "$caddy_route_file"
    fi
    rm -f "$caddy_temp" "$caddy_route_temp"
    exit 1
  fi
  install -m 0644 "$caddy_route_temp" "$caddy_route_file"

  caddy_formatted="$(mktemp)"
  if ! podman exec "$CADDY_CONTAINER" caddy fmt /etc/caddy/Caddyfile > "$caddy_formatted"; then
    echo "Error: Caddy could not format Caddyfile." >&2
    install -m 0644 "$caddy_config_backup" "$CADDY_CONFIG_FILE"
    if [[ "$caddy_route_had_backup" == true ]]; then
      install -m 0644 "$caddy_route_backup" "$caddy_route_file"
    else
      rm -f "$caddy_route_file"
    fi
    rm -f "$caddy_temp" "$caddy_route_temp" "$caddy_formatted"
    exit 1
  fi
  if ! cmp -s "$caddy_formatted" "$CADDY_CONFIG_FILE"; then
    install -m 0644 "$caddy_formatted" "$CADDY_CONFIG_FILE"
    caddy_changed=true
  fi
  rm -f "$caddy_temp" "$caddy_route_temp" "$caddy_formatted"

  if ! podman exec "$CADDY_CONTAINER" caddy validate \
    --config /etc/caddy/Caddyfile --adapter caddyfile; then
    echo "Error: Caddyfile validation failed; restoring the previous configuration." >&2
    install -m 0644 "$caddy_config_backup" "$CADDY_CONFIG_FILE"
    if [[ "$caddy_route_had_backup" == true ]]; then
      install -m 0644 "$caddy_route_backup" "$caddy_route_file"
    else
      rm -f "$caddy_route_file"
    fi
    exit 1
  fi

  if [[ "$caddy_changed" == true ]]; then
    if ! podman exec "$CADDY_CONTAINER" caddy reload \
      --config /etc/caddy/Caddyfile --adapter caddyfile; then
      echo "Error: Caddy graceful reload failed; the prior configuration remains active." >&2
      install -m 0644 "$caddy_config_backup" "$CADDY_CONFIG_FILE"
      if [[ "$caddy_route_had_backup" == true ]]; then
        install -m 0644 "$caddy_route_backup" "$caddy_route_file"
      else
        rm -f "$caddy_route_file"
      fi
      exit 1
    fi
    echo "Caddy configuration validated and gracefully reloaded."
  else
    echo "Caddy configuration validated; no reload was needed."
  fi
}

if ! podman network exists "$CADDY_NETWORK_NAME"; then
  echo "Error: required shared Caddy network does not exist: $CADDY_NETWORK_NAME" >&2
  echo "The Caddy Quadlet reference is caddy.network; its NetworkName must match this value." >&2
  exit 1
fi

run_unit start "$NETWORK_SERVICE"
run_unit start "$VOLUME_SERVICE"
run_unit start "$DB_SERVICE"
for i in {1..60}; do
  if podman exec "$DB_CONTAINER" pg_isready -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
if ! podman exec "$DB_CONTAINER" pg_isready -U postgres >/dev/null 2>&1; then
  echo "Error: $DB_SERVICE did not become ready." >&2
  report_unit_failure "$DB_SERVICE"
  exit 1
fi

run_unit restart "$GO_SERVICE"
for i in {1..60}; do
  status="$(podman exec "$GO_CONTAINER" curl -s -o /dev/null -w '%{http_code}' \
    http://127.0.0.1:8080/health || true)"
  [[ "$status" == "200" ]] && break
  sleep 1
done
if [[ "$(podman exec "$GO_CONTAINER" curl -s -o /dev/null -w '%{http_code}' \
  http://127.0.0.1:8080/health || true)" != "200" ]]; then
  echo "Error: $GO_SERVICE health check failed." >&2
  report_unit_failure "$GO_SERVICE"
  exit 1
fi

if [[ "$DEMO_MODE" == "true" ]]; then
  count="$(podman exec "$DB_CONTAINER" psql -U postgres -d "$DB_NAME" -tAc 'SELECT count(*) FROM customers' | tr -d ' ' || echo 0)"
  if [[ "$RESET_FLAG" == "true" || "$count" == "0" ]]; then
    if ! podman exec "$GO_CONTAINER" curl -fsS -X POST \
      http://127.0.0.1:8080/admin/seed \
      -H 'Content-Type: application/json' -d '{}'; then
      echo "Error: demo seed request failed." >&2
      report_unit_failure "$GO_SERVICE"
      exit 1
    fi
  fi
  run_unit start lemans-demo-reset.timer
fi

if [[ -n "$BACKUP_TIMER" ]]; then
  run_unit start "$BACKUP_TIMER"
fi

ensure_caddy_route
run_unit restart "$WEB_SERVICE"
for i in {1..60}; do
  status="$(curl -sL -o /dev/null -w '%{http_code}' "http://127.0.0.1:${APP_PORT}${BASE_PATH}" || true)"
  [[ "$status" == "200" ]] && break
  sleep 1
done
if [[ "$(curl -sL -o /dev/null -w '%{http_code}' "http://127.0.0.1:${APP_PORT}${BASE_PATH}" || true)" != "200" ]]; then
  echo "Error: $WEB_SERVICE health check failed." >&2
  report_unit_failure "$WEB_SERVICE"
  exit 1
fi

public_status="$(curl -sSL --max-time 30 -o /dev/null -w '%{http_code}' "$PUBLIC_URL" || true)"
if [[ "$public_status" != "200" ]]; then
  echo "Error: public URL check failed for $PUBLIC_URL (HTTP ${public_status:-unavailable})." >&2
  echo "Confirm Caddy has a handle block for $BASE_PATH that preserves the prefix and proxies to $APP_CONTAINER:3000." >&2
  exit 1
fi

echo "Release ${RELEASE_ID} active at ${BASE_PATH}"
echo "Web: $(podman inspect "$APP_CONTAINER" --format '{{.ImageName}}')"
echo "Go:  $(podman inspect "$GO_CONTAINER" --format '{{.ImageName}}')"
echo "DB publishes: $(podman inspect "$DB_CONTAINER" --format '{{json .NetworkSettings.Ports}}')"
REMOTE_ACTIVATE
} | ssh_remote \
  "PROFILE='$PROFILE' RELEASE_ID='$RELEASE_ID' RELEASE_DIR='$RELEASE_DIR' QUADLET_PATH='$QUADLET_PATH' BASE_PATH='$BASE_PATH' PUBLIC_URL='$PUBLIC_URL' WEB_SERVICE='$WEB_SERVICE' GO_SERVICE='$GO_SERVICE' DB_SERVICE='$DB_SERVICE' NETWORK_SERVICE='$NETWORK_SERVICE' VOLUME_SERVICE='$VOLUME_SERVICE' CADDY_NETWORK_NAME='$CADDY_NETWORK_NAME' CADDY_SERVICE='$CADDY_SERVICE' CADDY_CONTAINER='$CADDY_CONTAINER' CADDY_CONFIG_FILE='$CADDY_CONFIG_FILE' CADDY_ROUTE_SOURCE='$CADDY_ROUTE_SOURCE_REMOTE' CADDY_ROUTE_TARGET_NAME='$CADDY_ROUTE_TARGET_NAME' CADDY_ROUTE_IMPORT='$CADDY_ROUTE_IMPORT' BACKUP_TIMER='$BACKUP_TIMER' DB_CONTAINER='$DB_CONTAINER' GO_CONTAINER='$GO_CONTAINER' APP_CONTAINER='$APP_CONTAINER' APP_PORT='$APP_PORT' DB_NAME='$DB_NAME' RESET_FLAG='$RESET_FLAG' DEMO_MODE='$DEMO_MODE_VALUE' bash -c 'IFS= read -r DB_PASSWORD; IFS= read -r B2_ACCESS_KEY_ID; IFS= read -r B2_SECRET_ACCESS_KEY; export DB_PASSWORD B2_ACCESS_KEY_ID B2_SECRET_ACCESS_KEY; exec bash -s'"

# The release path is intentionally expanded locally.
# shellcheck disable=SC2029
ssh_remote "rm -f '$RELEASE_DIR/source.tar.gz'"

echo "=== ${PROFILE_LABEL} deployed ==="
echo "Release manifest: ${RELEASE_DIR}/${RELEASE_ID}.json"
echo "Public URL: ${PUBLIC_URL}"
echo "Rollback: point ${QUADLET_PATH}/*.container to the prior release image tags, then run systemctl --user daemon-reload and restart the affected services."
