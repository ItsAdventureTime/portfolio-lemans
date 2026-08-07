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
   - **Demo Builds**: Use image tag `latest-alpine` or `latest-slim` (fallback: `latest`).
   - **Production Builds**: Use image tag `lts-alpine` or `lts-slim` (fallback: `lts`).

## Verified Phase 2 Execution Boundaries & Results
- **Local Demo Container**: `lemans-demo-app` listening on `127.0.0.1:3000` (`200 OK`).
- **Local Prodlike Container**: `lemans-prodlike-app` listening on `127.0.0.1:3001` (`200 OK`).
- **Database Isolation**: PostgreSQL containers `lemans-demo-db` and `lemans-prodlike-db` run on internal bridge networks with 0 published host database ports.
- **Empirical Validation Documented**: [`docs/PHASE-2-RESULTS.md`](file:///Users/jk.deguzman/dev/lemans-bridge-dashboard/docs/PHASE-2-RESULTS.md) and [`docs/PHASE-3-HANDOFF.md`](file:///Users/jk.deguzman/dev/lemans-bridge-dashboard/docs/PHASE-3-HANDOFF.md).

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
