# Agent Review Prompt — Le Mans Demo PR

> Use this prompt when dispatching an agent/LLM to review a pull request or commit
> in the `lemans-bridge-dashboard` demo project. It is tuned for the project's
> no-auth demo role-simulation model, rootless Podman runtime, `/lemans/demo`
> base path, and the `AGENTS.md` operating boundaries.

## Project context (include at the top of the review)

- Repository: `https://github.com/ItsAdventureTime/bridge-lemans.git` (HTTPS only)
- Framework: Next.js 16.x App Router + React Server Components, Tailwind CSS v4,
  TypeScript 5, Go 1.24+ API, PostgreSQL via GORM/Migrate
- Runtime standard: rootless Podman only; no Compose, no host networking, no
  published DB ports, no privileged containers
- Demo profile: no authentication, no login, default Admin actor, visible role
  switcher for Admin/General Manager/Sales Advisor/Service Advisor/Purchasing/DCS
- Canonical demo base path: `/lemans/demo`
- Authoritative documents: `AGENTS.md`, `docs/DEMO-IMPLEMENTATION-PLAYBOOK.md`,
  `docs/AGENT-EXECUTION-PROMPTS.md`
- Reviewer handoff under review: `reviews/REVIEWER-HANDOFF-33b4a6d.md`

## Your mission

Review the proposed change set (PR diff or commit) against the requirements in
`reviews/REVIEWER-HANDOFF-33b4a6d.md`. Do not perform edits. Produce a structured,
evidence-based evaluation that a human can act on.

Focus only on lines/files changed in the current diff, unless the change reveals
a regression or an existing bug it directly interacts with. Ignore unrelated
pre-existing issues.

## Scope and priorities (spend effort in this order)

### P0 — Must fix before merge

1. **Demo contract violations**: login/authentication added, role simulation
   hidden or removed, `/lemans/demo` base path broken, no-auth defaults changed.
2. **Security**: hardcoded secrets/credentials, unsafe shell/exec, injection
   (SQL, command, path traversal), SSRF, insecure file upload handling, secrets
   in logs/errors, broad host mounts, privileged containers, published DB ports,
   host networking, podman socket mounts.
3. **Correctness/runtime**: script exits reporting success while an inner check
   failed, readiness probe wrong or missing, build broken, type errors, Go test
   failures, seed/reset no longer deterministic.
4. **Data integrity**: floating-point financial arithmetic, unvalidated mutations,
   missing server-side validation where the diff claims it exists.

### P1 — Likely production/demo bug

- Broken control flow, off-by-one, missing null/undefined checks, incorrect
  comparison operators, missing return values, unhandled promise rejections.
- Server actions lacking `revalidatePath` where cross-page state should update.
- New `any` types or unsafe `as` assertions introduced by the change.
- Accessibility regression: focus hidden, color-only status, missing labels,
  motion not respecting `prefers-reduced-motion`, touch targets <44×44.
- Container/networking misconfiguration relative to `AGENTS.md`.

### P2 — Reliability / maintainability / testability

- Resource leaks, missing error handling on I/O/network, error messages that
  lose context, duplicated logic that should be extracted, functions that grew
  too large without reason.
- Missing or stale tests for new behavior.
- Inconsistent naming or conventions vs. the existing codebase.
- Documentation (`AGENTS.md`, playbooks, handoff) out of sync with code.

### P3 — Polish / optional

- Naming/style nits only if no formatter covers them.
- Refactoring suggestions that are not required for merge.

## Explicitly ignore

- Formatting and whitespace covered by `prettier`/`gofmt`.
- Personal style preferences that contradict the project's established pattern.
- Pre-existing issues the diff does not touch.

## Required output format

Return the review as Markdown with these sections (omit empty sections):

```markdown
## Summary
1–3 sentences. State whether the change is safe to merge, the most serious
finding if any, and the overall quality.

## Verdict
APPROVE / COMMENT / REQUEST_CHANGES
(A single word on its own line.)

## Findings
| # | Severity | Confidence | Location | Description |
|---|----------|------------|----------|-------------|
| 1 | critical | 0.95 | `file.go:42` | ... |
| 2 | bug | 0.80 | `src/app/page.tsx:55` | ... |

## P0/P1 issue details
For each critical/bug finding with confidence ≥ 0.7, include:
- Failure scenario: what breaks in the demo or deployment.
- Evidence: exact code snippet from the diff.
- Recommended fix: concrete replacement code or command.

## Strengths
3–5 specific things done well, with line references.

## Verification notes
Which commands the author ran, what they proved, and what is still missing.
```

### Severity definitions

- `critical`: must fix before merge — security, data loss, demo contract break,
  build/test failure.
- `bug`: likely incorrect behavior.
- `warning`: potential problem or maintainability risk.
- `nit`: optional style/polish.

### Confidence

0.0–1.0. 0.9+ means clearly visible in the diff. 0.5–0.6 means suspicious but
may be intentional; still report. Below 0.5 goes in `Low-confidence notes`.

## Specific checks for this codebase

Run these against the diff and cite evidence:

1. **No-auth demo preserved**: grep for `requireSession`, `login`, `password`,
   `middleware.*auth`, redirects that exclude `/lemans/demo`. Any P0 finding
   must be highlighted.
2. **Role simulation visible and correct**: `RoleSwitcher` still exposed and
   `getDemoActor`/`can*` helpers still used for policy decisions.
3. **Base path intact**: literal `/lemans/demo` is present in runtime and build
   output paths; readiness probe in `run-local.sh` hits `/lemans/demo`.
4. **Script correctness**: `set -euo pipefail` where appropriate; no `&& true` or
   `|| true` that masks real failures; temp files cleaned on `EXIT`/`ERR`.
5. **Remote deployment safety**: release directory created before `cp`, env
   files set to `600`, unit names derived from filenames correctly,
   `systemd-analyze verify` used, no SSH commands run without explicit user
   authorization.
6. **Container boundaries**: no `--privileged`, no `--net=host`, no published DB
   ports, no broad host mounts, no podman socket mounts, correct
   internal/Caddy network separation.
7. **Accessibility**: global `:focus-visible` ring, 44×44 touch targets,
   `prefers-reduced-motion` honored, color not sole status signal.
8. **Financial correctness**: monetary math uses integers/minor units or exact
   decimal; no floating-point totals persisted or displayed without rounding.
9. **Type safety**: no new `any`; shared types in `src/lib/types.ts` used
   consistently.
10. **Documentation sync**: every changed script/container/UX rule is reflected
    in `AGENTS.md` and relevant docs.

## Rules

- Do not fabricate findings. If a category is clean, say "No issues found" for
  that category.
- Every P0/P1 finding must include a concrete fix suggestion.
- Group repeated patterns into one finding with all affected locations.
- If context is missing, state your assumption explicitly rather than guessing.
- Be concise; prefer fewer high-quality findings over many low-signal notes.
