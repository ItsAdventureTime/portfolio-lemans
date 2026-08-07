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
- **Containerized Execution**: 100% rootless Podman execution (`podman machine start` on macOS Apple Silicon).
- **Authentication**: Better Auth with PostgreSQL database sessions and role-based access control (see ADR-0003).
- **Attachments**: Backblaze B2 S3-compatible object storage for inspection photos, receipts, and supporting documents (see ADR-0004).

---

## 2. Quick Start (Local Demo Container Stack)

```bash
# 1. Start local Podman machine
podman machine start

# 2. Build and start local-demo container stack
podman compose up -d

# 3. Apply database migration & seed reference data (RA0003973)
podman exec -i lemans-demo-app sh -c "npx prisma db push && npx ts-node --compiler-options '{\"module\":\"commonjs\"}' prisma/seed.ts"

# 4. Open in browser
open http://127.0.0.1:3000
```

---

## 3. Local Production-Like Execution

```bash
# Build standalone production image & run container
podman compose -f docker-compose.prodlike.yml up -d --build

# Open local production-like instance
open http://127.0.0.1:3001
```

---

## 4. Primary Documentation Index

- [`AGENTS.md`](./AGENTS.md): Agent Operating Guidelines & Sandbox Policy
- [`docs/PROJECT-SPEC.md`](./docs/PROJECT-SPEC.md): Product Requirements Specification
- [`docs/DESIGN-SYSTEM.md`](./docs/DESIGN-SYSTEM.md): Enterprise UI/UX Specification & Token System
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md): Containerized Architecture & Web Grounding
- [`docs/ENVIRONMENTS-AND-PATHS.md`](./docs/ENVIRONMENTS-AND-PATHS.md): Environment Matrix & Remote Quadlet Paths
- [`docs/DELIVERY-PLAN.md`](./docs/DELIVERY-PLAN.md): Project Roadmap & Phase Specifications
- [`docs/PHASE-2-RESULTS.md`](./docs/PHASE-2-RESULTS.md): Empirical Phase 2 Validation Log
- [`docs/PHASE-3-HANDOFF.md`](./docs/PHASE-3-HANDOFF.md): Architecture Readiness & Phase 3 Scope
- [`docs/PHASE-3-IMPLEMENTATION.md`](./docs/PHASE-3-IMPLEMENTATION.md): Phase 3 Build Plan & Verification Strategy
- [`docs/adr/0003-authentication-and-session-strategy.md`](./docs/adr/0003-authentication-and-session-strategy.md): Auth Architecture Decision
- [`docs/adr/0004-attachment-storage-strategy.md`](./docs/adr/0004-attachment-storage-strategy.md): Backblaze B2 Attachment Decision
