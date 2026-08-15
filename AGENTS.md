# AGENTS.md - Agent Operating Guidelines & Sandbox Policy

## Lead Agent Identity & Project Context

- **Role**: Lead Software Architect & AI Engineering Agent
- **Project**: Le Mans Operations & Job Cost Management System (`lemans-bridge-dashboard`)
- **Client**: Le Mans Service Plus OPC
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

Commit the complete, validated change locally. For every completed change,
synchronize the local and remote `main` branches before reporting completion.
Use `gh` as the only GitHub-facing CLI: authenticate with HTTPS and use
`gh auth setup-git --hostname github.com` as the Git credential helper. The
local commit primitive remains `git commit` because GitHub CLI has no local
commit command; do not use SSH remotes, SSH keys, passkeys, or another remote
transport. Confirm that local `main` and remote `main` point to the same commit.
If any branch other than `main` exists, inspect its protection and unique
commits, then remove the local and remote branch with `gh` after confirming it
is not `main` and has no required work. Do not report work as complete while
documentation, branch cleanup, or repository synchronization is outstanding.

## Architectural Mandates

1. **Single Source Repository**: Single unified repository structure. No separate source code copies for demo and production.
2. **Docker Sandbox Execution**: All local application execution, dependency installation, builds, unit/integration tests, database migrations, databases, and dev servers MUST run through `jk-sbx-project exec` inside the initialized project Docker Sandbox. Local tooling uses Docker, not Podman.
3. **Sandbox Controls**:
   - Use `jk-sbx-project ensure` to initialize or resume the deterministic project Sandbox.
   - Use `jk-sbx-project exec -- <command>` for single commands and `jk-sbx-project run '<command>'` for compound commands.
   - Use `jk-sbx-project publish 3000` when a local web container must be reachable from the macOS host.
   - Do not initialize, reset, remove, or reconfigure an unrelated Sandbox.
4. **Image Tagging Standard**:
   - **Demo Builds**: Web image `lemans-bridge-dashboard:demo-web`, Go API image `lemans-bridge-dashboard-go:demo-go`.
   - **Production Builds**: Web image `lemans-bridge-dashboard:prod-web`, Go API image `lemans-bridge-dashboard-go:prod-go`.
5. **Container Runtime Standard**:
   - Next.js web images use `node:lts-alpine` (Node.js Active LTS on latest Alpine); Go API images use `golang:alpine` (latest Go on latest Alpine) build stage and `alpine:latest` runtime; PostgreSQL uses `postgres:alpine` (latest PostgreSQL on latest Alpine) unless dependency compatibility explicitly requires a Debian-based image.
   - Next.js runtime calls the Go API over the internal Docker network locally and the internal Podman network remotely; the Go API owns migrations, business logic, persistence, and presigned attachment URLs.
   - Never use Compose for local builds, tests, or execution.
   - Local Docker images and disposable containers are created inside the
     Sandbox and must be removed with `--rm` or targeted cleanup. Remote
     deployment must not build, compile, or run image smoke tests on the VPS.
   - Build the verified VPS target platform inside the Sandbox before transfer
     (the current remote target defaults to `linux/amd64`; `TARGET_PLATFORM`
     is an explicit override); the VPS imports the images with rootless
     `podman load`. Native build stages avoid target-CPU emulation.
6. **Local Execution Standard**:
   - Run `scripts/build.sh`, `scripts/verify-local.sh`, and the other local
     scripts through `jk-sbx-project exec`; they use the Sandbox Docker engine.
   - For local demo runtime, use `scripts/run-local.sh` inside the Sandbox. It
     starts a PostgreSQL container, a Go API container, and a Next.js web
     container. Stop with `scripts/stop-local.sh` and reset with
     `scripts/reset-local.sh`.
   - Local demo database and uploaded files reset to seeded state on demand.
     The public remote demo must reset its fictional database and uploads every
     30 minutes through a rootless user-level timer; production never
     auto-resets.
   - The Go API container runs migrations on startup and serves the `/admin/seed` endpoint only when `DEMO_MODE=true`.
7. **Remote Execution Standard**:
   - VPS demo and production deployments use rootless Podman Quadlet files (`.container`, `.network`, `.volume`) for runtime only.
   - The local deployment wrapper transfers a checksum-verified Docker image
     archive. VPS activation imports it with `podman load`, installs the
     Quadlets, starts services, and performs runtime health checks; it does not
     compile or build images.

- Join the existing Caddy reverse-proxy network through its `caddy.network`
  Quadlet reference. The supplied Caddy Quadlet sets `NetworkName=caddy`; use
  `caddy` for direct Podman network checks and retain `Network=caddy.network`
  in application Quadlets.
  - Internal app↔database traffic stays on a dedicated internal network (`lemans-demo-net` or `lemans-prod-net`).
  - Database ports are never published to host interfaces.
  - The Go API container is attached only to the internal network; the Next.js web container is attached to both the Caddy network and the internal network.
  - Remote runtime variables belong in generated Quadlet `Environment=` entries
    inside the profile `.container` files. Do not create or reference external
    `.env`/`EnvironmentFile=` files; credential-bearing generated Quadlets are
    mode `600`.

8. **Git & GitHub Operations Standard**: Use the GitHub official CLI (`gh`) as the only GitHub-facing CLI for authentication, remote inspection, HTTPS credential setup, pushes, pulls/synchronization, branch deletion, PR operations, and API checks. Configure HTTPS with `gh auth setup-git --hostname github.com`; never use SSH Git remotes, SSH keys, passkeys, or another GitHub transport. The local commit and local worktree primitives necessarily use `git` because `gh` has no local commit command. Keep the worktree and remote on `main`; do not create feature/review branches. After each validated change, commit locally, synchronize remote `main`, and confirm both refs have the same SHA. Inspect all branches; delete every non-`main` branch locally and remotely after checking protection and unique commits. Never delete `main`.

## Demo Build Authority

For the current demo-focused work, read [`docs/DEMO-IMPLEMENTATION-PLAYBOOK.md`](docs/DEMO-IMPLEMENTATION-PLAYBOOK.md) before planning or editing. It is the authoritative demo specification and overrides older phase-completion claims where they conflict.

- The demo intentionally has **no real authentication** or production security
  boundary. It opens at a simulated splash/landing screen with an `Enter as an
Admin` action; the entry cookie is a UX gate, and the active simulated actor
  defaults to Admin after entry.
- Before entry, the shared dashboard shell and direct module routes render the
  branded splash only. Header, navigation, breadcrumbs, footer, and dashboard
  content appear after simulated entry.
- The UI MUST provide a visible role switcher for Admin, General Manager, Sales Advisor, Service Advisor, Purchasing, and DCS.
- Demo role simulation is for walkthroughs and testing only; it is not a production security boundary.
- Do not add real login redirects, password prompts, sessions, or
  `requireSession` checks to the demo profile. The entry gate is clearly labeled
  demo theatre and must not be treated as a security boundary.
- The demo is the canonical actively developed build; production is promoted from validated demo source and image lineage.
- Keep production authentication, secrets, persistence, backups, and deployment controls isolated as runtime/build-profile configuration.
- Never maintain a separate production source copy or promote an unverified demo build.
- Every role-sensitive action still validates input and uses the centralized demo actor/policy helper.
- Demo work must prioritize a complete, deterministic workflow and coherent UI/UX over production deployment work.

The companion execution prompts are in [`docs/AGENT-EXECUTION-PROMPTS.md`](docs/AGENT-EXECUTION-PROMPTS.md).

## Remote Demo Deployment Authority

The current demo has no persistent local deployment target. Local builds,
compilation, tests, and verification run through the initialized Docker Sandbox;
do not start or use a local Podman machine.

The remote demo is deployed through rootless Quadlets. The preferred workflow is
two-stage: run `./scripts/sync-remote-demo.sh` on macOS, then log in to the VPS
and run the printed `scripts/activate-remote-demo.sh` command. The sync step
uses the project Docker Sandbox for the local Linux image build, then uses
`rsync` over SSH for the source tree and checksum-verified image bundle; do not
use `scp`. The preflight reports uncommitted deployable paths and allows only
local Serena metadata at `.serena/project.yml` to remain modified; that file is
excluded from the snapshot. The VPS activation imports the profile-tagged images
with rootless `podman load`, installs Quadlets, and starts the runtime. It does
not build, compile, or run image smoke tests on the VPS. The original
`./scripts/deploy-remote-demo.sh` remains available as an automated wrapper that
performs both stages over one SSH control connection. On macOS, run
`scripts/configure-remote-demo.sh` once to store remote settings and B2
credentials in the login Keychain; later deployments need no exported variables.
The authoritative remote
locations are:

- Quadlets: `/home/jk/.config/containers/systemd/bridge-ph/lemans-demo`
- Demo data/config/database/backups: `/home/jk/bridge-ph/lemans-demo`
- Current synced source: `/home/jk/bridge-ph/lemans-demo/current`
- Public URL: `https://delegateops.business/lemans/demo`

Follow [`docs/REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md`](docs/REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md)
before changing deployment code. Do not connect to, reload, or modify the remote
host or shared Caddy configuration until the user explicitly authorizes the
deployment and provides any required Caddy context. When authorized for the
demo, the deployment may install only the tracked demo route block directly
before the DelegateOps fallback in `/home/jk/caddy/conf/Caddyfile`,
validate/format the complete Caddyfile, and perform a graceful reload through
the running rootless Caddy container. It must preserve unrelated site routes
and must not create backup files.

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

- **Sandbox Execution**: Project tooling runs through the initialized Docker Sandbox. Remote runtime services remain rootless Podman Quadlets.
- **No Privileged Containers**: `--privileged` flag is prohibited.
- **No Host Networking**: Container networking must use isolated user networks (`--net` project bridges). `--net=host` is strictly forbidden.
- **No Container Socket Mount**: Mounting `/run/user/.../podman/podman.sock` or `/var/run/docker.sock` inside project containers is prohibited.
- **No Broad Mounts**: Mounts are strictly restricted to the project root directory (`/Users/jk.deguzman/dev/lemans-bridge-dashboard`). Mounting `$HOME`, `/`, `/etc`, `/usr`, or other host system directories is strictly prohibited.
- **Loopback-Only Ports**: Exposed container ports must bind exclusively to loopback interface (`127.0.0.1:<port>`). Public binding (`0.0.0.0`) is prohibited.
- **No Published Database Ports**: Database containers (PostgreSQL) must run entirely inside internal Docker networks locally and internal Podman networks remotely. Database ports (`5432`) MUST NOT be published or exposed to host interfaces in production/prodlike environments.
- **No Broad Prune / Reset Commands**: `docker system prune -a`, `docker rm -fa`, `docker rmi -a`, `podman system prune -a`, `podman rm -fa`, and `podman rmi -a` commands are STRICTLY PROHIBITED.
- **Exact Resource Cleanup**: Any container or volume cleanup must explicitly reference project specific names/labels (e.g., `lemans-demo-db`, `lemans-prodlike-app`).
- **No Unsanctioned Remote Operations**: No SSH connection, remote file transfer, remote DB migration, remote container restart, DNS modification, reverse proxy setup, or remote deployment (demo or production) without explicit, direct user instructions. Do not connect to or modify any remote environment during Phase 2 or Phase 3.
- **Verification commands for the next agent**:
  ```bash
  jk-sbx-project ensure
  jk-sbx-project exec -- ./scripts/build.sh demo
  jk-sbx-project exec -- ./scripts/build.sh prod
  jk-sbx-project exec -- ./scripts/verify-local.sh
  jk-sbx-project publish 3000
  jk-sbx-project exec -- ./scripts/run-local.sh
  jk-sbx-project exec -- ./scripts/verify-vertical-slice.sh
  # Manual spot checks at http://127.0.0.1:3000/lemans/demo/...
  jk-sbx-project exec -- ./scripts/stop-local.sh
  ```
- **Review Mode**: Keep terminal execution in review/ask mode where the platform supports it.
