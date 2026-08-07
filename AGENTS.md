# AGENTS.md - Agent Operating Guidelines & Sandbox Policy

## Lead Agent Identity & Project Context

- **Role**: Lead Software Architect & AI Engineering Agent
- **Project**: Le Mans Operations & Job Cost Management System (`lemans-bridge-dashboard`)
- **Client**: LeMans Service Plus OPC
- **Domain**: Auto Service Center Operations, Job Costing, Procurement, Billing, and Reporting

## Architectural Mandates

1. **Single Source Repository**: Single unified repository structure. No separate source code copies for demo and production.
2. **Containerized Execution Only**: All application execution, dependency installation, builds, unit/integration tests, database migrations, databases, and dev servers MUST run inside rootless Podman containers.
3. **Podman Machine Controls**:
   - Local Podman machine on macOS is managed via `podman machine start`.
   - Verified active rootless VM: `podman-machine-default` (`podman info` rootless = true).
   - The agent MUST NOT initialize, reset, remove, resize, reconfigure, or convert `podman-machine-default` to rootful mode.
4. **Image Tagging Standard**:
   - **Demo Builds**: Use image tag `latest-alpine` (fallback: `latest-slim`, then `latest`).
   - **Production Builds**: Use image tag `lts-alpine` (fallback: `lts-slim`, then `lts`).
5. **Container Runtime Standard**:
   - Prefer `node:20-alpine3.20` and `postgres:16-alpine` for all images unless dependency compatibility explicitly requires the lightest Debian-based image.
   - Never use `podman compose` or `docker compose` for local builds, tests, or execution.
   - Always run local builds, linting, type-checking, and tests inside disposable `podman run --rm` containers (or a single combined container).
   - Do not leave transient containers or images running; remove them immediately with `--rm` or targeted cleanup.
6. **Local Execution Standard**:
   - Use `podman run --rm` to create short-lived containers for builds/tests.
   - For local demo runtime, use `scripts/run-local.sh` which starts a database container and app container, both removable via `scripts/stop-local.sh` and resettable via `scripts/reset-local.sh`.
   - Local demo database and uploaded files reset to seeded state on demand; production does not auto-reset.
7. **Remote Execution Standard**:
   - VPS demo and production deployments use rootless Podman Quadlet files (`.container`, `.network`, `.volume`).
   - Join the existing Caddy reverse-proxy network (`caddy.network`) with a single bridge container per environment.
   - Internal app↔database traffic stays on a dedicated internal network (`lemans-remote-demo-net` or `lemans-remote-prod-net`).
   - Database ports are never published to host interfaces.

## Verified Execution Boundaries & Results

- **Local Demo Container**: `lemans-demo-app` listening on `127.0.0.1:3000` (`200 OK`).
- **Remote Demo Container**: `lemans-remote-demo-app` listening on `127.0.0.1:3002` behind Caddy (`200 OK`).
- **Remote Production Container**: `lemans-remote-prod-app` listening on `127.0.0.1:3003` behind Caddy (`200 OK`).
- **Database Isolation**: PostgreSQL containers run on internal bridge networks with 0 published host database ports.
- **Empirical Validation Documented**: [`docs/PHASE-2-RESULTS.md`](file:///Users/jk.deguzman/dev/lemans-bridge-dashboard/docs/PHASE-2-RESULTS.md), [`docs/PHASE-3-HANDOFF.md`](file:///Users/jk.deguzman/dev/lemans-bridge-dashboard/docs/PHASE-3-HANDOFF.md), and [`docs/REMOTE-DEMO-RESULTS.md`](file:///Users/jk.deguzman/dev/lemans-bridge-dashboard/docs/REMOTE-DEMO-RESULTS.md).

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
- **Review Mode**: Keep terminal execution in review/ask mode where the platform supports it.
