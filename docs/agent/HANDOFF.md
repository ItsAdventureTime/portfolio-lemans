# Mac mini portfolio demo implementation handoff

**ACTIVE_ROLE:** Implementation complete; independent review and validation pending

**NEXT_OWNER:** GPT-6 Sol (High), independent reviewer

**IMPLEMENTATION_OWNER:** GPT-6 Luna (High)

**REVIEW_OWNER:** GPT-6 Sol (High), planner and independent reviewer

**TARGET:** Demo only at `https://lemans.delegateops.business/`

**CAPABILITY:** Repository code and documentation, Docker Sandbox checks. No external deployment during implementation without a direct user instruction.

**PUSH:** Commit validated repository changes and synchronize HTTPS `main` under repository policy.
**DEPLOYMENT:** User follows `docs/MACOS-DOCKER-COMPOSE.md` manually after review. Do not access the Mac mini tunnel, Cloudflare account, or old VPS as part of this handoff.

## Implementor progress (2026-09-24)

- Confirmed worktree is `main`; preserved the pre-existing changes listed below.
- Read the authoritative demo playbook, hosting decision, and operator guide.
- Added local Dockerfile builds, the empty-base-path build argument, PostgreSQL
  18 with a separate named volume, external file-backed secrets, and required
  shell variables for the R2 endpoint and existing tunnel network.
- Added an explicit internal-only `seed` service and restricted the public
  Next.js proxy to Go `/api/` paths.
- Updated the operator guide, current-state, architecture, environment,
  README, index, ADR, agent policy, and demo playbook. The R2 retention rule
  remains an operator setup requirement.
- External R2, tunnel, and Mac mini setup remain unverified and out of scope.
- Official guidance checked: Docker Compose build/interpolation docs, Next.js
  environment variable docs, and Cloudflare R2 object lifecycle docs on
  2026-09-24. PostgreSQL 18 Alpine tag and its data-directory behavior were
  checked against the [official image](https://hub.docker.com/_/postgres) and
  [PostgreSQL version policy](https://www.postgresql.org/support/versioning/).
  See the source links in the affected docs.
- Implementation validation is pending in Sol's sandbox-private committed
  snapshot. Remote `main` synchronization waits for that validation.
- Sol's first review found a Compose network YAML shape error and that a
  literal R2 example endpoint could pass configuration parsing. Both are fixed
  in an implementor follow-up; Sol must validate the new HEAD.
- Sol's `9cceb53` sandbox run passed Go tests, lint, typecheck, Next.js build,
  Compose image builds, seed/proxy smoke, DB persistence, and controlled reset.
  It found Prettier failures, an unsupported Node TypeScript runtime flag in
  the base-path test, and package advisories. Luna fixed the format/test issues
  and updated Next.js, `eslint-config-next`, and locked `sharp`; all changes
  await fresh validation. One high audit finding remains to be identified.
- Detailed reviewer setup and external verification limits are in
  [`HANDOFF.notes.md`](./HANDOFF.notes.md).

## Outcome and authority

Make the existing demo deployable as three OrbStack Docker Compose services: Next.js web, Go API, and PostgreSQL. Connect only the web service to the existing `cloudflared` container's Docker network. Use Cloudflare R2 through the Go API's existing S3 presigner. Preserve the simulated demo entry and six-role switcher; do not introduce real login or a production profile. Read `docs/DEMO-IMPLEMENTATION-PLAYBOOK.md`, `docs/DEMO-HOSTING-DECISION.md`, and `docs/MACOS-DOCKER-COMPOSE.md` before editing. This handoff supersedes older Mac deployment assumptions where they conflict. The user explicitly authorized planning a Compose portfolio demo; agent development and checks still run through `jk-sbx-project` inside Docker Sandbox.

## State to preserve

The planner found uncommitted changes in `backend/cmd/api/main.go`, `backend/internal/config/config.go`, `backend/internal/config/config_test.go`, `compose.yaml`, `package.json`, `src/app/layout.tsx`, `src/lib/base-path.ts`, and new `src/lib/base-path.test.mjs`. They belong to the existing worktree. Inspect them first; retain or improve them. Do not discard or overwrite them. At planning time local and GitHub `main` both pointed to `3ae43ac16dc28ba05389e124dfa29489e070928a`. The old `origin` URL redirected to the canonical `ItsAdventureTime/portfolio-lemans` repository.

## Implementation slices

1. **Compose and credentials.** Keep one `compose.yaml` for demo. Add image build definitions for `Dockerfile.web` and `Dockerfile.go`, using root base path (`NEXT_PUBLIC_BASE_PATH=""`) at **build time** and runtime. Keep safe values such as `SITE_URL`, API URL, bucket name, R2 endpoint, region `auto`, and object prefix in Compose. Require a real R2 account endpoint before use. Source DB password and R2 key pair from individual files outside the repository via Compose secrets; support `_FILE` in Go config as the current uncommitted code begins to do. No external `.env` or credentials in Compose, Git, image layers, logs, or rendered config examples. Add `secrets/` to `.gitignore` as defense in depth if any local fallback uses it. Keep PostgreSQL on an internal project network without published ports; pin a PostgreSQL major version and use a compatible, project-specific named volume. Let web reach the R2 S3 endpoint for server-action proof uploads. Keep Go API unpublished and on the internal network. Name the external tunnel network as a clearly editable prerequisite, not an assumption that the user's existing network is called `cloudflared-network`. Do not modify the existing `cloudflared` stack.
2. **Seed and public boundary.** The Go API migrates on startup but does not seed automatically. Provide an explicit, repeatable initial seed/reset command through a one-shot Compose service or similarly small mechanism that reaches `/admin/seed` only on the internal network. Limit `src/app/api/proxy/[...path]/route.ts` to Go `/api/` routes so visitors cannot call `/admin/seed` through the public web app. Verify the attempted public seed call is rejected and records remain. Preserve the demo's intended role simulation; it is not authentication. Define a bounded reset procedure for public demo data and R2 objects or a lifecycle policy so uploads do not grow without limit.
3. **R2 proof flow.** Reuse `backend/internal/b2/b2.go`; configure R2 S3 endpoint, `auto` region, demo bucket, and key prefix. Keep R2 API keys in secret files. The current DCS server action uploads a proof with a presigned `PUT`; verify upload, metadata link, and signed download end to end. If R2's signing differs, fix the shared Go presigner, not individual callers. Do not add an R2 Worker merely to proxy the existing S3 flow. Document exact CORS rules if any browser-side signed URL flow is kept or added; current DCS upload runs server-side.
4. **Documentation.** Update `AGENTS.md`, `README.md`, `docs/CURRENT-STATE.md`, `docs/ARCHITECTURE.md`, `docs/ENVIRONMENTS-AND-PATHS.md`, `docs/DOCUMENTATION-INDEX.md`, `docs/MACOS-DOCKER-COMPOSE.md`, and affected ADRs so current deployment facts match verified code. Keep legacy VPS instructions clearly labeled as separate, inactive history or remote option. Do not claim a public URL is live before it has been checked. Record any departures in `docs/agent/HANDOFF.notes.md` with `## Deviations` and `## How the run ended`.

## Checks the implementer owns

- Inspect `docker compose config --quiet` using the required secret-file directory, without printing secret values. Run it through the approved project workload boundary where possible; do not silently switch agent execution to the host. Check missing-secret and placeholder failures deliberately.
- Run relevant Go tests and frontend format, lint, type, base-path test, and build inside `jk-sbx-project implement`. Use the project-specific wrapper and report exact commands and results. Do not bootstrap a browser QA stack in the implementation lane.
- Run bounded Compose topology and HTTP smoke checks only if the approved Sandbox lane can exercise them without touching the existing homelab stack. Confirm web to API, API to DB, web outbound R2, no published DB/API port, and seed operation.
- Confirm `git diff --check`; update docs; commit only intended files. Record local commit SHA and remote `main` SHA. Do not push unrelated uncommitted work without reviewing and including it as intentional implementation.

## Independent acceptance for Sol

Use `jk-sbx-project validate` with a committed snapshot for independent checks. Bootstrap dependencies from the lockfile in that snapshot if needed. Review Compose topology, secret mounts and permissions, public proxy guard, base path, root URL, seeded role workflows, PostgreSQL persistence across restart, controlled reset, proof upload/download, and desktop/mobile rendered behavior. Confirm no regressions in the existing demo Playwright workflow. An actual Cloudflare hostname, R2 bucket, tunnel network, and Mac mini deployment can be marked verified only after the user performs the manual deployment and reports or grants access to the resulting observations.

## STOP conditions and finish line

Stop and report if the existing `cloudflared` container cannot be reached from an isolated, shared Docker network without changing its unrelated Compose stack; if R2 credentials or bucket cannot be provided for live proof verification; if Sandbox policy blocks the required local implementation checks; or if the canonical GitHub `main` has changed in a way that cannot be integrated safely. Do not solve these by exposing PostgreSQL or the Go API publicly, changing other homelab services, or silently deploying to the VPS.

Implementation is ready for independent review when the Compose demo builds from the repo, starts with mounted secrets, seeds through an internal-only path, serves `/` after simulated entry, completes the core workflow and proof flow, passes relevant checks, and has accurate operator documentation. Luna should return the commit SHA, exact results, failures, unresolved external setup, and the notes file path to Sol. Sol will return concrete defects for revision until acceptance criteria pass.
