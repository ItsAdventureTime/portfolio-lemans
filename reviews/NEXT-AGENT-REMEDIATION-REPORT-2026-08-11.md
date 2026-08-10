# Next-Agent Remediation Report — Le Mans Demo

**Date:** 2026-08-11
**Repository:** `https://github.com/ItsAdventureTime/bridge-lemans`
**Branch reviewed:** `main`
**Current HEAD:** `d53d78a`
**Status:** Changes requested; code fixes remain for the next implementation agent.

## Mission

Use this report as the implementation brief for the next agent, bot, or LLM.
The objective is to make the demo reliable, accessible, base-path-correct, and
documented while preserving the demo-first boundary:

- no real authentication, passwords, sessions, or login redirects;
- a simulated landing/splash screen with an `Enter as an Admin` action;
- Admin is the default simulated actor after entry;
- the visible role switcher supports Admin, General Manager, Sales Advisor,
  Service Advisor, Purchasing, and DCS;
- all demo routes and assets remain under `/lemans/demo/`;
- builds, tests, migrations, and app execution use rootless Podman only.

The splash screen is product theatre, not an authentication boundary. Direct
navigation to internal demo routes must remain possible for deterministic testing
unless a separate, explicitly approved demo-navigation decision changes that
behavior.

## Evidence summary

| Check                     | Result | Evidence                                                                           |
| ------------------------- | ------ | ---------------------------------------------------------------------------------- |
| Podman machine start      | WARN   | Machine was already running; `podman info` returned `true`.                        |
| Demo image build          | PASS   | Required `demo-web` and `demo-go` tags exist.                                      |
| Production image build    | PASS   | Required `prod-web` and `prod-go` tags exist.                                      |
| `verify-local.sh`         | PASS   | Initial formatting failure was corrected; format, typecheck, and Go checks passed. |
| TypeScript typecheck      | PASS   | Rerun independently in `node:lts-alpine`.                                          |
| Go generation/build/tests | PASS   | Rerun independently in `golang:alpine`.                                            |
| Local runtime             | PASS   | Canonical readiness URL returned 200.                                              |
| Vertical slice            | PASS   | Listed demo routes and API health returned 200.                                    |
| Database exposure         | PASS   | Zero published PostgreSQL host ports.                                              |
| Cleanup                   | PASS   | Named local containers stopped; worktree remained clean.                           |

## Findings to implement

### R1 — Simulated role switching is broken under the demo base path

**Severity:** P0 / blocker
**File:** `src/components/RoleSwitcher.tsx:9-15`

The client posts to `/api/set-role`. In the demo build this resolves to the
domain root and returns 404. The canonical `/lemans/demo/api/set-role` endpoint
returns 200. The UI therefore remains on Admin and does not persist a selected
role across pages.

**Why it happened:** Next.js automatically applies `basePath` to `Link` and
router navigation, but an absolute `fetch('/api/...')` URL is not a `Link`.

**Required fix:** Build the endpoint from the configured public base path, or
use a same-origin URL strategy correct for both demo and production profiles.
Check the response before refreshing and render an accessible error if it fails.

**Acceptance criteria:** Select each role, navigate to two other routes, refresh,
and confirm the selected role persists. Invalid role input must still fall back
to Admin server-side.

### R2 — The clarified simulated entry experience is missing

**Severity:** P1
**File:** `src/app/page.tsx` and the root layout/header components

The current root route immediately renders the operations dashboard. The product
brief now requires a login-like splash/landing experience with a button labeled
`Enter as an Admin`, while still having no real authentication.

Add a branded, keyboard-accessible splash state at `/lemans/demo/`. The action
may use client state or browser storage to reveal/navigate to the Admin
dashboard. Do not add passwords, sessions, `requireSession`, `/login`, or a
redirect loop. Internal routes should remain deterministic for testing.

### R3 — Server-action failures do not produce form feedback

**Severity:** P0 / blocker for form workflows
**Files:** `src/app/customers/CustomerForm.tsx:16-20`,
`src/app/customers/page.tsx:14-38`; inspect all other `*Form.tsx` pages.

The customer action throws on missing required values or API failure, while the
client starts a transition, refreshes, and renders no field-level or form-level
error. A failing duplicate submission produced no visible feedback.

Use a typed action result or `useActionState`-style pattern. Preserve entered
values, associate errors with fields where possible, and expose a form-level
`role="alert"`/`aria-live` region. Keep validation on the server/API boundary.

### R4 — A visible table link is below the project touch-target contract

**Severity:** P1 accessibility
**File:** `src/app/customers/CustomerList.tsx:23-28`

At a 390px viewport, the customer detail link measured approximately 81×17px.
The global `min-height` rule does not affect an inline anchor's line box. Make
table/action links `inline-flex items-center min-h-11`, or provide an equivalent
44×44 target without damaging table density. Audit all links and buttons.

### R5 — Remote deploy temp-file cleanup is not failure-safe

**Severity:** P1 operations/security
**Files:** `scripts/deploy-remote-demo.sh:79-108`,
`scripts/deploy-remote-prod.sh:74-100`

Temporary env/release files are deleted only after both `scp` operations finish.
There is no `trap`, so an interrupted or failed copy leaves credential-bearing
files in the repository directory. Remote env permissions are applied only in a
later SSH step.

Install an EXIT trap immediately after temp paths are defined; remove temp files
on every exit path. Prefer remote temp upload plus atomic install with mode
`0600`, then verify the remote mode before starting services.

### R6 — Verification was correctly fail-fast but documentation made it red

**Severity:** P1
**Files:** `scripts/verify-local.sh:16-21`,
`reviews/AGENT-REVIEW-PROMPT.md`

The initial run correctly stopped at the first failed check because Prettier
reported the review prompt as unformatted. The prompt and affected Markdown are
now formatted in a disposable Node container, and the rerun passed formatting,
TypeScript, and Go checks. Retain the fail-fast behavior and rerun it after any
future documentation or code change.

### R7 — Documentation claims exceed implementation evidence

**Severity:** P1 documentation integrity
**Files:** `docs/REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md:259-261`,
`reviews/REVIEWER-HANDOFF-33b4a6d.md:230`, `AGENTS.md:35`,
`docs/ENVIRONMENTS-AND-PATHS.md`

The deployment playbook and handoff claim failure-safe temp cleanup that the
scripts do not implement. Several guides still name the superseded
`lemans-remote-demo-net`/`lemans-remote-prod-net` networks, while current
Quadlets and deploy scripts use `lemans-demo-net`/`lemans-prod-net`.

Keep the current playbook authoritative, use current container and network names
in active guides, and label historical result documents as historical rather
than presenting old runtime names as current.

### R8 — Local demo credential needs an explicit policy decision

**Severity:** WARN, demo-only
**File:** `scripts/run-local.sh:41-54`

The local demo uses a fixed `postgres_demo_pass`. This is not a production
credential and is scoped to a disposable demo, but it conflicts with a literal
“no hardcoded secrets” review rule. Either generate a per-run password and pass
it to both containers, or explicitly document and test that this is a fictional,
non-secret local fixture that never leaves the isolated demo network.

## Reduced-motion verification

The stylesheet contains the expected global rule in `src/app/globals.css`:
`@media (prefers-reduced-motion: reduce)` reduces animation and transition
durations and disables smooth scrolling.

The reviewer attempted a real browser/media check on 2026-08-11:

1. Read macOS `AppleReduceMotion`: `0`.
2. Temporarily set it to `1`.
3. Reloaded the running demo in the Codex in-app browser.
4. Evaluated `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.
5. The browser still returned `false`.
6. Restored `AppleReduceMotion` to `0`.

The in-app browser exposes viewport control but no media-feature emulation. The
system preference change was real and safely restored, but the selected browser
surface did not consume it. Therefore the result is **WARN/SKIPPED for live
media emulation**, not a product pass. The next agent must use a browser runner
with explicit media emulation if available, or add a deterministic automated
test proving reduced-motion changes computed animation and transition styles.

## Implementation sequence for the next agent

1. Read `AGENTS.md`, this report, and the authoritative demo playbook.
2. Fix R1 role switching and add a regression test for `/lemans/demo`.
3. Implement R2 splash entry without introducing authentication.
4. Fix R3 form action result/error handling across all forms.
5. Fix R4 touch targets and run a 390×844 audit.
6. Fix R5 deploy cleanup and remote env permissions.
7. Format the review prompt and rerun all checks.
8. Reconcile active documentation; label historical evidence.
9. Run the full Podman pipeline and browser checks.
10. Only then use local `git` for status, diff, branch, commit, merge, and
    deletion. If remote synchronization is authorized, use GitHub CLI (`gh`)
    over the repository's HTTPS remote; do not use SSH or SSH keys. Commit on a
    short-lived `codex/` branch, merge to `main`, delete the branch, and report
    the exact commit and verification evidence.

## Required verification commands

```bash
export PATH="/opt/podman/bin:$PATH"
podman info --format '{{.Host.Security.Rootless}}'
./scripts/build.sh demo
./scripts/build.sh prod
./scripts/verify-local.sh
./scripts/run-local.sh
./scripts/verify-vertical-slice.sh
./scripts/stop-local.sh
```

No remote deployment, SSH, DNS, Caddy reload, or production operation is
authorized by this report.

## Official guidance consulted on 2026-08-11

- Next.js [`basePath`](https://nextjs.org/docs/pages/api-reference/config/next-config-js/basePath): build-time prefix; `Link` and router navigation apply it automatically.
- MDN [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion): use `reduce` to remove, reduce, or replace non-essential motion.
- W3C [WCAG 2.2](https://www.w3.org/TR/WCAG22/), especially Target Size, Focus Visible, and Focus Appearance.
- Podman [Quadlet systemd unit documentation](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html): `Requires`/`After` dependencies translate into generated systemd units.

## Definition of done

The next agent must not claim completion until R1–R7 are fixed and independently
verified; the splash is clearly simulated and contains no real auth boundary;
role switching persists; form failures render actionable feedback; visible
interactive targets meet the project’s 44×44 contract; reduced-motion behavior
is proven with real media emulation or an equivalent deterministic browser test;
`verify-local.sh` passes; and active documentation matches the code.
