#!/usr/bin/env bash
set -euo pipefail

GO_HOST="${DEMO_API_HOST:-lemans-demo-go}"
GO_URL="http://${GO_HOST}:8080"

echo "=== Starting Le Mans remote demo reset ==="

# This script runs inside the rootless reset Quadlet container. Keep the
# orchestration inside the API network; the container cannot control the VPS
# user's systemd manager or Podman daemon.
curl --fail --silent --show-error --retry 30 --retry-all-errors --retry-delay 1 \
  "${GO_URL}/health" >/dev/null

curl --fail --silent --show-error --retry 3 --retry-delay 1 \
  -X POST "${GO_URL}/admin/seed" \
  -H 'Content-Type: application/json' \
  -d '{}'

echo "=== Remote demo reset complete ==="
