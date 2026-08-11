# Agent / Bot / LLM Review Prompt — Le Mans Demo

Use this prompt when asking another agent, bot, or LLM to review, investigate, or evaluate the latest demo work on the `main` branch of `bridge-lemans`.

> **Current policy (2026-08-12):** `main` is the only branch. Remote deployment
> is remote-build-only: the workstation packages committed source, while the
> VPS builds and smoke-tests images before activating Quadlets. Local Podman is
> an optional validation exception and must leave no project runtime behind.

---

## Prompt (copy and paste)

```text
You are a disciplined reviewer/evaluator for the Le Mans Operations & Job Cost Management demo system (`bridge-lemans`).

Mission: Review the current `main` branch for correctness, completeness, and consistency with the project's demo-first architecture. Do not modify code; only inspect, run verification, and report findings.

Context and constraints:
- Repository: https://github.com/ItsAdventureTime/bridge-lemans
- Default branch: `main` only. There must be no other local or remote branches.
  Do not create feature or review branches.
- Demo-first: no real authentication. A login-like splash may offer `Enter as an Admin`; it enters the simulated Admin actor without passwords, sessions, login requirements, or authentication redirects. A visible role switcher must support Admin, General Manager, Sales Advisor, Service Advisor, Purchasing, and DCS.
- Demo data is fictional and database-backed. Local reset is on demand; the public remote demo must reset its database and uploads every 30 minutes through a rootless user-level timer. Production never auto-resets.
- Application base path: `/lemans/demo/`. The landing page and all internal links must use this prefix.
- Containerized execution only: any required local validation builds, tests,
  migrations, and app execution run inside rootless disposable Podman
  containers. Remote deployment performs its build and runtime checks on the
  VPS. No `docker compose`, no privileged containers, no host networking, no
  published database ports, no broad host mounts.
- Image tags: demo uses `lemans-bridge-dashboard:demo-web` and `lemans-bridge-dashboard-go:demo-go`; production uses `lemans-bridge-dashboard:prod-web` and `lemans-bridge-dashboard-go:prod-go`.

Review process:
1. Read `/docs/DEMO-IMPLEMENTATION-PLAYBOOK.md` and `/AGENTS.md` before anything else.
2. Inspect local and remote branches and confirm only `main` exists. Report any
   other branch as a defect.
3. Check the latest commit on `main` against `/reviews/REVIEWER-HANDOFF-*.md` for any unresolved reviewer feedback.
4. If local verification is explicitly required, run it inside rootless Podman:
   export PATH="/opt/podman/bin:$PATH"
   podman machine start
   ./scripts/build.sh demo
   ./scripts/build.sh prod
   ./scripts/verify-local.sh
   ./scripts/run-local.sh
   ./scripts/verify-vertical-slice.sh
   ./scripts/stop-local.sh
   Report the exact pass/fail/warn/skipped status of every check. Do not accept a wrapper script exit code as proof without inspecting the underlying output.
5. Spot-check the running app at http://127.0.0.1:3000/lemans/demo/ for:
   - role switching persistence across pages;
   - empty/loading/error/success four-state UI;
   - shared component usage (DataTable, FormField, StatusBadge) on list/form pages;
   - visible `:focus-visible` focus ring on keyboard navigation;
   - touch targets at least 44×44 CSS pixels on mobile emulation;
   - Playwright media emulation (`page.emulateMedia({ reducedMotion: 'reduce' })`) confirms `prefers-reduced-motion: reduce` disables nonessential motion;
   - server-side validation and error feedback on forms.
6. Inspect these files for the specific fixes expected by the last reviewer handoff:
   - scripts/run-local.sh — readiness probe must target `/lemans/demo` and report the canonical URL.
   - scripts/verify-local.sh — must fail fast on formatting, type-check, Go test, or build errors.
   - scripts/deploy-remote-profile.sh plus its demo/prod wrappers — must package
     a clean committed source archive, build release images on the VPS, run
     disposable remote `podman run --rm` smoke checks, clean temp env/release
     files, chmod 600 env files, and use correct Quadlet unit names.
   - quadlet/remote-demo reset service/timer — must be tracked, installed, rootless, and scheduled every 30 minutes; production must have no reset timer.
   - quadlet/remote-demo/*.container and quadlet/remote-prod/*.container — container names must remain `lemans-demo-app/go/db` and `lemans-prod-app/go/db`; service unit names come from filenames; dependencies must use `Requires=`.
   - src/lib/types.ts — shared frontend types should exist and no new `any` types should be introduced.
   - src/app/globals.css — must include global `:focus-visible` ring and minimum touch-target sizing.
7. Review documentation currency: every code/config change must have matching updates in `AGENTS.md`, `docs/DEMO-IMPLEMENTATION-PLAYBOOK.md`, `docs/AGENT-EXECUTION-PROMPTS.md`, and any affected playbook/handoff. Report stale or contradictory claims.
8. Evaluate security/sandbox compliance:
   - no `--privileged`;
   - no `--net=host`;
   - no published PostgreSQL host port in local/remote scripts;
   - no broad host mounts outside the project directory;
   - no hardcoded secrets.
9. Do not perform remote deployment, SSH, DNS changes, or production operations. Only inspect the deployment playbooks (`docs/REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md`) for correctness.

Deliverable:
- A concise review report with sections: Summary, Branch/Commit State, Verification Results, Code Findings, Documentation Findings, Sandbox/Security Findings, Open Questions.
- Use pass/fail/warn/skipped for every item.
- If you find a defect, include the file path, line number or range, what is wrong, and the smallest recommended fix.
- Do not modify files. If something is clearly broken and the user asks you to
  fix it, make the smallest change directly on `main` and verify it.
```

---

## How to use

The commands below are optional local validation. They are not part of remote
deployment; remote deployment packages source locally and builds on the VPS.

1. Open your preferred LLM/agent interface.
2. Paste the prompt above exactly as-is.
3. If the agent needs to run code, point it at `/Users/jk.deguzman/dev/lemans-bridge-dashboard` and remind it to use rootless Podman only.
4. After the review, if changes are requested, apply them directly on `main`
   under the repository's trunk-only policy and rerun the verification pipeline.

## Branch policy reminder

This repo now follows trunk-based development:

- `main` is the single source of truth.
- No feature or review branches are created.
- Releases and deployments are cut from `main`.
