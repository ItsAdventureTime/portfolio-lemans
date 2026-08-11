# AGENTS.md - Agent Operating Guidelines & Sandbox Policy

## Lead Agent Identity & Project Context

- **Role**: Lead Software Architect & AI Engineering Agent
- **Project**: Le Mans Operations & Job Cost Management System (`lemans-bridge-dashboard`)
- **Client**: LeMans Service Plus OPC
- **Domain**: Auto Service Center Operations, Job Costing, Procurement, Billing, and Reporting

## Writing and proofreading

Use US English for active app copy, documentation, guides, and commit messages.
Write in a professional, conversational, plain-language style. Prefer active
voice, short sentences, and specific actions. Remove filler, hype, generic
assurances, and unexplained jargon. Preserve required technical identifiers,
commands, status values, and legal text. Follow
[`docs/WRITING-STYLE.md`](docs/WRITING-STYLE.md) before publishing text.

## Documentation and synchronization

Treat documentation as part of every change. Before completion, update the
affected active documentation and guides so they match the implemented code,
configuration, scripts, deployment behavior, and verification results. Keep
historical material separate from current operating guidance.

Commit the complete, validated change locally. Use `gh` for GitHub
authentication and remote operations, then confirm that local `main` and remote
`main` point to the same commit. Do not report work as complete while required
documentation or repository synchronization is outstanding.

## Architectural Mandates

1. **Single Source Repository**: Single unified repository structure. No separate source code copies for demo and production.
2. **Containerized Execution Only**: All application execution, dependency installation, builds, unit/integration tests, database migrations, databases, and dev servers MUST run inside rootless Podman containers.
3. **Podman Machine Controls**:
   - Local Podman machine on macOS is managed via `podman machine start`.
   - Verified active rootless VM: `podman-machine-default` (`podman info` rootless = true).
   - The agent MUST NOT initialize, reset, remove, resize, reconfigure, or convert `podman-machine-default` to rootful mode.
4. **Image Tagging Standard**:
   - **Demo Builds**: Web image `lemans-bridge-dashboard:demo-web`, Go API image `lemans-bridge-dashboard-go:demo-go`.
   - **Production Builds**: Web image `lemans-bridge-dashboard:prod-web`, Go API image `lemans-bridge-dashboard-go:prod-go`.
5. **Container Runtime Standard**:
   - Next.js web images use `node:lts-alpine` (Node.js Active LTS on latest Alpine); Go API images use `golang:alpine` (latest Go on latest Alpine) build stage and `alpine:latest` runtime; PostgreSQL uses `postgres:alpine` (latest PostgreSQL on latest Alpine) unless dependency compatibility explicitly requires a Debian-based image.
   - Next.js runtime calls the Go API over the internal Podman network; the Go API owns migrations, business logic, persistence, and presigned attachment URLs.
   - Never use `podman compose` or `docker compose` for local builds, tests, or execution.
   - Local builds, linting, type-checking, and tests are validation-only
     exceptions and must run inside disposable `podman run --rm` containers (or
     a single combined container). Remote deployment must not build, compile,
     or execute the application locally.
   - Do not leave transient containers or images running; remove them immediately with `--rm` or targeted cleanup.
6. **Local Execution Standard**:
   - Use `podman run --rm` to create short-lived containers for any required
     local validation builds/tests; destroy them after validation.
   - For local demo runtime, use `scripts/run-local.sh` which starts a PostgreSQL container, a Go API container, and a Next.js web container. Remove with `scripts/stop-local.sh` and reset to seeded state with `scripts/reset-local.sh`.
   - Local demo database and uploaded files reset to seeded state on demand.
     The public remote demo must reset its fictional database and uploads every
     30 minutes through a rootless user-level timer; production never
     auto-resets.
   - The Go API container runs migrations on startup and serves the `/admin/seed` endpoint only when `DEMO_MODE=true`.
7. **Remote Execution Standard**:
   - VPS demo and production deployments use rootless Podman Quadlet files (`.container`, `.network`, `.volume`).
   - Join the existing Caddy reverse-proxy network (`caddy.network`) with a single bridge container per environment.
   - Internal app↔database traffic stays on a dedicated internal network (`lemans-demo-net` or `lemans-prod-net`).
   - Database ports are never published to host interfaces.
   - The Go API container is attached only to the internal network; the Next.js web container is attached to both the Caddy network and the internal network.
8. **Git & GitHub Operations Standard**: - **Local Commits**: Local commits and local branch operations MUST use local `git` command. - **Remote Commits & Operations**: Remote commits, pushes, and GitHub repository operations MUST use GitHub official CLI (`gh` command). - **Transport Protocol**: Remote repository access MUST use HTTPS (`https://...`), not SSH. Authentication is assumed default via `gh auth setup-git` credential helper. - **Branch Policy**: Keep the worktree and remote on `main`; do not create feature/review branches. Never delete `main`; inspect protection and unique commits before deleting another branch.

## Demo Build Authority

For the current demo-focused work, read [`docs/DEMO-IMPLEMENTATION-PLAYBOOK.md`](docs/DEMO-IMPLEMENTATION-PLAYBOOK.md) before planning or editing. It is the authoritative demo specification and overrides older phase-completion claims where they conflict.

- The demo intentionally has **no real authentication** or login requirement.
- The demo opens at a simulated splash/landing screen with an `Enter as an
Admin` action; after entry, the active simulated actor defaults to Admin.
- The UI MUST provide a visible role switcher for Admin, General Manager, Sales Advisor, Service Advisor, Purchasing, and DCS.
- Demo role simulation is for walkthroughs and testing only; it is not a production security boundary.
- Do not add real login redirects, password prompts, sessions, or
  `requireSession` checks to the demo profile. A login-like splash is allowed
  only as clearly labeled demo theatre and must not become a security boundary.
- The demo is the canonical actively developed build; production is promoted from validated demo source and image lineage.
- Keep production authentication, secrets, persistence, backups, and deployment controls isolated as runtime/build-profile configuration.
- Never maintain a separate production source copy or promote an unverified demo build.
- Every role-sensitive action still validates input and uses the centralized demo actor/policy helper.
- Demo work must prioritize a complete, deterministic workflow and coherent UI/UX over production deployment work.

The companion execution prompts are in [`docs/AGENT-EXECUTION-PROMPTS.md`](docs/AGENT-EXECUTION-PROMPTS.md).

## Remote Demo Deployment Authority

The current demo has no persistent local deployment target. Local Podman may be
started with `podman machine start` only when disposable build, compile, test, or
verification work needs it; use `podman run --rm` and clean up temporary runtime
resources afterward.

The remote demo is deployed through the single orchestrator
`./scripts/deploy-remote-demo.sh` and rootless Quadlets. The workstation only
archives and transfers the clean committed source with `rsync` over SSH; do not
use `scp`. The VPS builds release-tagged images with rootless `podman build` and smoke-tests them with disposable
`podman run --rm` containers. The authoritative remote
locations are:

- Quadlets: `/home/jk/.config/containers/systemd/bridge-ph/lemans-demo`
- Demo data/config/database/backups: `/home/jk/bridge-ph/lemans-demo`
- Public URL: `https://delegateops.business/lemans/demo`

Follow [`docs/REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md`](docs/REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md)
before changing deployment code. Do not connect to, reload, or modify the remote
host or shared Caddy configuration until the user explicitly authorizes the
deployment and provides any required Caddy context.

## Verified Execution Boundaries & Results

- **Local Demo Container**: `lemans-demo-app` listening on `127.0.0.1:3000`, readiness probed at `/lemans/demo` (`200 OK`).
- **Remote Demo Container**: `lemans-demo-app` listening on `127.0.0.1:3002` behind Caddy (`200 OK`).
- **Remote Production Container**: `lemans-prod-app` listening on `127.0.0.1:3003` behind Caddy (`200 OK`).
- **Quadlet Service Names**: Demo units are `lemans-demo.service`, `lemans-demo-go.service`, `lemans-demo-db.service`; production units are `lemans.service`, `lemans-go.service`, `lemans-db.service`. Container names remain `lemans-demo-app`/`lemans-demo-go`/`lemans-demo-db` and `lemans-prod-app`/`lemans-prod-go`/`lemans-prod-db` respectively.
- **Database Isolation**: PostgreSQL containers run on internal bridge networks with 0 published host database ports.
- **Historical Validation Evidence**: Prior phase and remote-result reports are
  retained under [`to-review-and-delete/historical-docs/`](to-review-and-delete/historical-docs/)
  for user review only. Current validation authority is `CURRENT-STATE.md` and
  the demo playbook.

## Strict Sandbox Restrictions

- **Rootless Execution**: Project tooling runs strictly in rootless Podman mode.
- **No Privileged Containers**: `--privileged` flag is prohibited.
- **No Host Networking**: Container networking must use isolated user networks (`--net` project bridges). `--net=host` is strictly forbidden.
- **No Podman Socket Mount**: Mounting `/run/user/.../podman/podman.sock` or `/var/run/docker.sock` inside containers is prohibited.
- **No Broad Mounts**: Mounts are strictly restricted to the project root directory (`/Users/jk.deguzman/dev/lemans-bridge-dashboard`). Mounting `$HOME`, `/`, `/etc`, `/usr`, or other host system directories is strictly prohibited.
- **Loopback-Only Ports**: Exposed container ports must bind exclusively to loopback interface (`127.0.0.1:<port>`). Public binding (`0.0.0.0`) is prohibited.
- **No Published Database Ports**: Database containers (PostgreSQL) must run entirely inside internal Podman container networks. Database ports (`5432`) MUST NOT be published or exposed to host interfaces in production/prodlike environments.
- **No Broad Prune / Reset Commands**: `podman system prune -a`, `podman rm -fa`, `podman rmi -a`, `podman machine rm`, or `podman machine reset` commands are STRICTLY PROHIBITED.
- **Exact Resource Cleanup**: Any container or volume cleanup must explicitly reference project specific names/labels (e.g., `lemans-demo-db`, `lemans-prodlike-app`).
- **No Unsanctioned Remote Operations**: No SSH connection, remote file transfer, remote DB migration, remote container restart, DNS modification, reverse proxy setup, or remote deployment (demo or production) without explicit, direct user instructions. Do not connect to or modify any remote environment during Phase 2 or Phase 3.
- **Verification commands for the next agent**:
  ```bash
  export PATH="/opt/podman/bin:$PATH"
  podman info --format '{{.Host.Security.Rootless}}'
  ./scripts/build.sh demo
  ./scripts/build.sh prod
  ./scripts/verify-local.sh
  ./scripts/run-local.sh
  ./scripts/verify-vertical-slice.sh
  # Manual spot checks at http://127.0.0.1:3000/lemans/demo/...
  ./scripts/stop-local.sh
  ```
- **Review Mode**: Keep terminal execution in review/ask mode where the platform supports it.
