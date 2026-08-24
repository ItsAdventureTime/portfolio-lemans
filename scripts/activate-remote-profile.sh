#!/usr/bin/env bash
set -euo pipefail

# VPS-side activation. Run this from the synced current source tree. The VPS
# imports images built in the project Docker Sandbox, installs runtime
# configuration, starts the existing Quadlets, and performs deployment health
# checks. It does not compile, build, or run image smoke tests.

PROFILE="${1:-}"
shift || true
SOURCE_COMMIT=""
REMOTE_ROOT=""
QUADLET_PATH=""
PUBLIC_URL=""
CADDY_NETWORK_NAME="${CADDY_NETWORK_NAME:-caddy}"
CADDY_CONFIG_FILE="${CADDY_CONFIG_FILE:-/home/jk/caddy/conf/Caddyfile}"
CADDY_CONTAINER="caddy"
B2_FROM_STDIN="${B2_FROM_STDIN:-false}"
IMAGE_BUNDLE=""

while (($# > 0)); do
  case "$1" in
    --release-id) shift 2 ;; # accepted for older commands; no longer used
    --release-commit|--source-commit) SOURCE_COMMIT="${2:-}"; shift 2 ;;
    --remote-root) REMOTE_ROOT="${2:-}"; shift 2 ;;
    --quadlet-path) QUADLET_PATH="${2:-}"; shift 2 ;;
    --public-url) PUBLIC_URL="${2:-}"; shift 2 ;;
    --image-bundle) IMAGE_BUNDLE="${2:-}"; shift 2 ;;
    --caddy-network-name) CADDY_NETWORK_NAME="${2:-}"; shift 2 ;;
    --caddy-config-file) CADDY_CONFIG_FILE="${2:-}"; shift 2 ;;
    *) echo "Error: unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ "$PROFILE" != "demo" && "$PROFILE" != "prod" ]]; then
  echo "Usage: $0 {demo|prod} [options]" >&2
  exit 1
fi

BASE_PATH="/demo/lemans"
APP_PORT=3002
PROFILE_LABEL="remote demo"
WEB_SOURCE_TAG="demo-web"
GO_SOURCE_TAG="demo-go"
WEB_SERVICE="lemans-demo.service"
GO_SERVICE="lemans-demo-go.service"
DB_SERVICE="lemans-demo-db.service"
NETWORK_SERVICE="lemans-demo-network.service"
VOLUME_SERVICE="lemans-demo-volume.service"
DB_CONTAINER="lemans-demo-db"
GO_CONTAINER="lemans-demo-go"
APP_CONTAINER="lemans-demo-app"
DB_NAME="lemans_demo_db"
QUADLET_SOURCE_DIR="quadlet/remote-demo"
CADDY_ROUTE_SOURCE="caddy/lemans-demo.handlers.Caddyfile"
    CADDY_ROUTE_BEGIN="# BEGIN LEMANS DEMO ROUTE"
    CADDY_ROUTE_END="# END LEMANS DEMO ROUTE"
CADDY_ROUTE_IMPORT="/etc/caddy/lemans-demo.handlers.Caddyfile"
BACKUP_TIMER=""
DEMO_MODE=true

if [[ "$PROFILE" == "prod" ]]; then
  BASE_PATH="/prod/lemans"
  APP_PORT=3003
  PROFILE_LABEL="remote production"
  WEB_SOURCE_TAG="prod-web"
  GO_SOURCE_TAG="prod-go"
  WEB_SERVICE="lemans.service"
  GO_SERVICE="lemans-go.service"
  DB_SERVICE="lemans-db.service"
  NETWORK_SERVICE="lemans-network.service"
  VOLUME_SERVICE="lemans-volume.service"
  DB_CONTAINER="lemans-prod-db"
  GO_CONTAINER="lemans-prod-go"
  APP_CONTAINER="lemans-prod-app"
  DB_NAME="lemans_prod_db"
  QUADLET_SOURCE_DIR="quadlet/remote-prod"
  CADDY_ROUTE_SOURCE="caddy/lemans-prod.handlers.Caddyfile"
    CADDY_ROUTE_BEGIN="# BEGIN LEMANS PROD ROUTE"
    CADDY_ROUTE_END="# END LEMANS PROD ROUTE"
  CADDY_ROUTE_IMPORT="/etc/caddy/lemans-prod.handlers.Caddyfile"
  BACKUP_TIMER="lemans-backup.timer"
  DEMO_MODE=false
fi

if [[ "$PROFILE" == "demo" ]]; then
  DEFAULT_REMOTE_ROOT="/home/jk/bridge-ph/lemans-demo"
  DEFAULT_QUADLET_PATH="/home/jk/.config/containers/systemd/bridge-ph/lemans-demo"
  DEFAULT_PUBLIC_URL="https://delegateops.business/demo/lemans"
else
  DEFAULT_REMOTE_ROOT="/home/jk/bridge-ph/lemans"
  DEFAULT_QUADLET_PATH="/home/jk/.config/containers/systemd/bridge-ph/lemans"
  DEFAULT_PUBLIC_URL="https://delegateops.business/lemans"
fi

# The activation script runs from the stable current source directory.
SOURCE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE_ROOT_ARG="$REMOTE_ROOT"
if [[ -n "$REMOTE_ROOT_ARG" ]]; then
  REMOTE_ROOT="$REMOTE_ROOT_ARG"
elif [[ "$(basename "$SOURCE_ROOT")" == current ]]; then
  REMOTE_ROOT="$(cd "$SOURCE_ROOT/.." && pwd)"
else
  REMOTE_ROOT="$DEFAULT_REMOTE_ROOT"
fi
QUADLET_PATH="${QUADLET_PATH:-$DEFAULT_QUADLET_PATH}"
if [[ ! -d "$SOURCE_ROOT" || ! -f "$SOURCE_ROOT/package.json" ]]; then
  echo "Error: run this script from the synced current source directory." >&2
  exit 1
fi
mkdir -p "$QUADLET_PATH"
cd "$SOURCE_ROOT"

if [[ -z "$SOURCE_COMMIT" && -f "$SOURCE_ROOT/.lemans-source-commit" ]]; then
  SOURCE_COMMIT="$(<"$SOURCE_ROOT/.lemans-source-commit")"
fi
SOURCE_COMMIT="${SOURCE_COMMIT:-synced-source}"

if [[ -z "$PUBLIC_URL" && -f "$SOURCE_ROOT/.lemans-public-url" ]]; then
  PUBLIC_URL="$(<"$SOURCE_ROOT/.lemans-public-url")"
fi
PUBLIC_URL="${PUBLIC_URL:-$DEFAULT_PUBLIC_URL}"
if [[ "$PUBLIC_URL" != https://* || "$PUBLIC_URL" != *"${BASE_PATH}"* ]]; then
  echo "Error: PUBLIC_URL must be HTTPS and include ${BASE_PATH}." >&2
  exit 1
fi

IMAGE_BUNDLE="${IMAGE_BUNDLE:-$SOURCE_ROOT/.lemans-${PROFILE}-images.tar}"
IMAGE_CHECKSUM="${IMAGE_BUNDLE}.sha256"
for tool in podman systemctl loginctl install sed awk mktemp openssl curl grep sha256sum; do
  command -v "$tool" >/dev/null 2>&1 || {
    echo "Error: required VPS tool not found: $tool" >&2
    exit 1
  }
done

rootless="$(podman info --format '{{.Host.Security.Rootless}}')"
if [[ "$rootless" != "true" ]]; then
  echo "Error: remote Podman is not rootless." >&2
  exit 1
fi

if [[ "$B2_FROM_STDIN" == true ]]; then
  IFS= read -r B2_ACCESS_KEY_ID
  IFS= read -r B2_SECRET_ACCESS_KEY
else
  B2_ACCESS_KEY_ID="${B2_ACCESS_KEY_ID:-}"
  B2_SECRET_ACCESS_KEY="${B2_SECRET_ACCESS_KEY:-}"
  if [[ -z "$B2_ACCESS_KEY_ID" ]]; then
    read -r -p "Backblaze B2 Access Key ID: " B2_ACCESS_KEY_ID
  fi
  if [[ -z "$B2_SECRET_ACCESS_KEY" ]]; then
    read -r -s -p "Backblaze B2 Secret Access Key: " B2_SECRET_ACCESS_KEY
    echo
  fi
fi
if [[ -z "$B2_ACCESS_KEY_ID" || -z "$B2_SECRET_ACCESS_KEY" ]]; then
  echo "Error: both Backblaze B2 credentials are required." >&2
  exit 1
fi

WEB_IMAGE="localhost/lemans-bridge-dashboard:${WEB_SOURCE_TAG}"
GO_IMAGE="localhost/lemans-bridge-dashboard-go:${GO_SOURCE_TAG}"

# Keep the existing database password across deployments. A new password is
# generated only when this profile has no prior generated DATABASE_URL.
if [[ "$PROFILE" == "demo" ]]; then
  GO_UNIT_NAME="lemans-demo-go"
  DB_UNIT_NAME="lemans-demo-db"
  DB_SECRET_NAME="lemans_demo_db_password"
  DB_VOLUME_NAME="lemans-demo-db-data"
else
  GO_UNIT_NAME="lemans-go"
  DB_UNIT_NAME="lemans-db"
  DB_SECRET_NAME="lemans_prod_db_password"
  DB_VOLUME_NAME="lemans-prod-db-data"
fi
GO_UNIT_FILE="$QUADLET_PATH/${GO_UNIT_NAME}.container"
DB_UNIT_FILE="$QUADLET_PATH/${DB_UNIT_NAME}.container"
DB_PASSWORD=""
if [[ -f "$GO_UNIT_FILE" ]]; then
  existing_url="$(awk -F= '/^Environment=DATABASE_URL=/{sub(/^Environment=DATABASE_URL=/, ""); print; exit}' "$GO_UNIT_FILE" || true)"
  if [[ "$existing_url" =~ ^postgresql://[^:]+:([^@]+)@ ]]; then
    DB_PASSWORD="${BASH_REMATCH[1]}"
  fi
fi
legacy_secret_in_use=false
if [[ -f "$DB_UNIT_FILE" ]] && grep -Fq 'Secret=db_password,' "$DB_UNIT_FILE"; then
  legacy_secret_in_use=true
fi
if [[ -z "$DB_PASSWORD" ]] && podman secret inspect "$DB_SECRET_NAME" >/dev/null 2>&1; then
  DB_PASSWORD="$(podman secret inspect --showsecret --format '{{.SecretData}}' "$DB_SECRET_NAME")"
fi
if [[ -z "$DB_PASSWORD" && "$legacy_secret_in_use" == true ]] && podman secret inspect db_password >/dev/null 2>&1; then
  echo "Migrating legacy secret db_password to ${DB_SECRET_NAME}."
  DB_PASSWORD="$(podman secret inspect --showsecret --format '{{.SecretData}}' db_password)"
fi
if [[ -z "$DB_PASSWORD" ]] && podman volume exists "$DB_VOLUME_NAME" >/dev/null 2>&1; then
  echo "Error: ${DB_UNIT_NAME} has existing data but its database password cannot be recovered." >&2
  echo "Restore the prior profile Quadlet or perform an explicitly planned password rotation." >&2
  exit 1
fi
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -hex 16)}"

if ! podman secret inspect "$DB_SECRET_NAME" >/dev/null 2>&1; then
  printf '%s' "$DB_PASSWORD" | podman secret create "$DB_SECRET_NAME" - >/dev/null
fi

echo "=== ${PROFILE_LABEL} activation on VPS ==="
echo "Source commit: ${SOURCE_COMMIT}"
echo "Source: ${SOURCE_ROOT}"

echo "[1/5] Importing locally built image bundle on the VPS..."
if [[ ! -s "$IMAGE_BUNDLE" || ! -s "$IMAGE_CHECKSUM" ]]; then
  echo "Error: image bundle or checksum is missing: ${IMAGE_BUNDLE}" >&2
  echo "Run the local deployment wrapper to build and transfer the bundle." >&2
  exit 1
fi
if ! (
  cd "$(dirname "$IMAGE_BUNDLE")"
  sha256sum -c "$(basename "$IMAGE_CHECKSUM")"
); then
  echo "Error: image bundle checksum verification failed." >&2
  exit 1
fi
podman load --input "$IMAGE_BUNDLE"

WEB_ID="$(podman image inspect "$WEB_IMAGE" --format '{{.Id}}')"
GO_ID="$(podman image inspect "$GO_IMAGE" --format '{{.Id}}')"

echo "[2/5] Installing Quadlets and runtime configuration..."
for file in "$SOURCE_ROOT/$QUADLET_SOURCE_DIR"/*.container \
            "$SOURCE_ROOT/$QUADLET_SOURCE_DIR"/*.network \
            "$SOURCE_ROOT/$QUADLET_SOURCE_DIR"/*.volume; do
  [[ -f "$file" ]] || continue
  install -m 0644 "$file" "$QUADLET_PATH/$(basename "$file")"
done
for file in "$SOURCE_ROOT/$QUADLET_SOURCE_DIR"/*.service \
            "$SOURCE_ROOT/$QUADLET_SOURCE_DIR"/*.sh; do
  [[ -f "$file" ]] || continue
  mode=0644
  [[ "$file" == *.sh ]] && mode=0755
  install -m "$mode" "$file" "$QUADLET_PATH/$(basename "$file")"
done
systemd_user_dir="$HOME/.config/systemd/user"
install -d -m 0755 "$systemd_user_dir"
for file in "$SOURCE_ROOT/$QUADLET_SOURCE_DIR"/*.timer; do
  [[ -f "$file" ]] || continue
  install -m 0644 "$file" "$systemd_user_dir/$(basename "$file")"
done

rm -f "$QUADLET_PATH/lemans-demo.env" "$QUADLET_PATH/lemans.env"
if grep -R -n --fixed-strings 'EnvironmentFile=' "$QUADLET_PATH"/*.container; then
  echo "Error: external EnvironmentFile= references are not allowed." >&2
  exit 1
fi

sed -i \
  -e "s#docker.io/library/lemans-bridge-dashboard:${WEB_SOURCE_TAG}#${WEB_IMAGE}#g" \
  -e "s#docker.io/library/lemans-bridge-dashboard-go:${GO_SOURCE_TAG}#${GO_IMAGE}#g" \
  "$QUADLET_PATH"/*.container

runtime_file="$(mktemp)"
runtime_temp="$(mktemp)"
trap 'rm -f "$runtime_file" "$runtime_temp"' EXIT
printf '%s\n' \
  "Environment=DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@${DB_CONTAINER}:5432/${DB_NAME}" \
  "Environment=B2_ACCESS_KEY_ID=${B2_ACCESS_KEY_ID}" \
  "Environment=B2_SECRET_ACCESS_KEY=${B2_SECRET_ACCESS_KEY}" > "$runtime_file"
awk -v runtime_file="$runtime_file" '
  $0 == "[Service]" && !inserted {
    while ((getline line < runtime_file) > 0) print line
    close(runtime_file)
    inserted=1
  }
  { print }
  END { if (!inserted) exit 7 }
' "$GO_UNIT_FILE" > "$runtime_temp"
install -m 0600 "$runtime_temp" "$GO_UNIT_FILE"

cat > "$REMOTE_ROOT/deployment.json" <<EOF
{
  "commit": "${SOURCE_COMMIT}",
  "web_image": "${WEB_IMAGE}",
  "web_image_id": "${WEB_ID}",
  "go_image": "${GO_IMAGE}",
  "go_image_id": "${GO_ID}",
  "base_path": "${BASE_PATH}"
}
EOF

report_unit_failure() {
  local unit="$1"
  echo "--- ${unit} status ---" >&2
  systemctl --user status "$unit" --no-pager --full || true
  echo "--- ${unit} journal (current boot) ---" >&2
  journalctl --user -u "$unit" -b -n 200 --no-pager || true
}

run_unit() {
  local action="$1" unit="$2"
  if ! systemctl --user "$action" "$unit"; then
    echo "Error: could not $action $unit." >&2
    report_unit_failure "$unit"
    exit 1
  fi
}

echo "[3/5] Loading and starting Quadlet services..."
systemctl --user daemon-reload
expected_units=("$NETWORK_SERVICE" "$VOLUME_SERVICE" "$DB_SERVICE" "$GO_SERVICE" "$WEB_SERVICE")
if [[ "$DEMO_MODE" == true ]]; then
  expected_units+=(lemans-demo-reset.service lemans-demo-reset.timer)
else
  expected_units+=(lemans-backup.service lemans-backup.timer)
fi
for unit in "${expected_units[@]}"; do
  load_state="$(systemctl --user show "$unit" --property=LoadState --value 2>/dev/null || true)"
  [[ "$load_state" == loaded ]] || {
    echo "Error: required unit did not load: $unit (LoadState=${load_state:-not-found})" >&2
    exit 1
  }
done

if [[ "$(loginctl show-user "$(id -un)" -p Linger --value 2>/dev/null || true)" != yes ]]; then
  echo "Error: user linger is not enabled. Ask an operator to run:" >&2
  echo "  loginctl enable-linger $(id -un)" >&2
  exit 1
fi

if ! systemctl --user is-active --quiet caddy.service; then
  run_unit start caddy.service
fi
if ! podman network exists "$CADDY_NETWORK_NAME"; then
  echo "Error: required shared Caddy network does not exist: $CADDY_NETWORK_NAME" >&2
  exit 1
fi

run_unit start "$NETWORK_SERVICE"
run_unit start "$VOLUME_SERVICE"
run_unit start "$DB_SERVICE"
for i in {1..60}; do
  podman exec "$DB_CONTAINER" pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 1
done
if ! podman exec "$DB_CONTAINER" pg_isready -U postgres >/dev/null 2>&1; then
  echo "Error: $DB_SERVICE did not become ready." >&2
  report_unit_failure "$DB_SERVICE"
  exit 1
fi

run_unit restart "$GO_SERVICE"
for i in {1..60}; do
  podman exec "$GO_CONTAINER" wget -q -T 2 -t 1 -O /dev/null http://127.0.0.1:8080/health && break || true
  sleep 1
done
if ! podman exec "$GO_CONTAINER" wget -q -T 5 -t 1 -O /dev/null http://127.0.0.1:8080/health; then
  echo "Error: $GO_SERVICE health check failed." >&2
  report_unit_failure "$GO_SERVICE"
  exit 1
fi

if [[ "$DEMO_MODE" == true ]]; then
  count="$(podman exec "$DB_CONTAINER" psql -U postgres -d "$DB_NAME" -tAc 'SELECT count(*) FROM customers' | tr -d ' ' || echo 0)"
  if [[ "${RESET:-false}" == true || "$count" == 0 ]]; then
    podman exec "$GO_CONTAINER" wget -q -T 30 -t 3 \
      --header='Content-Type: application/json' \
      --post-data='{}' \
      -O - http://127.0.0.1:8080/admin/seed
  fi
  run_unit start lemans-demo-reset.timer
else
  run_unit start "$BACKUP_TIMER"
fi

ensure_caddy_route() {
  [[ -n "$CADDY_ROUTE_SOURCE" ]] || return 0
  # UID 0 is root only inside Caddy's rootless user namespace. The Caddy image
  # default user may not read files on the Quadlet bind mount.
  caddy_cli() {
    podman exec --user 0 "$CADDY_CONTAINER" caddy "$@"
  }
  caddy_cli_stdin() {
    podman exec -i --user 0 "$CADDY_CONTAINER" caddy "$@"
  }
  local config_dir="${CADDY_CONFIG_FILE%/*}"
  local handler_file="${config_dir}/${CADDY_ROUTE_IMPORT##*/}"
  local temp_handler="$(mktemp "${config_dir}/.${CADDY_ROUTE_IMPORT##*/}.XXXXXX")"
  local temp_config="$(mktemp)" formatted="$(mktemp)"
  relabel_caddy_files() {
    # Quadlet's :Z mount labels existing files when Caddy starts. Files copied
    # into that mount later may need the same label before a reload/restart.
    if command -v chcon >/dev/null 2>&1; then
      podman unshare chcon -Rt container_file_t "$config_dir" \
        >/dev/null 2>&1 || true
    fi
  }
  caddy_cli_stdin fmt - < "$SOURCE_ROOT/$CADDY_ROUTE_SOURCE" > "$temp_handler" || {
    echo "Error: tracked Le Mans Caddy route could not be formatted." >&2
    exit 1
  }
  chmod 0644 "$temp_handler"
  mv -f "$temp_handler" "$handler_file"
  relabel_caddy_files
  awk -v import_path="$CADDY_ROUTE_IMPORT" \
    -v begin_marker="$CADDY_ROUTE_BEGIN" -v end_marker="$CADDY_ROUTE_END" '
    function is_import(line, path, trimmed) {
      trimmed=line
      sub(/^[[:space:]]*import[[:space:]]+/, "", trimmed)
      sub(/[[:space:]]*$/, "", trimmed)
      return trimmed == path
    }
    is_import($0, import_path) { next }
    function is_marker(line, marker, trimmed) {
      trimmed=line
      sub(/^[[:space:]]+/, "", trimmed)
      sub(/[[:space:]]+$/, "", trimmed)
      return trimmed == marker
    }
    is_marker($0, begin_marker) { skipping=1; next }
    skipping && is_marker($0, end_marker) { skipping=0; next }
    !skipping && !inserted && $0 ~ /^[[:space:]]*# DelegateOps static-site fallback[[:space:]]*$/ {
      print "import " import_path
      print ""
      inserted=1
    }
    !skipping { print }
    END { if (!inserted) exit 7 }
  ' "$CADDY_CONFIG_FILE" > "$temp_config" || {
    echo "Error: DelegateOps static fallback marker was not found in Caddyfile." >&2
    exit 1
  }
  if ! caddy_validation_output="$(
    caddy_cli_stdin validate --config - --adapter caddyfile \
      < "$temp_config" 2>&1
  )"; then
    printf '%s\n' "$caddy_validation_output" >&2
    echo "Error: generated Caddyfile failed validation; active file was not changed." >&2
    exit 1
  fi
  caddy_cli_stdin fmt - < "$temp_config" > "$formatted" || {
    echo "Error: generated Caddyfile could not be formatted." >&2
    exit 1
  }
  install -m 0644 "$formatted" "$CADDY_CONFIG_FILE"
  relabel_caddy_files
  caddy_reload_output=""
  if ! caddy_reload_output="$(
    caddy_cli reload --config /etc/caddy/Caddyfile --adapter caddyfile 2>&1
  )"; then
    if ! grep -qi 'permission denied' <<< "$caddy_reload_output"; then
      printf '%s\n' "$caddy_reload_output" >&2
      echo "Error: graceful Caddy reload failed; the active file was not reloaded." >&2
      exit 1
    fi
    echo "Refreshing the Caddy config mount label before reload." >&2
    if ! systemctl --user restart caddy.service; then
      report_unit_failure caddy.service
      echo "Error: Caddy could not restart to refresh its config mount label." >&2
      exit 1
    fi
    if ! caddy_validation_output="$(
      caddy_cli validate --config /etc/caddy/Caddyfile --adapter caddyfile 2>&1
    )"; then
      printf '%s\n' "$caddy_validation_output" >&2
      echo "Error: Caddy validation failed after refreshing its config mount." >&2
      exit 1
    fi
    if ! caddy_reload_output="$(
      caddy_cli reload --config /etc/caddy/Caddyfile --adapter caddyfile 2>&1
    )"; then
      printf '%s\n' "$caddy_reload_output" >&2
      echo "Error: graceful Caddy reload failed after refreshing its config mount." >&2
      exit 1
    fi
  fi
  rm -f "$temp_config" "$formatted"
  echo "Caddy configuration validated and gracefully reloaded."
}

echo "[4/5] Validating Caddy and the deployed web runtime..."
ensure_caddy_route
run_unit restart "$WEB_SERVICE"
for i in {1..60}; do
  status="$(curl -sL -o /dev/null -w '%{http_code}' "http://127.0.0.1:${APP_PORT}${BASE_PATH}" || true)"
  [[ "$status" == 200 ]] && break
  sleep 1
done
if [[ "$(curl -sL -o /dev/null -w '%{http_code}' "http://127.0.0.1:${APP_PORT}${BASE_PATH}" || true)" != 200 ]]; then
  echo "Error: $WEB_SERVICE health check failed." >&2
  report_unit_failure "$WEB_SERVICE"
  exit 1
fi

public_status="$(curl -sS --max-time 30 -o /dev/null -w '%{http_code}' "$PUBLIC_URL" || true)"
if [[ "$public_status" != 200 ]]; then
  echo "Error: public URL check failed for $PUBLIC_URL (HTTP ${public_status:-unavailable})." >&2
  echo "Inspect redirects with: curl -sSIL --max-redirs 10 '$PUBLIC_URL'" >&2
  exit 1
fi

# Remove only this profile's obsolete directories and image tags. Do
# not use broad Podman prune commands; unrelated applications must remain intact.
if [[ -d "$REMOTE_ROOT/releases" ]]; then
  find "$REMOTE_ROOT/releases" -mindepth 1 -maxdepth 1 -type d -exec rm -rf -- {} +
  rmdir "$REMOTE_ROOT/releases" 2>/dev/null || true
fi
legacy_image_prefix="${WEB_SOURCE_TAG}|${GO_SOURCE_TAG}"
while IFS= read -r image; do
  [[ -n "$image" ]] || continue
  podman image rm "$image" >/dev/null 2>&1 || true
done < <(podman image ls --format '{{.Repository}}:{{.Tag}}' | grep -E "^localhost/(lemans-bridge-dashboard|lemans-bridge-dashboard-go):(${legacy_image_prefix})-[0-9]{8}-[0-9]{6}-[0-9a-f]{8}$" || true)

echo "[5/5] ${PROFILE_LABEL} deployment active."
echo "Deployment manifest: ${REMOTE_ROOT}/deployment.json"
echo "Public URL: ${PUBLIC_URL}"
echo "Web image: ${WEB_IMAGE}"
echo "Go image: ${GO_IMAGE}"
