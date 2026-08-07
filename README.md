# Le Mans Operations & Job Cost Management System

[![Repository](https://img.shields.io/badge/GitHub-ItsAdventureTime%2Fbridge--lemans-blue)](https://github.com/ItsAdventureTime/bridge-lemans)
[![Podman](https://img.shields.io/badge/Podman-Rootless%20VM-purple)](https://podman.io)
[![Next.js](https://img.shields.io/badge/Next.js-14%20App%20Router-black)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20Alpine-blue)](https://www.postgresql.org)

Enterprise operational and job costing platform built for **Le Mans Service Plus OPC** (Angeles City, Pampanga).

---

## 1. Core Architecture

- **Single Source Repository**: [`ItsAdventureTime/bridge-lemans`](https://github.com/ItsAdventureTime/bridge-lemans)
- **Single Source of Truth**: One Job Order (`JO` / `RA`) governs estimations, procurement allocations, OPEX requests, customer billing, and net job profitability.
- **Containerized Execution**: 100% rootless Podman execution (`podman machine start` on macOS Apple Silicon; Linux rootless for VPS).
- **No Compose**: `podman compose` / `docker compose` are not used. Local execution uses `podman run --rm` via helper scripts.
- **Authentication**: Better Auth with PostgreSQL database sessions and role-based access control (see ADR-0003).
- **Attachments**: Backblaze B2 S3-compatible object storage for inspection photos, receipts, and supporting documents (see ADR-0004).

---

## 2. Quick Start (Local Demo)

```bash
# 1. Start local Podman machine
podman machine start

# 2. Run the local demo stack (DB + app as named, removable containers)
./scripts/run-local.sh

# 3. The script automatically applies migrations and seeds RA0003973.

# 4. Open in browser
open http://127.0.0.1:3000
```

Stop / reset:

```bash
./scripts/stop-local.sh    # stop containers
./scripts/reset-local.sh   # remove DB volume + reset to seeded state
```

---

## 3. Build & Verify

```bash
# Build local image
./scripts/build.sh demo   # latest-alpine
./scripts/build.sh prod   # lts-alpine

# Run static analysis and tests inside disposable containers
./scripts/verify-local.sh

# Full verification incl. HTTP health checks on running local demo
./scripts/verify-vertical-slice.sh
```

---

## 4. Remote Deployment

```bash
# Remote demo (auto-resets every 30 minutes)
export REMOTE_HOST=vps.example.com
export REMOTE_USER=jk
export B2_ACCESS_KEY_ID=...
export B2_SECRET_ACCESS_KEY=...
./scripts/deploy-remote-demo.sh

# Remote production (persistent + daily B2 backups)
./scripts/deploy-remote-prod.sh
```

See [`docs/REMOTE-OPERATIONS.md`](./docs/REMOTE-OPERATIONS.md) for full details.

---

## 5. Primary Documentation Index

- [`AGENTS.md`](./AGENTS.md): Agent Operating Guidelines & Sandbox Policy
- [`docs/PROJECT-SPEC.md`](./docs/PROJECT-SPEC.md): Product Requirements Specification
- [`docs/DESIGN-SYSTEM.md`](./docs/DESIGN-SYSTEM.md): Enterprise UI/UX Specification & Token System
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md): Containerized Architecture & Web Grounding
- [`docs/ENVIRONMENTS-AND-PATHS.md`](./docs/ENVIRONMENTS-AND-PATHS.md): Environment Matrix & Remote Quadlet Paths
- [`docs/REMOTE-OPERATIONS.md`](./docs/REMOTE-OPERATIONS.md): Remote Deploy, Backup, Restore, Rollback
- [`docs/DELIVERY-PLAN.md`](./docs/DELIVERY-PLAN.md): Project Roadmap & Phase Specifications
- [`docs/PHASE-2-RESULTS.md`](./docs/PHASE-2-RESULTS.md): Empirical Phase 2 Validation Log
- [`docs/PHASE-3-HANDOFF.md`](./docs/PHASE-3-HANDOFF.md): Architecture Readiness & Phase 3 Scope
- [`docs/PHASE-3-IMPLEMENTATION.md`](./docs/PHASE-3-IMPLEMENTATION.md): Phase 3 Build Plan & Verification Strategy
- [`docs/PHASE-4-HANDOFF.md`](./docs/PHASE-4-HANDOFF.md): Phase 4 Completion & Next Steps
- [`docs/UI-UX-OVERHAUL-SPECIFICATION.md`](./docs/UI-UX-OVERHAUL-SPECIFICATION.md): UI/UX Overhaul & Readability Blueprint
- [`docs/UX-AND-DEMO-DATA-OVERHAUL-SPEC.md`](./docs/UX-AND-DEMO-DATA-OVERHAUL-SPEC.md): UX Workflow & Realistic Demo Seeding Specification
- [`docs/adr/0003-authentication-and-session-strategy.md`](./docs/adr/0003-authentication-and-session-strategy.md): Auth Architecture Decision
- [`docs/adr/0004-attachment-storage-strategy.md`](./docs/adr/0004-attachment-storage-strategy.md): Backblaze B2 Attachment Decision
