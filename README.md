# Le Mans Operations & Job Cost Management System

[![Repository](https://img.shields.io/badge/GitHub-ItsAdventureTime%2Fbridge--lemans-blue)](https://github.com/ItsAdventureTime/bridge-lemans)
[![Podman](https://img.shields.io/badge/Podman-Rootless%20VM-purple)](https://podman.io)
[![Next.js](https://img.shields.io/badge/Next.js-14%20App%20Router-black)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20Alpine-blue)](https://www.postgresql.org)

Enterprise operational and job costing platform built for **Le Mans Service Plus OPC** (Angeles City, Pampanga).

---

## 1. Core Architecture

- **Single Source Repository**: [`ItsAdventureTime/bridge-lemans`](https://github.com/ItsAdventureTime/bridge-lemans)
- **Release model**: The demo is the canonical actively developed build. Production is promoted from the validated demo source/image lineage with production runtime configuration enabled.
- **Documentation and Git synchronization**: Every change updates affected guides and verification evidence; local Git uses `git`, and GitHub operations use the official `gh` CLI over HTTPS.
- **Single Source of Truth**: One Job Order (`JO` / `RA`) governs estimations, procurement allocations, OPEX requests, customer billing, and net job profitability.
- **Containerized Execution**: 100% rootless Podman execution (`podman machine start` on macOS Apple Silicon; Linux rootless for VPS).
- **No Compose**: `podman compose` / `docker compose` are not used. Local execution uses `podman run --rm` via helper scripts.
- **Demo authentication**: None. The demo opens as Admin and provides visible role simulation. Production authentication remains a future deployment profile (see ADR-0003).
- **Deployment**: No persistent local deployment. The remote demo is deployed by `./scripts/deploy-remote-demo.sh` as rootless Quadlets at `https://delegateops.business/lemans/demo`.
- **Attachments**: Backblaze B2 S3-compatible object storage for inspection photos, receipts, and supporting documents (see ADR-0004).

---

## 2. Local Validation and Remote Demo Deployment

```bash
# 1. Start local Podman machine
podman machine start

# 2. Run disposable local validation/build checks only
./scripts/verify-local.sh

# 3. Deploy the remote demo with one command when remote access is authorized
REMOTE_HOST=<server-host> ./scripts/deploy-remote-demo.sh

# 4. Open the remote demo
open https://delegateops.business/lemans/demo
```

Stop / reset:

```bash
./scripts/stop-local.sh    # remove any temporary local runtime
./scripts/reset-local.sh   # legacy local reset; not a deployment target
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
- [`docs/DEMO-IMPLEMENTATION-PLAYBOOK.md`](./docs/DEMO-IMPLEMENTATION-PLAYBOOK.md): Authoritative Demo Specification, Workflow, UI/UX, and Verification Contract
- [`docs/AGENT-EXECUTION-PROMPTS.md`](./docs/AGENT-EXECUTION-PROMPTS.md): Copy-Paste Prompts and Commands for Coding, Review, and Handoff Agents
- [`docs/REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md`](./docs/REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md): Remote-Only Rootless Quadlet Deployment Contract
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
