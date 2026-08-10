# Migration Notes: Prisma/Next.js Monolith to Go API + Next.js 16

## What changed

- Replaced the Next.js monolithic data layer (Prisma, Better Auth, server actions) with a Go API backend.
- Upgraded Next.js from 14/15 to **16.3.0** and React from 18/19 to **19.2**.
- Removed all Prisma/Better Auth dependencies, `prisma/schema.prisma`, `src/middleware.ts`, the login page, and the auth API route.
- Added a Go module under `backend/`, PostgreSQL migrations under `backend/internal/db/migrations/`, and sqlc-generated repository under `backend/internal/repository/`.
- Added typed Go API client in `src/lib/api.ts` and role helpers in `src/lib/actor.ts`.
- Rewrote all main pages to call the Go API instead of Prisma.
- Split the single Dockerfile into `Dockerfile.web` (Next.js) and `Dockerfile.go` (Go API).
- Updated scripts (`build.sh`, `run-local.sh`, `stop-local.sh`, `reset-local.sh`, `verify-local.sh`, `verify-vertical-slice.sh`, `deploy-remote-demo.sh`, `deploy-remote-prod.sh`).
- Updated Quadlets to add Go API containers, attach web containers to both `caddy.network` and internal networks, and remove sleeping bridge containers.
- Removed `Dockerfile.dev` and `Dockerfile.prod`.
- Added `.env.demo` for local B2 configuration template.

## Database

- PostgreSQL `postgres:alpine` (latest stable on latest Alpine).
- Migrations embedded with `goose` and run automatically when the Go API container starts.
- Seeding is triggered by `POST /admin/seed` and only available when `DEMO_MODE=true`.

## Images

| Profile    | Web image                          | Go image                             |
| ---------- | ---------------------------------- | ------------------------------------ |
| Demo       | `lemans-bridge-dashboard:demo-web` | `lemans-bridge-dashboard-go:demo-go` |
| Production | `lemans-bridge-dashboard:prod-web` | `lemans-bridge-dashboard-go:prod-go` |

## Demo behavior

- No real authentication; a simulated `Enter as an Admin` splash may precede
  the Admin actor.
- Admin actor by default after entry, with a visible role switcher for all six
  roles.
- Role-sensitive actions validated server-side by the Go API using `X-Demo-Role` header.

## Known TODOs

- Add focused Go unit tests for policy, money math, and handlers.
- Add integration tests for the seed workflow inside a disposable Podman container.
- Verify remote Quadlet deployment on the VPS after user authorizes it.
- Update README with new quickstart.
- Review `docs/MIGRATION-HANDOFF.md` and update it as work progresses.

## Verification commands

```bash
export PATH="/opt/podman/bin:$PATH"
podman machine start
./scripts/build.sh demo
./scripts/run-local.sh
./scripts/verify-local.sh
./scripts/verify-vertical-slice.sh
./scripts/stop-local.sh
```
