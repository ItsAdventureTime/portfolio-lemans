#!/usr/bin/env bash
set -euo pipefail

# Local tooling runs inside the project Docker Sandbox. The sandbox provides
# the Docker CLI and daemon; remote VPS runtime scripts use Podman directly and
# do not source this helper.
CONTAINER_CLI="${CONTAINER_CLI:-docker}"

require_docker() {
  command -v "$CONTAINER_CLI" >/dev/null 2>&1 || {
    echo "Error: Docker is required inside the project Docker Sandbox." >&2
    echo "Run: jk-sbx-project exec -- <command>" >&2
    exit 1
  }
}

require_docker

generate_password() {
  openssl rand -hex 16
}

wait_for_db() {
  local container_name="$1"
  local retries=30
  for ((i=1; i<=retries; i++)); do
    if "$CONTAINER_CLI" exec "$container_name" pg_isready -U postgres > /dev/null 2>&1; then
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
    local platform
    platform="$("$CONTAINER_CLI" info --format '{{.OSType}}/{{.Architecture}}')"
    curl_args=("--platform" "$platform" "--network" "$network" "curlimages/curl:latest" "-s" "-o" "/dev/null" "-w" "%{http_code}" "$url")
  fi
  local retries=30
  for ((i=1; i<=retries; i++)); do
    local status
    if [[ -n "$network" ]]; then
      status=$("$CONTAINER_CLI" run --rm "${curl_args[@]}" 2> /dev/null || true)
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
  containers=$("$CONTAINER_CLI" ps -aq --filter "name=${pattern}" 2> /dev/null || true)
  if [[ -n "$containers" ]]; then
    # Docker receives the newline-delimited container IDs as separate args.
    # shellcheck disable=SC2086
    "$CONTAINER_CLI" rm -f $containers 2> /dev/null || true
  fi
}
