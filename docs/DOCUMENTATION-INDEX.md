# Documentation Index & Maintenance Contract

- **Updated**: 2026-08-12
- **Repository branch policy**: `main` only; no feature or review branches
- **Repository**: [`ItsAdventureTime/bridge-lemans`](https://github.com/ItsAdventureTime/bridge-lemans)

This index prevents historical implementation records from being mistaken for
current runtime instructions. When documents disagree, use the authority order
below.

## Current authority

1. [`AGENTS.md`](../AGENTS.md) — repository safety, container, deployment, and
   sandbox rules.
2. [`CURRENT-STATE.md`](./CURRENT-STATE.md) — implementation-backed runtime,
   workflow, and verification facts.
3. [`DEMO-IMPLEMENTATION-PLAYBOOK.md`](./DEMO-IMPLEMENTATION-PLAYBOOK.md) —
   demo product, UX, role-simulation, and acceptance contract.
4. [`REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md`](./REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md) —
   remote-only deployment contract; remote operations require explicit user
   authorization.
5. [`ARCHITECTURE.md`](./ARCHITECTURE.md),
   [`GO-BACKEND-ARCHITECTURE.md`](./GO-BACKEND-ARCHITECTURE.md),
   [`ENVIRONMENTS-AND-PATHS.md`](./ENVIRONMENTS-AND-PATHS.md), and the ADRs —
   architecture and future-profile decisions.
6. [`README.md`](../README.md) — quickstart and navigation index.

## Document status map

| Document group                                                                                                                                                                              | Status                               | How to use it                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `CURRENT-STATE.md`, `DEMO-IMPLEMENTATION-PLAYBOOK.md`, `README.md`                                                                                                                          | Current                              | Use for implementation and verification decisions.                                                         |
| `ARCHITECTURE.md`, `GO-BACKEND-ARCHITECTURE.md`, `ENVIRONMENTS-AND-PATHS.md`, `DESIGN-SYSTEM.md`, `PROJECT-SPEC.md`, `UX-AND-DEMO-DATA-OVERHAUL-SPEC.md`, `UI-UX-OVERHAUL-SPECIFICATION.md` | Current contract/specification       | Use for design, domain, and architecture constraints; confirm runtime facts against `CURRENT-STATE.md`.    |
| `REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md`, `REMOTE-OPERATIONS.md`                                                                                                                                | Current but remote-only              | Do not execute without explicit authorization and required host/Caddy context.                             |
| `AGENT-EXECUTION-PROMPTS.md`                                                                                                                                                                | Current operational prompts          | Keep commands synchronized with scripts and the current demo boundary.                                     |
| `DELIVERY-PLAN.md`, `MIGRATION-NOTES.md`, `MIGRATION-HANDOFF.md`                                                                                                                            | Current record / historical sections | Use for roadmap and migration context; current claims must link back to `CURRENT-STATE.md`.                |
| `PHASE-2-*`, `PHASE-3-*`, `PHASE-4-*`, `REMOTE-DEMO-RESULTS.md`                                                                                                                             | Historical evidence                  | Preserve as dated records; do not use old commands, credentials, routes, or auth results as current proof. |
| `adr/0001*`, `adr/0002*`, `adr/0004*`                                                                                                                                                       | Current architecture decisions       | Apply to the current source unless superseded in the document.                                             |
| `adr/0003*`                                                                                                                                                                                 | Future production design             | Do not add its authentication/session requirements to the demo profile.                                    |

## Synchronization contract

Every source, schema, seed, container, script, UX, deployment, or workflow
change must update the affected current guides and verification evidence in the
same change set. Historical reports should receive a dated notice when their
commands or results no longer describe the repository.

The repository remains on `main`. Use the official GitHub CLI for remote
repository inspection, synchronization, and branch administration over HTTPS.
Do not create new branches. Never delete `main`; review branch protection before
deleting any other remote branch.

## Verification contract

Run project execution inside rootless Podman:

```bash
export PATH="/opt/podman/bin:$PATH"
./scripts/build.sh demo
./scripts/verify-local.sh
./scripts/run-local.sh
./scripts/verify-vertical-slice.sh
./scripts/stop-local.sh
```

For browser validation, run the Playwright suite in the repository's disposable
Playwright container attached to `lemans-demo-net`. Record exact pass/fail
counts and leave no project runtime containers running.

## Official guidance checked 2026-08-12

- [Next.js 16 upgrade guidance](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Go release history](https://go.dev/doc/devel/release)
- [Podman documentation](https://docs.podman.io/_/downloads/en/v5.8.1/pdf/)
- [GitHub CLI `gh repo sync`](https://cli.github.com/manual/gh_repo_sync)
- [GitHub CLI `gh api`](https://cli.github.com/manual/gh_api)
- [GitHub branch management](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-branches-in-your-repository)
