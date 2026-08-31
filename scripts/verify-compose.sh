#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Safe placeholders make this a structural check; no secret value is committed.
LEMANS_DB_PASSWORD="${LEMANS_DB_PASSWORD:-compose-validation-only}"
CLOUDFLARE_TUNNEL_TOKEN="${CLOUDFLARE_TUNNEL_TOKEN:-compose-validation-only}"
export LEMANS_DB_PASSWORD CLOUDFLARE_TUNNEL_TOKEN

docker compose config >/dev/null
echo "Compose configuration is valid."
