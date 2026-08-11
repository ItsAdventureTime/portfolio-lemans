#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

PROFILE="${1:-}"
shift || true
if [[ "$PROFILE" != "demo" && "$PROFILE" != "prod" ]]; then
  echo "Usage: $0 {demo|prod} [deploy options]" >&2
  exit 1
fi
exec "${PROJECT_ROOT}/scripts/deploy-remote-profile.sh" "$PROFILE" --sync-only "$@"
