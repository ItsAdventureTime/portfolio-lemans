# Le Mans Operations & Job Cost Management System

[![Repository](https://img.shields.io/badge/GitHub-ItsAdventureTime%2Fbridge--lemans-blue)](https://github.com/ItsAdventureTime/bridge-lemans)
[![Podman](https://img.shields.io/badge/Podman-Rootless%20VM-purple)](https://podman.io)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.0%20App%20Router-black)](https://nextjs.org)
[![Go](https://img.shields.io/badge/Go-latest%20Alpine-00ADD8)](https://go.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Alpine-blue)](https://www.postgresql.org)

Operations and job-costing platform for **Le Mans Service Plus OPC** in Angeles
City, Pampanga.

---

## How the app is built

- **Repository**: [`ItsAdventureTime/bridge-lemans`](https://github.com/ItsAdventureTime/bridge-lemans)
  contains the demo and production source.
- **Release path**: Validate the demo source and image lineage before you
  promote it with production runtime settings.
- **Git and docs**: Keep work on `main`. Use `gh` over HTTPS for GitHub
  operations, and update the affected guides with each change. See
  [`docs/DOCUMENTATION-INDEX.md`](./docs/DOCUMENTATION-INDEX.md).
- **Business record**: A Job Order (`JO` / `RA`) connects estimates,
  procurement, OPEX, billing, and job profitability.
- **Runtime**: Use rootless Podman for every build, test, migration, and app
  process. The project does not use Compose.
- **Demo access**: The splash screen opens the demo as Admin and includes a
  visible role switcher. It does not authenticate users.
- **Deployment**: There is no persistent local deployment. When authorized,
  deploy the remote demo with `./scripts/deploy-remote-demo.sh` to
  `https://delegateops.business/lemans/demo`.
- **Attachments**: Backblaze B2 stores inspection photos, receipts, and other
  supporting files. See ADR-0004.
- **Backend**: The Go API owns persistence, Goose migrations, business rules,
  and presigned B2 URLs. The Next.js frontend reaches it over the internal
  Podman network.
- **Workflow safety**: Quote creation and quote-to-job-order conversion run in
  database transactions, so a failed write does not leave partial records.
- **Accounting exports**: Admins can download deterministic, formula-safe CSV
  or JSON interchange files. They are not direct QuickBooks import files.

---

## Run a local validation

```bash
# Use the local Podman VM only for validation. Remote deployment builds on the VPS.
export PATH="/opt/podman/bin:$PATH"
podman machine start

# Build images and start the local demo
./scripts/build.sh demo
./scripts/run-local.sh

# Verify the stack
./scripts/verify-local.sh
./scripts/verify-vertical-slice.sh
./scripts/verify-e2e.sh

# Stop the local demo
./scripts/stop-local.sh

# Deploy only when you have explicit authorization
REMOTE_HOST=<server-host> ./scripts/deploy-remote-demo.sh

# Open the remote demo
open https://delegateops.business/lemans/demo
```

Stop / reset:

```bash
./scripts/stop-local.sh     # stop local DB + Go API + web
./scripts/reset-local.sh  # remove local DB volume; run before re-seeding
```

---

## Build and verify

```bash
# Local images support validation. Remote deployment builds on the VPS.
./scripts/build.sh demo   # demo-web + demo-go
./scripts/build.sh prod   # prod-web + prod-go

# Run static analysis and tests inside disposable containers
./scripts/verify-local.sh

# Check the running demo over HTTP
./scripts/verify-vertical-slice.sh

# Browser verification in a disposable Playwright container
./scripts/verify-e2e.sh
```

---

## Deploy remotely

```bash
# Remote demo (automatic 30-minute reset; manual reset also available)
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

## Read the docs

- [`docs/CURRENT-STATE.md`](./docs/CURRENT-STATE.md): Implementation-backed current runtime, workflow, and documentation authority
- [`docs/DOCUMENTATION-INDEX.md`](./docs/DOCUMENTATION-INDEX.md): Documentation status map, authority order, synchronization, and verification contract
- [`docs/WRITING-STYLE.md`](./docs/WRITING-STYLE.md): US-English writing, tone, and proofreading standard
- [`AGENTS.md`](./AGENTS.md): Agent Operating Guidelines & Sandbox Policy
- [`docs/DEMO-IMPLEMENTATION-PLAYBOOK.md`](./docs/DEMO-IMPLEMENTATION-PLAYBOOK.md): Authoritative Demo Specification, Workflow, UI/UX, and Verification Contract
- [`docs/AGENT-EXECUTION-PROMPTS.md`](./docs/AGENT-EXECUTION-PROMPTS.md): Copy-Paste Prompts and Commands for Coding, Review, and Handoff Agents
- [`docs/REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md`](./docs/REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md): Remote-Only Rootless Quadlet Deployment Contract
- [`docs/PROJECT-SPEC.md`](./docs/PROJECT-SPEC.md): Product Requirements Specification
- [`docs/DESIGN-SYSTEM.md`](./docs/DESIGN-SYSTEM.md): Enterprise UI/UX Specification & Token System
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md): Containerized Architecture & Web Grounding
- [`docs/GO-BACKEND-ARCHITECTURE.md`](./docs/GO-BACKEND-ARCHITECTURE.md): Go API Backend Architecture
- [`docs/ENVIRONMENTS-AND-PATHS.md`](./docs/ENVIRONMENTS-AND-PATHS.md): Environment Matrix & Remote Quadlet Paths
- [`docs/REMOTE-OPERATIONS.md`](./docs/REMOTE-OPERATIONS.md): Remote Deploy, Backup, Restore, Rollback
- [`docs/DELIVERY-PLAN.md`](./docs/DELIVERY-PLAN.md): Project Roadmap & Phase Specifications
- [`docs/adr/0003-authentication-and-session-strategy.md`](./docs/adr/0003-authentication-and-session-strategy.md): Auth Architecture Decision
- [`docs/adr/0004-attachment-storage-strategy.md`](./docs/adr/0004-attachment-storage-strategy.md): Backblaze B2 Attachment Decision
- [`to-review-and-delete/README.md`](./to-review-and-delete/README.md): Archived documentation candidates; not implementation authority
