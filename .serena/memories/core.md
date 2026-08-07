Le Mans Operations & Job Cost Management System (`lemans-bridge-dashboard`)

Project invariants

- Single source repository; no separate demo/production source trees.
- 100% rootless Podman execution on macOS (`podman machine start`) and remote Linux (Quadlet).
- Next.js 14 App Router + Prisma + PostgreSQL 16 Alpine.
- One Job Order (`JO` / `RA`) is the single source of truth for quotes, procurement, expenses, billing, and profitability.
- Authentication: Better Auth with PostgreSQL database sessions (`mem:auth`).
- Attachments: Backblaze B2 via S3-compatible API (`mem:attachments`).
- UI design system: low token entropy, 4-state UI contract, LeMans Racing Red brand accent (#D32F2F).
- Container ports bind loopback only; DB ports are never published to host.
- No privileged containers, no host networking, no broad host mounts.

Key paths

- docs/PROJECT-SPEC.md — requirements and acceptance criteria.
- docs/ARCHITECTURE.md — containerized architecture.
- docs/PHASE-3-IMPLEMENTATION.md — current build plan.
- docs/adr/ — architecture decision records.
- docker-compose.yml — local demo stack (bind mount source).
- docker-compose.prodlike.yml — immutable prodlike stack.
- prisma/schema.prisma — domain model.
- src/**tests**/*.test.ts — unit/integration tests.

Git remote: https://github.com/ItsAdventureTime/bridge-lemans.git
