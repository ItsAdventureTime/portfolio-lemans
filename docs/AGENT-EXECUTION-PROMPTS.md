# Agent Execution Prompts

- **Status**: Current operational prompt set
- **Updated**: 2026-08-12
- **Documentation map**: [`DOCUMENTATION-INDEX.md`](./DOCUMENTATION-INDEX.md)

These prompts are copy-paste instructions for the next coding or review agent.
Use them with [`docs/DEMO-IMPLEMENTATION-PLAYBOOK.md`](./DEMO-IMPLEMENTATION-PLAYBOOK.md)
open in the same workspace.

## 1. Discovery and planning prompt

```text
You are the implementation agent for the Le Mans demo build.

Read AGENTS.md, docs/DEMO-IMPLEMENTATION-PLAYBOOK.md, docs/DESIGN-SYSTEM.md,
docs/PROJECT-SPEC.md, and the current source before editing anything.

The demo has no real authentication. It opens at a simulated splash with an
`Enter as an Admin` action, then enters as the Admin simulated actor and exposes
role simulation for Admin, General Manager, Sales Advisor, Service Advisor,
Purchasing, and DCS. Do not add passwords, sessions, login redirects, or treat
the splash or role switcher as production security.

Inspect the current worktree and preserve unrelated user changes. Produce a
short implementation plan that maps every playbook requirement to exact files,
data models, API endpoints, actions, UI states, and tests. Identify
contradictions or missing dependencies before coding. Search official current
Next.js, React, Go, sqlc, goose, Podman, WCAG, OWASP, and MDN guidance for any
API or framework decision.

Do not modify files during this planning pass.
```

## 2. Implementation prompt

```text
Implement the approved plan for the Le Mans demo build.

Follow docs/DEMO-IMPLEMENTATION-PLAYBOOK.md as the authoritative specification.
Focus on a deterministic, no-auth demo: simulated Admin entry splash, default Admin actor, visible role
switching, role-aware navigation and action behavior, no login redirect, and
fictional seeded data.

Complete real workflows rather than placeholders: customer and vehicle history,
quote approval and conversion, job-order status including PARTS_PENDING,
purchasing and multi-job invoice allocation, OPEX approval, DCS release/payment
and proof upload, invoice subtotals/VAT/AR, job costing, accounting summaries,
and deterministic exports.

Keep the interface visually consistent with docs/DESIGN-SYSTEM.md. Implement all
loading, empty, error, and success states. Add restrained transitions with a
prefers-reduced-motion fallback. Maintain keyboard access, visible focus, and
44px touch targets.

Use server-side input validation in the Go API, exact monetary arithmetic,
centralized demo actor/policy helpers, and focused tests. Use apply_patch for
edits. Run all execution, builds, tests, migrations, and servers inside
rootless Podman. Do not use Compose, privileged containers, host networking,
broad mounts, published DB ports, or remote deployment.

At the end, report changed files, requirement coverage, commands run, exact
results, warnings, and any remaining blockers. Do not claim completion for
untested or placeholder behavior.
```

## 3. Review prompt

```text
Review the current Le Mans demo implementation against
docs/DEMO-IMPLEMENTATION-PLAYBOOK.md and docs/PROJECT-SPEC.md.

Review read-only first. Verify the no-auth Admin default and every simulated
role. Check the full workflow from customer → quotation → job order → parts →
supplier invoice → completion → invoice → collection, plus OPEX → approval →
DCS payment and proof of payment.

Look specifically for missing persistence, client-only enforcement, invalid
financial calculations, unhandled loading/empty/error states, PARTS_PENDING
regressions, hard-coded IDs, inaccessible controls, broken mobile layouts,
missing reduced-motion behavior, and documentation that claims more than the
code proves.

Run the containerized checks. Return findings by severity with exact file paths,
line numbers, reproduction steps, and a recommended fix. Do not edit files.
```

## 4. Verification prompt

```text
If local verification is explicitly required, verify the Le Mans demo from a
clean, disposable rootless Podman runtime. Remote deployment does not use this
local runtime; it builds and smoke-tests on the VPS.

Run:
  podman machine start
  ./scripts/run-local.sh
  ./scripts/verify-local.sh
  ./scripts/verify-vertical-slice.sh

Run the E2E suite in a disposable Playwright container attached to
`lemans-demo-net` with `PLAYWRIGHT_BASE_URL=http://lemans-demo-app:3000`.

Then exercise the UI through `Enter as an Admin`, and as Admin, General Manager,
Sales Advisor, Service Advisor, Purchasing, and DCS. Verify role switching without
login, deterministic local reset, and the public-demo requirement for an installed
rootless user timer that resets fictional database/uploads every 30 minutes.
Verify all major workflow transitions, exports, attachment states, keyboard focus,
mobile target sizing, and prefers-reduced-motion behavior with Playwright media
emulation. Check the Go API health endpoint at `/health` inside the internal Podman
network.

Stop and remove only the project-specific resources created by this run.
Report every pass, failure, warning, skipped check, exposed port, and remaining
limitation. A partial check is not a pass.
```

## 5. Handoff prompt

```text
Prepare the implementation handoff for the next agent.

Report the exact commit SHA, branch, files changed, verification commands and
exact results (including Playwright E2E project-by-project results), and any
unresolved blockers. Clearly separate implemented, partially implemented, and
not implemented items. Link to the authoritative documents and never repeat
historical credentials or claim production readiness for the no-auth demo.

If no blockers remain, create or update `reviews/HANDOFF-<YYYY-MM-DD>.md` and
record the copy-paste prompt a future agent can use to resume verification.
```

## 6. Repository commands

Run these from `/Users/jk.deguzman/dev/lemans-bridge-dashboard`:

```bash
# Inspect before editing
git status --short --untracked-files=all
git diff --check

# Start and validate the demo
export PATH="/opt/podman/bin:$PATH"
podman machine start
./scripts/build.sh demo
./scripts/build.sh prod
./scripts/verify-local.sh
./scripts/run-local.sh
./scripts/verify-vertical-slice.sh

# Manual spot checks at http://127.0.0.1:3000/lemans/demo/...

# Browser / E2E checks (requires local stack running and Playwright container)
podman run --rm --net lemans-demo-net \
  -v "$PWD:/app:rw" -w /app \
  -e PLAYWRIGHT_BASE_URL=http://lemans-demo-app:3000 \
  mcr.microsoft.com/playwright:v1.62.1-noble \
  bash -lc 'npm ci && npx playwright test'

# Stop only the project demo runtime after validation
./scripts/stop-local.sh
```

If a container build fails with `cannot allocate memory`, stop any running
containers and restart the Podman machine before retrying the build.

If a script reports success while an inner check failed, inspect the script and
run the failing command independently. Do not accept a green wrapper as proof.

## 7. Documentation and Git synchronization prompt

```text
For every code, configuration, schema, seed, container, deployment, or UX
change, update all affected requirements, design documents, operating guides,
README/index entries, verification evidence, and handoff notes in the same
change set. Mark historical or superseded documents clearly.

Inspect the worktree before editing and preserve unrelated user changes. Keep
the worktree on `main`; do not create feature or review branches. Use the
official GitHub CLI (`gh`) over HTTPS for remote inspection, synchronization,
and branch administration. Never delete `main`; inspect branch protection and
unique commits before deleting another branch. Report the exact branch, commit,
files included, and remote synchronization result. Never stage unrelated
dirty-worktree files just to create a clean-looking release.
```

## 8. Remote demo deployment prompt

```text
Deploy only the remote demo profile. Do not maintain or start a persistent local
deployment. The workstation packages the clean committed source only; it does
not locally build, compile, or execute the application for deployment. Local
Podman is an optional disposable validation exception and must use `--rm`.

Use ./scripts/deploy-remote-demo.sh as the single deployment entry point. The
rootless Quadlets must install under:
  /home/jk/.config/containers/systemd/bridge-ph/lemans-demo

The remote demo data, config, database, uploads, and release evidence must stay
under:
  /home/jk/bridge-ph/lemans-demo

The target URL is:
  https://delegateops.business/lemans/demo

Follow docs/REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md. Transfer the source archive and
runtime configuration, build both release-tagged web and Go API images on the
VPS, and use disposable `podman run --rm` image smoke checks there. Attach the
web container directly to the Caddy and internal networks, attach the Go API
only to the internal network, keep the DB internal with no published port, use
safe migrations, and verify the subpath, assets, API routes, Go API health,
no-auth Admin default, role switching, and web health checks.

Do not modify the shared Caddyfile or perform remote deployment until the user
has explicitly authorized it and any required Caddy container/network context is
available.
```
