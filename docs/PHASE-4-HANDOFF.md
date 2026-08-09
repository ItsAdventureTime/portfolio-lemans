# Phase 4 Handoff — Le Mans Operations & Job Cost Management System

> **Historical handoff notice (2026-08-09):** This document records a prior
> implementation state and is not the current demo authority. For current demo
> work, follow [`DEMO-IMPLEMENTATION-PLAYBOOK.md`](./DEMO-IMPLEMENTATION-PLAYBOOK.md)
> and [`AGENT-EXECUTION-PROMPTS.md`](./AGENT-EXECUTION-PROMPTS.md). In particular,
> the demo is now intentionally authentication-free, opens as Admin, and uses
> visible role simulation. The completion claims and seeded login credentials
> below must not be treated as current acceptance evidence.

- **Date**: 2026-08-07
- **From**: Lead Software Architect / AI Engineering Agent
- **To**: Phase 4 Delivery Agent / Deployment Operator

## 1. Phase 3 Completion Summary

Phase 3 has been executed in Build mode according to `docs/PHASE-3-IMPLEMENTATION.md`.

- ✅ All approved Phase 3 requirements implemented.
- ✅ Critical workflows covered by unit/integration tests.
- ✅ Format, lint, type-check pass.
- ✅ Production build succeeds and produces `lemans-bridge-dashboard:lts-alpine`.
- ✅ Local demo (`lemans-demo-app`) works on `127.0.0.1:3000`.
- ✅ Local production-like (`lemans-prodlike-app`) works on `127.0.0.1:3001`.
- ✅ Health checks pass on both environments.
- ✅ Migrations are reproducible via `npx prisma db push` + `npx prisma db seed`.
- ✅ Known limitations documented.
- ✅ Remote deployment assets prepared but **not installed**.

## 2. Repository State

| Area            | Key Files                                                                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source          | `src/app/**/*`, `src/components/**/*`, `src/lib/**/*`                                                                                                                         |
| Auth            | `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/middleware.ts`, `src/app/api/auth/[...all]/route.ts`, `src/app/login/**/*`                                                  |
| Domain actions  | `src/lib/actions/{job-orders,purchasing,expenses,dcs,billing}.ts`                                                                                                             |
| Schema          | `prisma/schema.prisma`, `prisma/seed.ts`                                                                                                                                      |
| Tests           | `src/__tests__/*.test.ts`, `src/__tests__/index.ts`                                                                                                                           |
| UI components   | `src/components/Navbar.tsx`, `src/components/AccessDenied.tsx`, `src/components/Header.tsx`, `src/components/ui/**/*`                                                         |
| Containers      | `Dockerfile.dev`, `Dockerfile.prod` (Alpine-based, no `docker-compose.yml`)                                                                                                   |
| Local env files | `.env.demo`, `.env.prodlike` (git-ignored)                                                                                                                                    |
| Local scripts   | `scripts/run-local.sh`, `scripts/stop-local.sh`, `scripts/reset-local.sh`, `scripts/build.sh`, `scripts/verify-local.sh`, `scripts/verify-vertical-slice.sh`                  |
| Remote assets   | `quadlet/remote-demo/*`, `quadlet/remote-prod/*`, `scripts/build-multiarch.sh`, `scripts/deploy-remote-demo.sh`, `scripts/deploy-remote-prod.sh`, `docs/REMOTE-OPERATIONS.md` |
| Docs            | `docs/PHASE-3-IMPLEMENTATION.md`, `docs/PHASE-3-RESULTS.md`, `docs/ENVIRONMENTS-AND-PATHS.md`, `docs/REMOTE-OPERATIONS.md`, `docs/DESIGN-SYSTEM.md`, `AGENTS.md`              |

## 3. Local Environment Quick Reference

| Environment    | Container             | URL                     | Command                                                |
| -------------- | --------------------- | ----------------------- | ------------------------------------------------------ |
| Local demo     | `lemans-demo-app`     | `http://127.0.0.1:3000` | `./scripts/run-local.sh`                               |
| Local prodlike | `lemans-prodlike-app` | `http://127.0.0.1:3001` | `./scripts/build.sh prod` then run the resulting image |

Use `./scripts/reset-local.sh` to reset the demo database/attachments to the seeded state.

Demo credentials (seeded):

- `admin@lemans.ph` / `demo12345`
- `gm@lemans.ph` / `demo12345`
- `sales@lemans.ph` / `demo12345`
- `svc@lemans.ph` / `demo12345`
- `purch@lemans.ph` / `demo12345`
- `dcs@lemans.ph` / `demo12345`

## 4. Verification Command

Run from the project root:

```bash
export PATH="/opt/podman/bin:$PATH"
./scripts/verify-vertical-slice.sh
```

## 5. UI/UX Overhaul Completed

The following interface standardization work has been completed and is now part of the Phase 4 handoff baseline:

1. **Role-Aware Navigation** — `src/components/Navbar.tsx` filters navigation tabs by the active user's permissions using `hasPermission(role, permission)`. The active tab renders in LeMans Red (`#d32f2f`).
2. **Explicit 403 Access Restricted View** — `src/components/AccessDenied.tsx` renders a dedicated, on-brand error card with the current role and a **Return to Overview** button. Restricted routes (e.g. `/accounting`) use this component instead of silently redirecting.
3. **Full-Bleed Layout & Spacing Grid** — every page wrapper uses `w-full max-w-[1920px] mx-auto px-6 lg:px-8 xl:px-10` and 4 px-multiple spacing. Applied across Overview, Customers, Quotations, Job Orders, Job Costing, Purchasing, Expenses, DCS, Invoices, and Login flows.
4. **Typography Scale** — KPI numbers use `text-3xl`/`text-4xl`, headers `text-2xl`, card titles `text-xl`, body/form text `text-base`, labels/headers `text-sm`, and status pills `text-xs`.
5. **Color Palette Standardization** — LeMans Red is reserved for primary actions, active tabs, logo badge, and key metric accents; slate/off-white surfaces and WCAG AAA text contrast are applied consistently.
6. **Table Action Buttons** — `whitespace-nowrap inline-flex items-center justify-center h-9 px-4` enforced to prevent awkward line breaks (e.g. `View RA`).

## 6. Remaining Phase 4 Suggested Work

1. **CI/CD pipeline**: wire `scripts/build-multiarch.sh` into a GitHub Actions / GitLab CI runner.
2. **Secret management**: replace `.env` files and Quadlet `{{ ... }}` placeholders with a production secrets manager.
3. **Remote deployment**: use `scripts/deploy-remote-demo.sh` / `scripts/deploy-remote-prod.sh` to install Quadlets on the VPS.
4. **Backup automation**: the production daily backup timer is installed by `deploy-remote-prod.sh`; verify it in `docs/REMOTE-OPERATIONS.md`.
5. **QBO/CSV export**: implement export in `/accounting`.
6. **Full OPEX/PR form creation**: wire create forms to the existing Server Actions.
7. **End-to-end tests**: add Playwright tests for GM → approve → DCS pay flow.

## 7. Constraints to Preserve

- Run all project tooling inside rootless Podman.
- Do not initialize/reset/remove/resize `podman-machine-default`.
- Do not use `--privileged`, `--net=host`, or broad host bind mounts.
- Expose app ports only on `127.0.0.1`.
- Do not publish PostgreSQL ports.
- Do not use `podman compose` or `docker compose`.
- Do not push/deploy to remote without explicit approval.
- Do not modify DNS or reverse-proxy configuration.

## 8. Contact / Notes

If the next agent needs to resume, start with:

```bash
export PATH="/opt/podman/bin:$PATH"
podman machine start
podman ps -a | grep lemans
./scripts/verify-vertical-slice.sh
```

Phase 3 and the UI/UX overhaul are complete. Proceed to Phase 4 only after reviewing this handoff and the linked remote operations guide.

Updated handoff sections: repository state, UI/UX overhaul completion, remaining Phase 4 suggested work, constraints, and notes.
