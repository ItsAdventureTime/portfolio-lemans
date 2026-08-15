#!/bin/sh
set -eu

GO_HOST="${DEMO_API_HOST:-lemans-demo-go}"
GO_URL="http://${GO_HOST}:8080"

echo "=== Starting Le Mans remote demo reset ==="

# This script runs inside the rootless reset Quadlet container. Keep the
# orchestration inside the API network; the container cannot control the VPS
# user's systemd manager or Podman daemon.
until wget -q -T 2 -t 1 -O /dev/null "${GO_URL}/health"; do
  sleep 1
done

wget -q -T 30 -t 3 \
  --header='Content-Type: application/json' \
  --post-data='{}' \
  -O - "${GO_URL}/admin/seed"

echo "=== Remote demo reset complete ==="
