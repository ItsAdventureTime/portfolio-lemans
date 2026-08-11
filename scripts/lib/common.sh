#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/podman/bin:$PATH"

generate_password() {
  openssl rand -hex 16
}

ensure_podman_machine() {
  if ! podman machine inspect podman-machine-default --format '{{.State}}' 2> /dev/null | grep -q 'running'; then
    echo "Starting podman machine..."
    podman machine start
  fi
}

wait_for_db() {
  local container_name="$1"
  local retries=30
  for ((i=1; i<=retries; i++)); do
    if podman exec "$container_name" pg_isready -U postgres > /dev/null 2>&1; then
      echo "Database ready"
      return 0
    fi
    sleep 1
  done
  echo "Database did not become ready."
  return 1
}

wait_for_http() {
  local url="$1"
  local network="${2:-}"
  local curl_args=("$url")
  if [[ -n "$network" ]]; then
    curl_args=("--network" "$network" "curlimages/curl:latest" "-s" "-o" "/dev/null" "-w" "%{http_code}" "$url")
  fi
  local retries=30
  for ((i=1; i<=retries; i++)); do
    local status
    if [[ -n "$network" ]]; then
      status=$(podman run --rm "${curl_args[@]}" 2> /dev/null || true)
    else
      status=$(curl -s -o /dev/null -w '%{http_code}' "$url" 2> /dev/null || true)
    fi
    if [[ "$status" == "200" ]]; then
      echo "HTTP endpoint is ready: $url"
      return 0
    fi
    sleep 1
  done
  echo "HTTP endpoint did not become ready: $url"
  return 1
}

# Targeted cleanup helpers - never do broad prunes
cleanup_containers() {
  local pattern="$1"
  local containers
  containers=$(podman ps -aq --filter "name=${pattern}" 2> /dev/null || true)
  if [[ -n "$containers" ]]; then
    # podman receives the newline-delimited container IDs as separate args.
    # shellcheck disable=SC2086
    podman rm -f $containers 2> /dev/null || true
  fi
}
