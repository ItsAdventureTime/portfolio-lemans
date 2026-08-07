#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/podman/bin:$PATH"

echo "=== Le Mans Phase 3 Verification ==="

# 1. Format / lint / type-check / tests via container
echo "[1/6] Running format check, lint, type-check and tests inside container..."
podman run --rm -v "${PROJECT_ROOT}:/app:rw" -w /app --env-file "${PROJECT_ROOT}/.env.demo" node:20-slim bash -c "
  npm run format:check
  npm run lint
  npm run typecheck
  npm test
"

# 2. Database migrations and seed on local-demo
echo "[2/6] Pushing schema and seeding local-demo database..."
podman exec lemans-demo-app sh -c "npx prisma db push --accept-data-loss && npx prisma generate && npx ts-node -P /app/tsconfig.seed.json /app/prisma/seed.ts"

# 3. Health checks on local-demo and local-prodlike
echo "[3/6] HTTP health checks..."
check_url() {
  local url=$1
  local expected=${2:-200}
  shift 2 || true
  local status
  status=$(curl -s -o /dev/null -w '%{http_code}' "$@" "${url}")
  # Extract only the first 3 characters in case curl wrote body to stdout unexpectedly
  status=${status:0:3}
  if [[ "${status}" != "${expected}" ]]; then
    echo "FAIL: ${url} returned ${status} (expected ${expected})"
    exit 1
  fi
  echo "OK: ${url} -> ${status}"
}

# Demo (requires auth cookie to bypass middleware for protected routes)
DEMO_TOKEN=$(curl -s http://127.0.0.1:3000/api/auth/sign-in/email -X POST -H 'Content-Type: application/json' -d '{"email":"admin@lemans.ph","password":"demo12345"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
DEMO_COOKIE="better-auth.session_token=${DEMO_TOKEN}"
check_url http://127.0.0.1:3000/
check_url http://127.0.0.1:3000/login
check_url http://127.0.0.1:3000/customers 200 -H "Cookie: ${DEMO_COOKIE}"
check_url http://127.0.0.1:3000/quotations 200 -H "Cookie: ${DEMO_COOKIE}"
check_url http://127.0.0.1:3000/job-orders 200 -H "Cookie: ${DEMO_COOKIE}"
check_url http://127.0.0.1:3000/job-orders/RA0003973 200 -H "Cookie: ${DEMO_COOKIE}"
check_url http://127.0.0.1:3000/job-costing/RA0003973 200 -H "Cookie: ${DEMO_COOKIE}"
check_url http://127.0.0.1:3000/purchasing 200 -H "Cookie: ${DEMO_COOKIE}"
check_url http://127.0.0.1:3000/expenses 200 -H "Cookie: ${DEMO_COOKIE}"
check_url http://127.0.0.1:3000/dcs 200 -H "Cookie: ${DEMO_COOKIE}"
check_url http://127.0.0.1:3000/invoices 200 -H "Cookie: ${DEMO_COOKIE}"
check_url http://127.0.0.1:3000/accounting 307 -H "Cookie: ${DEMO_COOKIE}"

# Prodlike
PROD_TOKEN=$(curl -s http://127.0.0.1:3001/api/auth/sign-in/email -X POST -H 'Content-Type: application/json' -d '{"email":"admin@lemans.ph","password":"demo12345"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
PROD_COOKIE="better-auth.session_token=${PROD_TOKEN}"
check_url http://127.0.0.1:3001/
check_url http://127.0.0.1:3001/login
check_url http://127.0.0.1:3001/customers 200 -H "Cookie: ${PROD_COOKIE}"
check_url http://127.0.0.1:3001/job-orders/RA0003973 200 -H "Cookie: ${PROD_COOKIE}"
check_url http://127.0.0.1:3001/job-costing/RA0003973 200 -H "Cookie: ${PROD_COOKIE}"
check_url http://127.0.0.1:3001/purchasing 200 -H "Cookie: ${PROD_COOKIE}"
check_url http://127.0.0.1:3001/expenses 200 -H "Cookie: ${PROD_COOKIE}"
check_url http://127.0.0.1:3001/dcs 200 -H "Cookie: ${PROD_COOKIE}"
check_url http://127.0.0.1:3001/invoices 200 -H "Cookie: ${PROD_COOKIE}"

# 4. Confirm DB ports are not published
echo "[4/6] Confirming database containers do not publish host ports..."
for c in lemans-demo-db lemans-prodlike-db; do
  published=$(podman inspect "${c}" --format '{{json .NetworkSettings.Ports}}' | grep -c '"HostPort"' || true)
  if [[ "${published}" -gt 0 ]]; then
    echo "FAIL: ${c} publishes host ports"
    exit 1
  fi
  echo "OK: ${c} has no published host ports"
done

# 5. Confirm prodlike app has no source bind mounts
echo "[5/6] Confirming prodlike app uses immutable image (no source bind mounts)..."
mnt_count=$(podman inspect lemans-prodlike-app --format '{{len .Mounts}}')
if [[ "${mnt_count}" -ne 0 ]]; then
  echo "FAIL: lemans-prodlike-app has bind mounts"
  exit 1
fi
echo "OK: lemans-prodlike-app has no bind mounts"

echo "[6/6] Phase 3 verification complete."
