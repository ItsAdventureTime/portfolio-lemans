#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

: "${LEMANS_DB_PASSWORD:?Set LEMANS_DB_PASSWORD in the shell before starting Compose}"
: "${CLOUDFLARE_TUNNEL_TOKEN:?Set CLOUDFLARE_TUNNEL_TOKEN in the shell before starting Compose}"

docker compose up -d --build
docker compose ps
