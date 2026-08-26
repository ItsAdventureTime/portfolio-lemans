# Le Mans Operations & Job Cost Management System

[![Repository](https://img.shields.io/badge/GitHub-ItsAdventureTime%2Fbridge--lemans-blue)](https://github.com/ItsAdventureTime/bridge-lemans)
[![Podman](https://img.shields.io/badge/Podman-Rootless%20VM-purple)](https://podman.io)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.0%20App%20Router-black)](https://nextjs.org)
[![Go](https://img.shields.io/badge/Go-latest%20Alpine-00ADD8)](https://go.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Alpine-blue)](https://www.postgresql.org)

Operations and job-costing platform for **Le Mans Service Plus OPC** in Angeles
City, Pampanga.

---

## Quick reference

- **Repository**: [`ItsAdventureTime/bridge-lemans`](https://github.com/ItsAdventureTime/bridge-lemans)
  contains the demo and production source.
- **Release path**: Validate the demo source and image lineage before you
  promote it with production runtime settings.
- **Git and docs**: Keep work on `main`. Commit locally, synchronize remote
  `main` after validation, and confirm both refs share one SHA. Use `gh` as the
  only GitHub-facing CLI over HTTPS; `git commit` is the necessary local
  commit primitive because `gh` has no local commit command. GitHub operations
  use HTTPS through `gh`; the remote VPS transfer is the separate rsync-over-SSH
  transport described in the deployment guide. Do not store SSH credentials in
  scripts or documentation. Delete non-`main` branches after inspecting their
  protection and unique commits, and update affected guides with each change.
  See
  [`docs/DOCUMENTATION-INDEX.md`](./docs/DOCUMENTATION-INDEX.md).
  The required after-change sequence is documented in
  [`docs/POST-CHANGE-COMPLETION-GUIDE.md`](./docs/POST-CHANGE-COMPLETION-GUIDE.md).
- **Business record**: A Job Order (`JO` / `RA`) connects estimates,
  procurement, OPEX, billing, and job profitability.
- **Runtime**: Use the initialized Docker Sandbox for local builds, tests,
  migrations, image packaging, and app processes. The VPS uses rootless Podman
  Quadlets for runtime activation only. The project does not use Compose.
- **Demo access**: The splash screen opens the demo as Admin and includes a
  visible role switcher. It does not authenticate users.
- **Deployment**: There is no persistent local deployment. When authorized,
  deploy the remote demo with `./scripts/deploy-remote-demo.sh` to
  `https://delegateops.business/demo/lemans`.
- **Attachments**: Backblaze B2 stores inspection photos, receipts, and other
  supporting files. See ADR-0004.
  - **Backend**: The Go API owns persistence, Goose migrations, business rules,
    and presigned B2 URLs. The Next.js frontend reaches it over the internal
    Docker network locally and the internal Podman network remotely.
- **Workflow safety**: Quote creation and quote-to-job-order conversion run in
  database transactions, so a failed write does not leave partial records.
- **Job costing workflow**: The demo includes searchable, status-filtered job
  costing records with estimate/actual summary metrics and detail variance
  views linked to each job order.
- **Accounting exports**: Admins can download deterministic, formula-safe CSV
  or JSON interchange files. They are not direct QuickBooks import files.

---

## Tutorial: validate the local demo

Run this tutorial from the repository root on macOS. The project Docker Sandbox
provides the local Docker engine and toolchain boundary; you do not need a
local Podman machine.

```bash
# Prepare the deterministic project Docker Sandbox.
jk-sbx-project ensure

# Build the demo images inside the Sandbox and start a freshly seeded local demo.
jk-sbx-project exec -- ./scripts/build.sh demo
jk-sbx-project publish 3000
jk-sbx-project exec -- ./scripts/run-local.sh

# Verify static checks, HTTP routes, and browser workflows
jk-sbx-project exec -- ./scripts/verify-local.sh
jk-sbx-project exec -- ./scripts/verify-vertical-slice.sh
jk-sbx-project exec -- ./scripts/verify-e2e.sh

# Stop the local demo
jk-sbx-project exec -- ./scripts/stop-local.sh
```

`run-local.sh` starts the local PostgreSQL, Go API, and Next.js containers and
seeds the demo. `reset-local.sh` removes the project-specific database volume;
run `run-local.sh` again to recreate and seed it.

## How-to: stop or reset the local demo

```bash
jk-sbx-project exec -- ./scripts/stop-local.sh   # stop the local DB, Go API, and web containers
jk-sbx-project exec -- ./scripts/reset-local.sh  # remove the local DB volume before re-seeding
```

---

## Reference: build profiles

Use these commands when you need to build both image profiles for local
validation. Remote deployment transfers the locally built profile image bundle.

```bash
jk-sbx-project exec -- ./scripts/build.sh demo   # demo-web + demo-go
jk-sbx-project exec -- ./scripts/build.sh prod   # prod-web + prod-go

# Package the demo images for the remote VPS (target defaults to linux/amd64).
jk-sbx-project exec -- ./scripts/build-local-artifacts.sh demo
```

---

## How-to: deploy the remote demo

Remote operations require explicit user authorization and the Caddy/network
context described in [`docs/REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md`](./docs/REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md).
The workstation Docker Sandbox builds and packages the committed source; the
VPS imports the images and runs the existing Quadlet runtime. Do not run these
commands as part of local validation.

On macOS, use the concise operator quickstart. The first deploy automatically
opens Keychain setup when settings are missing:

```bash
./scripts/deploy-remote-demo.sh
```

See [`docs/REMOTE-DEPLOYMENT-QUICKSTART.md`](./docs/REMOTE-DEPLOYMENT-QUICKSTART.md)
for the normal update flow and
[`docs/REMOTE-OPERATIONS.md`](./docs/REMOTE-OPERATIONS.md) for full details.
For automated or non-macOS operation, follow that guide's environment-variable
workflow and never place credentials in documentation or shell history.

---

## Read the docs

- [`docs/CURRENT-STATE.md`](./docs/CURRENT-STATE.md): Implementation-backed current runtime, workflow, and documentation authority
- [`docs/DOCUMENTATION-INDEX.md`](./docs/DOCUMENTATION-INDEX.md): Documentation status map, authority order, synchronization, and verification contract
- [`docs/WRITING-STYLE.md`](./docs/WRITING-STYLE.md): US-English writing, tone, and proofreading standard
- [`AGENTS.md`](./AGENTS.md): Agent Operating Guidelines & Sandbox Policy
- [`docs/DEMO-IMPLEMENTATION-PLAYBOOK.md`](./docs/DEMO-IMPLEMENTATION-PLAYBOOK.md): Authoritative Demo Specification, Workflow, UI/UX, and Verification Contract
- [`docs/AGENT-EXECUTION-PROMPTS.md`](./docs/AGENT-EXECUTION-PROMPTS.md): Copy-Paste Prompts and Commands for Coding, Review, and Handoff Agents

## GitHub synchronization

Use GitHub CLI authenticated over HTTPS for repository synchronization:

```bash
gh auth setup-git --hostname github.com
git push origin main
```

GitHub CLI provides the Git credential helper; Git performs the local commit.
Do not use SSH remotes, SSH keys, or passkeys for this repository.
- [`docs/REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md`](./docs/REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md): Remote-Only Rootless Quadlet Deployment Contract
- [`docs/adr/0005-docker-sandbox-local-build-and-vps-import.md`](./docs/adr/0005-docker-sandbox-local-build-and-vps-import.md): Local Docker Sandbox and remote image-import decision
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
