# Documentation index

- **Updated**: 2026-08-12 (active-doc and archive audit)
- **Repository branch policy**: `main` only; no feature or review branches
- **Repository**: [`ItsAdventureTime/bridge-lemans`](https://github.com/ItsAdventureTime/bridge-lemans)

Use this index to find the current guidance. If two documents disagree, follow
the authority order below.

## Current sources of truth

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
7. [`WRITING-STYLE.md`](./WRITING-STYLE.md) — US-English voice, tone, and
   proofreading standard for active content.

## Document status

| Document group                                                                                                                    | Status                                  | How to use it                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `CURRENT-STATE.md`, `DEMO-IMPLEMENTATION-PLAYBOOK.md`, `README.md`                                                                | Current                                 | Use for implementation and verification decisions.                                                                 |
| `ARCHITECTURE.md`, `GO-BACKEND-ARCHITECTURE.md`, `ENVIRONMENTS-AND-PATHS.md`, `DESIGN-SYSTEM.md`, `PROJECT-SPEC.md`, and the ADRs | Current contract/specification          | Use for design, domain, and architecture constraints; confirm runtime facts against `CURRENT-STATE.md`.            |
| `REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md`, `REMOTE-OPERATIONS.md`                                                                      | Current but remote-only                 | Do not execute without explicit authorization and required host/Caddy context.                                     |
| `AGENT-EXECUTION-PROMPTS.md`                                                                                                      | Current operational prompts             | Keep commands synchronized with scripts and the current demo boundary.                                             |
| `WRITING-STYLE.md`                                                                                                                | Current editorial standard              | Apply to active app copy, documentation, guides, and commit messages.                                              |
| `DELIVERY-PLAN.md`                                                                                                                | Current roadmap                         | Use for roadmap boundaries only; implementation and verification claims come from `CURRENT-STATE.md`.              |
| `to-review-and-delete/historical-docs/`, `to-review-and-delete/historical-reviews/`                                               | Review candidates / historical evidence | Preserve only for user review; never use as current proof, operating instructions, or implementation authority.    |
| `adr/0001*`, `adr/0002*`, `adr/0004*`                                                                                             | Current architecture decisions          | Apply to the current source unless superseded in the document.                                                     |
| `adr/0003*`                                                                                                                       | Future production design                | Do not add its authentication/session requirements to the demo profile.                                            |
| `references/` and `_intake/originals/`                                                                                            | Source reference / archival material    | Preserve provenance; use only to interpret original business intent, never as current implementation instructions. |

## Keep documentation in sync

Every source, schema, seed, container, script, UX, deployment, or workflow
change must update the affected current guides and verification evidence in the
same change set. Move conflicting historical material to
`to-review-and-delete/` rather than leaving it beside active guidance.

The 2026-08-12 audit found no additional active document that was obsolete
enough to move. Existing phase reports, review handoffs, duplicate source files,
and superseded specifications remain under `to-review-and-delete/` and are
listed in its README.

Before closing a change, confirm that the active documentation matches the
implementation and that local `main` and GitHub `main` point to the same commit.

The repository remains on `main`. Use the official GitHub CLI for remote
repository inspection, synchronization, and branch administration over HTTPS.
Do not create new branches. Never delete `main`; review branch protection before
deleting any other remote branch.

There is no active “Phase 4” document. Future work is tracked as backlog in the
current-state and demo playbook documents; archived phase reports are evidence
only.

## Verify changes

When local validation is explicitly needed, run project execution inside
rootless Podman. Remote deployment does not invoke this local workflow:

```bash
export PATH="/opt/podman/bin:$PATH"
./scripts/build.sh demo
./scripts/verify-local.sh
./scripts/run-local.sh
./scripts/verify-vertical-slice.sh
./scripts/verify-e2e.sh
./scripts/stop-local.sh
```

`verify-e2e.sh` runs the Playwright suite in a disposable Playwright container
attached to `lemans-demo-net`. Record its exact pass/fail counts before running
`./scripts/stop-local.sh`. The standard `verify-local.sh` script covers static
frontend and Go checks only.

## Official guidance checked 2026-08-12

- [Next.js 16 upgrade guidance](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [React rules](https://react.dev/reference/rules)
- [TypeScript strict mode](https://www.typescriptlang.org/tsconfig/strict)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Go release history](https://go.dev/doc/devel/release)
- [Podman documentation](https://docs.podman.io/_/downloads/en/v5.8.1/pdf/)
- [Podman Quadlet units](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html)
- [Podman Quadlet basic usage](https://docs.podman.io/en/latest/markdown/podman-quadlet-basic-usage.7.html)
- [Podman build units](https://docs.podman.io/en/latest/markdown/podman-build.unit.5.html)
- [Next.js standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Next.js deployment guidance](https://nextjs.org/docs/app/getting-started/deploying)
- [systemd `loginctl` linger](https://www.freedesktop.org/software/systemd/man/252/loginctl.html)
- [GitHub CLI `gh repo sync`](https://cli.github.com/manual/gh_repo_sync)
- [GitHub CLI `gh api`](https://cli.github.com/manual/gh_api)
- [GitHub branch management](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-branches-in-your-repository)
