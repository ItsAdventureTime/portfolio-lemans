# Documentation index

- **Updated**: 2026-08-16 (post-change workflow standard)
- **Repository branch policy**: `main` only; no feature or review branches
- **Repository**: [`ItsAdventureTime/bridge-lemans`](https://github.com/ItsAdventureTime/bridge-lemans)

Use this index to find current guidance. If two documents disagree, follow the
authority order below. Classify each guide by its primary Diátaxis purpose:
tutorial, how-to guide, reference, or explanation.

## Current sources of truth

1. [`AGENTS.md`](../AGENTS.md) — repository safety, container, deployment, and
   sandbox rules.
2. [`CURRENT-STATE.md`](./CURRENT-STATE.md) — implementation-backed runtime,
   workflow, and verification facts.
3. [`DEMO-IMPLEMENTATION-PLAYBOOK.md`](./DEMO-IMPLEMENTATION-PLAYBOOK.md) —
   demo product, UX, role-simulation, and acceptance contract.
4. [`POST-CHANGE-COMPLETION-GUIDE.md`](./POST-CHANGE-COMPLETION-GUIDE.md) —
   required research, documentation, validation, commit, HTTPS synchronization,
   and SHA-parity workflow after every change.
5. [`REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md`](./REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md) —
   remote-only deployment contract; remote operations require explicit user
   authorization.
6. [`REMOTE-DEPLOYMENT-QUICKSTART.md`](./REMOTE-DEPLOYMENT-QUICKSTART.md) —
   concise macOS operator workflow for updating the already deployed profiles
   without exported environment variables.
7. [`UI-UX-REVAMP-HANDOFF.md`](./UI-UX-REVAMP-HANDOFF.md) — implementation handoff for the completed UI/UX revamp and workflow visualizer navigation.
8. [`CODEX-REVIEW-HANDOFF.md`](./CODEX-REVIEW-HANDOFF.md) — ChatGPT Codex handoff document for code review, inspection, evaluation, and ready-to-use copy-and-paste prompt.
9. [`ARCHITECTURE.md`](./ARCHITECTURE.md),

   [`GO-BACKEND-ARCHITECTURE.md`](./GO-BACKEND-ARCHITECTURE.md),
   [`ENVIRONMENTS-AND-PATHS.md`](./ENVIRONMENTS-AND-PATHS.md), and the ADRs —
   architecture and future-profile decisions, including
   [`adr/0005-docker-sandbox-local-build-and-vps-import.md`](./adr/0005-docker-sandbox-local-build-and-vps-import.md).

10. [`GOOGLE-ANTIGRAVITY-UI-UX-PROMPT.md`](./GOOGLE-ANTIGRAVITY-UI-UX-PROMPT.md)
    — copy-and-paste execution prompt for the next UI/UX agent.
11. [`README.md`](../README.md) — quickstart and navigation index.
12. [`WRITING-STYLE.md`](./WRITING-STYLE.md) — US-English voice, tone, and
    proofreading standard for active content.

## Document status

| Document group                                                                                                                    | Status                                  | How to use it                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `CURRENT-STATE.md`, `DEMO-IMPLEMENTATION-PLAYBOOK.md`, `README.md`                                                                | Current                                 | Use for implementation and verification decisions.                                                                    |
| `ARCHITECTURE.md`, `GO-BACKEND-ARCHITECTURE.md`, `ENVIRONMENTS-AND-PATHS.md`, `DESIGN-SYSTEM.md`, `PROJECT-SPEC.md`, and the ADRs | Current contract/specification          | Use for design, domain, and architecture constraints; confirm runtime facts against `CURRENT-STATE.md`.               |
| `REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md`, `REMOTE-OPERATIONS.md`                                                                      | Current but remote-only                 | Do not execute without explicit authorization and required host/Caddy context.                                        |
| `REMOTE-DEPLOYMENT-QUICKSTART.md`                                                                                                 | Current operator quickstart             | Use for the normal no-environment-variable update flow; follow the remote playbook for topology and rollback.         |
| `POST-CHANGE-COMPLETION-GUIDE.md`                                                                                                 | Current repository operating standard   | Use after every change to research, update docs, validate, commit, synchronize HTTPS `main`, and verify SHA parity.   |
| `AGENT-EXECUTION-PROMPTS.md`, `GOOGLE-ANTIGRAVITY-UI-UX-PROMPT.md`                                                                | Current operational prompts             | Keep commands synchronized with scripts and the current demo boundary.                                                |
| `UI-UX-REVAMP-HANDOFF.md`                                                                                                         | Current implementation handoff          | Use for the completed UI/UX and workflow-navigation revamp; confirm implementation facts against `CURRENT-STATE.md`.  |
| `WRITING-STYLE.md`                                                                                                                | Current editorial standard              | Apply to active app copy, documentation, guides, and commit messages.                                                 |
| `DELIVERY-PLAN.md`                                                                                                                | Current roadmap                         | Use for roadmap boundaries only; implementation and verification claims come from `CURRENT-STATE.md`.                 |
| `to-review-and-delete/historical-docs/`, `to-review-and-delete/historical-reviews/`                                               | Review candidates / historical evidence | Preserve only for user review; never use as current proof, operating instructions, or implementation authority.       |
| `adr/0001*`, `adr/0002*`, `adr/0004*`, `adr/0005*`                                                                                | Current architecture decisions          | Apply to the current source unless superseded in the document; ADR 0005 governs local Sandbox builds and VPS imports. |
| `adr/0003*`                                                                                                                       | Future production design                | Do not add its authentication/session requirements to the demo profile.                                               |
| `references/` and `_intake/originals/`                                                                                            | Source reference / archival material    | Preserve provenance; use only to interpret original business intent, never as current implementation instructions.    |

## Keep documentation in sync

Every source, schema, seed, container, script, UX, deployment, or workflow
change must update the affected current guides and verification evidence in the
same change set. Move conflicting historical material to
`to-review-and-delete/` rather than leaving it beside active guidance.

The 2026-08-14 audit reviewed active Markdown documents, guides, prompts, and
ADRs. It did not modify ignored files, `_intake/`, `references/`, or
`to-review-and-delete/`; those paths preserve source, provenance, or historical
material and are not current guidance.

Before closing a change, confirm that the active documentation matches the
implementation and that local `main` and GitHub `main` point to the same commit.

The repository remains on `main`. Use the official GitHub CLI as the only
GitHub-facing CLI over HTTPS. The local commit primitive remains `git commit`;
configure GitHub credentials with `gh auth setup-git --hostname github.com`.
Do not create new branches. After each change, inspect local and remote branch
lists, review protection and unique commits, then delete every non-`main` branch
locally and remotely. Never delete `main`.

There is no active “Phase 4” document. Future work is tracked as backlog in the
current-state and demo playbook documents; archived phase reports are evidence
only.

## Verify changes

When local validation is explicitly needed, run project execution inside the
initialized Docker Sandbox. Remote deployment does not invoke this local
workflow:

```bash
jk-sbx-project ensure
jk-sbx-project exec -- ./scripts/build.sh demo
jk-sbx-project exec -- ./scripts/build.sh prod
jk-sbx-project publish 3000
jk-sbx-project exec -- ./scripts/run-local.sh
jk-sbx-project exec -- ./scripts/verify-local.sh
jk-sbx-project exec -- ./scripts/verify-vertical-slice.sh
jk-sbx-project exec -- ./scripts/verify-e2e.sh
jk-sbx-project exec -- ./scripts/stop-local.sh
```

`verify-e2e.sh` runs the Playwright suite in a disposable Playwright container
attached to the local Docker `lemans-demo-net`. Record its exact pass/fail
counts before running `jk-sbx-project exec -- ./scripts/stop-local.sh`. The
standard `verify-local.sh` script covers static frontend and Go checks only.

## Official guidance checked 2026-08-16

- [Next.js 16 upgrade guidance](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [React rules](https://react.dev/reference/rules)
- [TypeScript strict mode](https://www.typescriptlang.org/tsconfig/strict)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.2: consistent navigation](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html)
- [Next.js linking and navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating)
- [Next.js accessibility](https://nextjs.org/docs/architecture/accessibility)
- [Tailwind CSS v3-to-v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
- [Go release history](https://go.dev/doc/devel/release)
- [Podman documentation](https://docs.podman.io/_/downloads/en/v5.8.1/pdf/)
- [Podman Quadlet units](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html)
- [Podman Quadlet basic usage](https://docs.podman.io/en/latest/markdown/podman-quadlet-basic-usage.7.html)
- [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/)
- [Docker Sandbox security model](https://docs.docker.com/ai/sandboxes/security/)
- [Docker build best practices](https://docs.docker.com/build/building/best-practices/)
- [Docker multi-platform builds and cross-compilation](https://docs.docker.com/build/building/multi-platform/)
- [`docker image save`](https://docs.docker.com/reference/cli/docker/image/save/)
- [`podman load`](https://docs.podman.io/en/latest/markdown/podman-load.1.html)
- [Next.js standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Next.js deployment guidance](https://nextjs.org/docs/app/getting-started/deploying)
- [systemd `loginctl` linger](https://www.freedesktop.org/software/systemd/man/252/loginctl.html)
- [GitHub CLI `gh repo sync`](https://cli.github.com/manual/gh_repo_sync)
- [GitHub CLI `gh auth setup-git`](https://cli.github.com/manual/gh_auth_setup-git)
- [GitHub CLI `gh auth login`](https://cli.github.com/manual/gh_auth_login)
- [GitHub CLI `gh auth status`](https://cli.github.com/manual/gh_auth_status)
- [GitHub CLI `gh api`](https://cli.github.com/manual/gh_api)
- [GitHub branch management](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-branches-in-your-repository)
- [Diátaxis documentation framework](https://diataxis.fr/)
- [Microsoft writing style](https://learn.microsoft.com/en-us/windows/apps/design/style/writing-style)
- [Google developer documentation style guide](https://developers.google.com/style)
