# Le Mans Migration Handoff & Review Document

**Commit**: `da8655e` on `main`  
**Date**: 2026-08-10  
**Scope**: Replace the Prisma/Next.js monolith with a Go API backend + Next.js 16 frontend.  
**Status**: Local verification passes; ready for review / remote deployment.

---

## 1. What changed (high-level)

| Area | Before | After |
| ---- | ------ | ----- |
| Frontend framework | Next.js 14/15, React 18/19, Prisma, Better Auth | Next.js 16.3.0, React 19.2, no Prisma, no Better Auth |
| Data layer | Next.js server actions + Prisma client | Go latest API (`backend/`) + typed client `src/lib/api.ts` |
| Runtime | Single app container | PostgreSQL (latest Alpine) + Go API + Next.js web container |
| Images | `lemans-bridge-dashboard:latest-alpine` / `lts-alpine` | `lemans-bridge-dashboard:{demo,prod}-web` + `lemans-bridge-dashboard-go:{demo,prod}-go` |
| Migrations | `prisma migrate deploy` / `npx prisma db push` | Embedded `goose` migrations run automatically in Go container |
| Auth | Better Auth + login | Demo-only role simulation via cookie/header |
| Object storage | AWS SDK JS v3 in Next.js | AWS SDK Go v2 in Go API, presigned URLs served to frontend |

---

## 2. New repository layout

```text
lemans-bridge-dashboard/
├── backend/                          # Go API backend
│   ├── cmd/api/main.go
│   ├── go.mod / go.sum
│   ├── internal/
│   │   ├── actor/                    # demo actor / X-Demo-Role parsing
│   │   ├── api/                      # Chi router + HTTP handlers
│   │   ├── b2/                       # Backblaze B2 presigned URL helpers
│   │   ├── config/                   # env-based config
│   │   ├── db/                       # goose migrations (embed)
│   │   ├── logger/                   # slog JSON logging
│   │   ├── mathx/                    # money / VAT / costing math
│   │   ├── policy/                   # demo role permissions
│   │   └── repository/               # sqlc-generated PostgreSQL repository
│   ├── queries.sql                   # sqlc queries
│   └── sqlc.yaml
├── src/                              # Next.js 16 frontend
│   ├── lib/api.ts                    # typed Go API client (server-only)
│   ├── lib/actor.ts                  # demo role helpers
│   ├── lib/roles.ts                  # role policy matrix
│   ├── components/RoleSwitcher.tsx   # UI role switcher
│   └── app/...                       # rewritten pages
├── Dockerfile.web                    # Next.js standalone image
├── Dockerfile.go                     # Go API image
├── .dockerignore                     # reduced build context
├── .env.demo                         # local B2 env template
├── scripts/                          # build, run, verify, deploy helpers
└── quadlet/                          # remote demo/prod Quadlet units
```

---

## 3. Technology choices with official guidance consulted

### Next.js 16 self-hosting
- Official docs recommend `output: 'standalone'` for Docker/self-hosted deployments to produce a minimal runtime image.
- Reverse proxy should handle public traffic; app binds to loopback/internal interfaces.
- Source: https://nextjs.org/docs/app/getting-started/deploying, https://nextjs.org/docs/app/guides/self-hosting, https://nextjs.org/docs/pages/api-reference/config/next-config-js/output

### Go latest backend
- Standard project layout (`cmd/`, `internal/`).
- Chi router for lightweight HTTP routing; pgx/v5 for PostgreSQL; sqlc for type-safe SQL-first queries; goose for plain-SQL migrations.
- Error wrapping with `%w`; structured JSON logging via `log/slog`.
- Sources: https://github.com/pressly/goose, https://docs.sqlc.dev, https://pkg.go.dev/github.com/go-chi/chi/v5, https://github.com/jackc/pgx

### Podman Quadlet
- Rootless user units live in `~/.config/containers/systemd/...`.
- `.container`, `.network`, `.volume` files generate `.service` units via `systemctl --user daemon-reload`.
- Containers can join multiple networks; no `--privileged`, `--net=host`, or published DB ports.
- Source: https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html

---

## 4. Container / network topology

### Local demo

```text
lemans-demo-net (bridge)
├── lemans-demo-db     postgres:alpine        (port 5432 internal only)
├── lemans-demo-go     lemans-bridge-dashboard-go:demo-go   (:8080 internal only)
└── lemans-demo-app    lemans-bridge-dashboard:demo-web     (127.0.0.1:3000 -> :3000)
```

### Remote demo / prod

- Web container joins `caddy.network` + internal app network.
- Go API container joins internal app network only.
- DB container joins internal app network only.
- No sleeping bridge containers.

---

## 5. Build & verification commands

```bash
export PATH="/opt/podman/bin:$PATH"
podman machine start

# Build demo images (web + go)
./scripts/build.sh demo

# Start full local stack
./scripts/run-local.sh

# Static analysis / checks
./scripts/verify-local.sh

# Full stack health checks
./scripts/verify-vertical-slice.sh

# Stop and reset
./scripts/stop-local.sh
./scripts/reset-local.sh
```

**Verified results** (last run 2026-08-10):
- `verify-local.sh`: format/lint/typecheck pass; `go vet`/`go test` pass.
- `verify-vertical-slice.sh`: all routes return 200; DB has no published host ports; Go API health returns 200.
- Routes checked: `/`, `/customers`, `/quotations`, `/job-orders`, `/job-orders/RA0003973`, `/job-costing/RA0003973`, `/purchasing`, `/expenses`, `/dcs`, `/invoices`.

---

## 6. Known issues / review checklist for next agent

- [ ] Add focused Go unit tests for `mathx`, `policy`, and at least one happy-path handler.
- [ ] Add containerized integration test for the seed workflow.
- [ ] Remote deployment not yet exercised after the refactor; needs authorized run of `./scripts/deploy-remote-demo.sh`.
- [ ] `verify-vertical-slice.sh` only checks public GET routes; POST workflows (create quote, approve, invoice, pay) are not exercised automatically.
- [ ] `.env.demo` contains placeholder B2 credentials; real values are injected at deploy time.
- [ ] `tsconfig.tsbuildinfo` is currently tracked and changes on every build; consider removing from git.
- [ ] The local web build can exhaust Podman machine memory if the VM is low; stop running containers before building.

---

## 7. Important implementation fixes made during this change

1. **goose migrations**: embedded only `*.up.sql` files and added `-- +goose Up` / `-- +goose Down` annotations to satisfy goose's parser and avoid duplicate-version panics.
2. **pgx driver for goose**: added `_ "github.com/jackc/pgx/v5/stdlib"` import so `goose.OpenDBWithDriver("pgx", ...)` works.
3. **Seed idempotency**: changed the seed handler to update quotation totals via `UpdateQuotationTotals` instead of creating a duplicate `sales_quotations` row.
4. **Seed `paid_at`**: set `PaidAt` explicitly when creating the demo payment because `payments.paid_at` is `NOT NULL`.
5. **Job-order route params**: added `resolveJobOrderID` helper that accepts either a UUID or the human-readable `jo_no` (e.g., `RA0003973`), so detail/costing/attachment endpoints work from the UI links.
6. **Podman name resolution**: health checks and seed calls inside helper scripts now run via a temporary `curlimages/curl` container on the internal Podman network because macOS host cannot resolve container names.

---

## 8. Documentation updated

- `AGENTS.md` — image tags, runtime versions, two-service local/remote topology.
- `docs/ARCHITECTURE.md` — Next.js 16 + Go API + PostgreSQL component diagram.
- `docs/ENVIRONMENTS-AND-PATHS.md` — environment matrix, secrets table, network topology.
- `docs/DEMO-IMPLEMENTATION-PLAYBOOK.md` — removed Prisma references, updated stack note.
- `docs/AGENT-EXECUTION-PROMPTS.md` — updated verification and deployment prompts.
- `docs/REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md` — web+Go+DB topology, migration/seed flow.
- `docs/REMOTE-OPERATIONS.md` — removed login credentials, updated role simulation and reset commands.
- `docs/REMOTE-DEMO-RESULTS.md` — updated container/image specs and manual commands.
- `docs/GO-BACKEND-ARCHITECTURE.md` — new backend overview.
- `docs/MIGRATION-NOTES.md` — new change log and TODOs.
- `.serena/memories/conventions.md` and `suggested_commands.md` — updated conventions and commands.

---

## 9. Git commands used

Local commits and history use the standard `git` CLI:

```bash
git add -A
git -c commit.gpgsign=false commit -m "..."
git log --oneline -3
```

Remote operations use the official GitHub CLI over HTTPS:

```bash
gh auth status
gh auth setup-git
git push https://github.com/ItsAdventureTime/bridge-lemans.git HEAD:main
```

The repository remote is `https://github.com/ItsAdventureTime/bridge-lemans.git`; SSH keys are not used.

---

## 10. Next recommended steps

1. Review this handoff and the docs above.
2. Run the verification commands locally to confirm behavior on a fresh checkout.
3. Address the review checklist items (tests, integration tests, remote deploy).
4. Before any remote deployment, get explicit user authorization and any required Caddy context.

---

*End of handoff document.*
