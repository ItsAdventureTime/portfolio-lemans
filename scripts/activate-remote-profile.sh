#!/usr/bin/env bash
set -euo pipefail

# VPS-side activation. Run this from a synced release source tree. All builds,
# smoke checks, service changes, and health checks stay on the VPS.

PROFILE="${1:-}"
shift || true
RELEASE_ID=""
RELEASE_COMMIT="synced-source"
REMOTE_ROOT=""
QUADLET_PATH=""
PUBLIC_URL=""
CADDY_NETWORK_NAME="${CADDY_NETWORK_NAME:-caddy}"
CADDY_CONFIG_FILE="${CADDY_CONFIG_FILE:-/home/jk/caddy/conf/Caddyfile}"
CADDY_CONTAINER="caddy"
B2_FROM_STDIN="${B2_FROM_STDIN:-false}"

while (($# > 0)); do
  case "$1" in
    --release-id) RELEASE_ID="${2:-}"; shift 2 ;;
    --release-commit) RELEASE_COMMIT="${2:-}"; shift 2 ;;
    --remote-root) REMOTE_ROOT="${2:-}"; shift 2 ;;
    --quadlet-path) QUADLET_PATH="${2:-}"; shift 2 ;;
    --public-url) PUBLIC_URL="${2:-}"; shift 2 ;;
    --caddy-network-name) CADDY_NETWORK_NAME="${2:-}"; shift 2 ;;
    --caddy-config-file) CADDY_CONFIG_FILE="${2:-}"; shift 2 ;;
    *) echo "Error: unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ "$PROFILE" != "demo" && "$PROFILE" != "prod" ]]; then
  echo "Usage: $0 {demo|prod} --release-id RELEASE_ID [options]" >&2
  exit 1
fi
if [[ -z "$RELEASE_ID" || ! "$RELEASE_ID" =~ ^[0-9]{8}-[0-9]{6}-[0-9a-f]{8}$ ]]; then
  echo "Error: a valid --release-id is required." >&2
  exit 1
fi

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
DB_CONTAINER="lemans-demo-db"
GO_CONTAINER="lemans-demo-go"
APP_CONTAINER="lemans-demo-app"
DB_NAME="lemans_demo_db"
QUADLET_SOURCE_DIR="quadlet/remote-demo"
CADDY_ROUTE_SOURCE="caddy/lemans-demo.handlers.Caddyfile"
CADDY_ROUTE_TARGET_NAME="lemans-demo.handlers.Caddyfile"
CADDY_ROUTE_IMPORT="/etc/caddy/lemans-demo.handlers.Caddyfile"
BACKUP_TIMER=""
DEMO_MODE=true

if [[ "$PROFILE" == "prod" ]]; then
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
  DB_CONTAINER="lemans-prod-db"
  GO_CONTAINER="lemans-prod-go"
  APP_CONTAINER="lemans-prod-app"
  DB_NAME="lemans_prod_db"
  QUADLET_SOURCE_DIR="quadlet/remote-prod"
  CADDY_ROUTE_SOURCE=""
  CADDY_ROUTE_TARGET_NAME=""
  CADDY_ROUTE_IMPORT=""
  BACKUP_TIMER="lemans-backup.timer"
  DEMO_MODE=false
fi

if [[ "$PROFILE" == "demo" ]]; then
  DEFAULT_REMOTE_ROOT="/home/jk/bridge-ph/lemans-demo"
  DEFAULT_QUADLET_PATH="/home/jk/.config/containers/systemd/bridge-ph/lemans-demo"
  DEFAULT_PUBLIC_URL="https://delegateops.business/lemans/demo"
else
  DEFAULT_REMOTE_ROOT="/home/jk/bridge-ph/lemans"
  DEFAULT_QUADLET_PATH="/home/jk/.config/containers/systemd/bridge-ph/lemans"
  DEFAULT_PUBLIC_URL="https://delegateops.business/lemans"
fi
REMOTE_ROOT="${REMOTE_ROOT:-$DEFAULT_REMOTE_ROOT}"
QUADLET_PATH="${QUADLET_PATH:-$DEFAULT_QUADLET_PATH}"

# The activation script runs from releases/<id>/source.
SOURCE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE_DIR="${REMOTE_ROOT}/releases/${RELEASE_ID}"
if [[ ! -d "$SOURCE_ROOT" || ! -f "$SOURCE_ROOT/package.json" ]]; then
  echo "Error: run this script from a synced release source tree." >&2
  exit 1
fi
mkdir -p "$RELEASE_DIR" "$QUADLET_PATH"
cd "$SOURCE_ROOT"

PUBLIC_URL="${PUBLIC_URL:-$DEFAULT_PUBLIC_URL}"
if [[ "$PUBLIC_URL" != https://* || "$PUBLIC_URL" != *"${BASE_PATH}"* ]]; then
  echo "Error: PUBLIC_URL must be HTTPS and include ${BASE_PATH}." >&2
  exit 1
fi

for tool in podman systemctl loginctl install sed awk mktemp openssl curl grep; do
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

WEB_IMAGE="localhost/lemans-bridge-dashboard:${WEB_SOURCE_TAG}-${RELEASE_ID}"
GO_IMAGE="localhost/lemans-bridge-dashboard-go:${GO_SOURCE_TAG}-${RELEASE_ID}"

# Keep the existing database password across releases. A new password is
# generated only when this profile has no prior generated DATABASE_URL.
if [[ "$PROFILE" == "demo" ]]; then
  GO_UNIT_NAME="lemans-demo-go"
else
  GO_UNIT_NAME="lemans-go"
fi
GO_UNIT_FILE="$QUADLET_PATH/${GO_UNIT_NAME}.container"
DB_PASSWORD=""
if [[ -f "$GO_UNIT_FILE" ]]; then
  existing_url="$(awk -F= '/^Environment=DATABASE_URL=/{sub(/^Environment=DATABASE_URL=/, ""); print; exit}' "$GO_UNIT_FILE" || true)"
  if [[ "$existing_url" =~ ^postgresql://[^:]+:([^@]+)@ ]]; then
    DB_PASSWORD="${BASH_REMATCH[1]}"
  fi
fi
if [[ -z "$DB_PASSWORD" ]] && podman secret inspect db_password >/dev/null 2>&1; then
  echo "Error: db_password already exists but no prior DATABASE_URL is available." >&2
  echo "Restore the previous Go API Quadlet or rotate the database password deliberately." >&2
  exit 1
fi
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -hex 16)}"

if ! podman secret inspect db_password >/dev/null 2>&1; then
  printf '%s' "$DB_PASSWORD" | podman secret create db_password - >/dev/null
fi

echo "=== ${PROFILE_LABEL} activation on VPS ==="
echo "Release: ${RELEASE_ID}"
echo "Source: ${SOURCE_ROOT}"

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

echo "[4/5] Installing release-specific Quadlets and runtime configuration..."
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
  status="$(podman exec "$GO_CONTAINER" curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/health || true)"
  [[ "$status" == 200 ]] && break
  sleep 1
done
if [[ "$(podman exec "$GO_CONTAINER" curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/health || true)" != 200 ]]; then
  echo "Error: $GO_SERVICE health check failed." >&2
  report_unit_failure "$GO_SERVICE"
  exit 1
fi

if [[ "$DEMO_MODE" == true ]]; then
  count="$(podman exec "$DB_CONTAINER" psql -U postgres -d "$DB_NAME" -tAc 'SELECT count(*) FROM customers' | tr -d ' ' || echo 0)"
  if [[ "${RESET:-false}" == true || "$count" == 0 ]]; then
    podman exec "$GO_CONTAINER" curl -fsS -X POST http://127.0.0.1:8080/admin/seed \
      -H 'Content-Type: application/json' -d '{}'
  fi
  run_unit start lemans-demo-reset.timer
else
  run_unit start "$BACKUP_TIMER"
fi

ensure_caddy_route() {
  [[ -n "$CADDY_ROUTE_SOURCE" ]] || return 0
  local config_dir="${CADDY_CONFIG_FILE%/*}"
  local route_file="${config_dir}/${CADDY_ROUTE_TARGET_NAME}"
  local import_line="import ${CADDY_ROUTE_IMPORT}"
  local config_backup="${CADDY_CONFIG_FILE}.bak.${RELEASE_ID}"
  local route_backup="${route_file}.bak.${RELEASE_ID}"
  local temp_route="$(mktemp)" temp_config="$(mktemp)" formatted="$(mktemp)"
  install -m 0644 "$CADDY_CONFIG_FILE" "$config_backup"
  [[ -f "$route_file" ]] && install -m 0644 "$route_file" "$route_backup"
  install -m 0644 "$SOURCE_ROOT/$CADDY_ROUTE_SOURCE" "$route_file"
  if ! grep -Fq "$import_line" "$CADDY_CONFIG_FILE"; then
    awk -v import_line="$import_line" '
      !inserted && $0 ~ /^[[:space:]]*# DelegateOps static-site fallback[[:space:]]*$/ {
        print "\t" import_line; inserted=1
      }
      { print }
      END { if (!inserted) exit 7 }
    ' "$CADDY_CONFIG_FILE" > "$temp_config"
    install -m 0644 "$temp_config" "$CADDY_CONFIG_FILE"
  fi
  if ! podman exec "$CADDY_CONTAINER" caddy fmt "/etc/caddy/${CADDY_ROUTE_TARGET_NAME}" > "$temp_route" ||
     ! podman exec "$CADDY_CONTAINER" caddy fmt /etc/caddy/Caddyfile > "$formatted"; then
    install -m 0644 "$config_backup" "$CADDY_CONFIG_FILE"
    [[ -f "$route_backup" ]] && install -m 0644 "$route_backup" "$route_file" || rm -f "$route_file"
    echo "Error: Caddy formatting failed." >&2
    exit 1
  fi
  install -m 0644 "$temp_route" "$route_file"
  install -m 0644 "$formatted" "$CADDY_CONFIG_FILE"
  if ! podman exec "$CADDY_CONTAINER" caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile; then
    install -m 0644 "$config_backup" "$CADDY_CONFIG_FILE"
    [[ -f "$route_backup" ]] && install -m 0644 "$route_backup" "$route_file" || rm -f "$route_file"
    echo "Error: Caddyfile validation failed; previous configuration restored." >&2
    exit 1
  fi
  if ! podman exec "$CADDY_CONTAINER" caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile; then
    install -m 0644 "$config_backup" "$CADDY_CONFIG_FILE"
    [[ -f "$route_backup" ]] && install -m 0644 "$route_backup" "$route_file" || rm -f "$route_file"
    echo "Error: graceful Caddy reload failed; previous configuration restored." >&2
    exit 1
  fi
  rm -f "$temp_route" "$temp_config" "$formatted"
  echo "Caddy configuration validated and gracefully reloaded."
}

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

public_status="$(curl -sSL --max-time 30 -o /dev/null -w '%{http_code}' "$PUBLIC_URL" || true)"
if [[ "$public_status" != 200 ]]; then
  echo "Error: public URL check failed for $PUBLIC_URL (HTTP ${public_status:-unavailable})." >&2
  exit 1
fi

echo "[5/5] ${PROFILE_LABEL} release active."
echo "Release manifest: ${RELEASE_DIR}/${RELEASE_ID}.json"
echo "Public URL: ${PUBLIC_URL}"
echo "Web image: ${WEB_IMAGE}"
echo "Go image: ${GO_IMAGE}"
