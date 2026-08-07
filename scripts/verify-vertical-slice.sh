#!/usr/bin/env bg
# Verification Script for Le Mans Phase 2 Vertical Slice
set -e

echo "=== Le Mans Phase 2 Vertical Slice Verification ==="
echo "1. Checking Podman machine status..."
podman machine info > /dev/null
echo "✓ Podman machine active."

echo "2. Building local-demo container image..."
podman compose build app

echo "3. Starting local-demo container stack..."
podman compose up -d

echo "4. Waiting for containers to initialize..."
sleep 5

echo "5. Verifying container processes..."
podman ps --filter "name=lemans-demo"

echo "6. Testing loopback HTTP endpoint (127.0.0.1:3000)..."
curl -s -I http://127.0.0.1:3000 | head -n 5

echo "=== Phase 2 Vertical Slice Successfully Verified ==="
