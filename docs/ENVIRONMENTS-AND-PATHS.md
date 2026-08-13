# Environments and paths

## Repository and environment model

The repository holds the application, container build files, database schemas, and Quadlet definitions. Profile-scoped runtime variables, container names, database volumes, networks, and Quadlet units keep each environment separate. Remote credentials are written as `Environment=` entries in mode-`600` Quadlet files; external `.env` files are not part of this project.

- **Remote GitHub Repository**: `https://github.com/ItsAdventureTime/bridge-lemans`
- **Transport Protocol**: HTTPS (`https://github.com/ItsAdventureTime/bridge-lemans.git`) authenticated by default (SSH deprecated)
- **Git & Remote Workflow**: Work remains on `main`; use the official GitHub CLI
  (`gh`) over HTTPS for remote inspection, synchronization, and branch
  administration. Do not create feature branches or delete `main`.

### Demo profile

`local-demo` and `remote-demo` are demonstration profiles, not production
security environments. The current demo opens without authentication as the
simulated `Enter as an Admin` splash, then enters as the Admin simulated actor
and supports visible role switching. The demo uses a
Go backend API for all persistence and attachment storage. Authentication
secrets are production-profile planning values and are not required to run
the demo.

The current deployment target is remote-only for the demo:

- No persistent `local-demo` deployment is maintained.
- Disposable local Podman execution is an optional validation exception only;
  remote deployment never builds, compiles, or runs the app locally.
- Remote Quadlets install under
  `/home/jk/.config/containers/systemd/bridge-ph/lemans-demo`.
- Remote demo data/config/database boundary is
  `/home/jk/bridge-ph/lemans-demo`.
- Public URL is `https://delegateops.business/lemans/demo`.
- The two-stage deployment workflow and automated wrapper are defined in
  [`REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md`](./REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md).

## Environment matrix

| Environment Parameter   | 1. `local-demo`                                    | 2. `local-prodlike`                                | 3. `remote-demo`                                   | 4. `remote-production`                             |
| ----------------------- | -------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| **Status**              | **Verified (200 OK)**                              | **Verified (200 OK)**                              | **Prepared (authorization-gated)**                 | **Prepared (Quadlets)**                            |
| **Target Host**         | macOS (Apple Silicon arm64)                        | macOS (Apple Silicon arm64)                        | Remote Linux Server                                | Remote Linux Server                                |
| **Podman Command**      | `podman machine start` + `podman run`              | `podman machine start` + `podman run`              | Systemd User Quadlet                               | Systemd User Quadlet                               |
| **Web Image**           | `lemans-bridge-dashboard:demo-web`                 | `lemans-bridge-dashboard:prod-web`                 | `localhost/...:demo-web`                           | `localhost/...:prod-web`                           |
| **Go API Image**        | `lemans-bridge-dashboard-go:demo-go`               | `lemans-bridge-dashboard-go:prod-go`               | `localhost/...:demo-go`                            | `localhost/...:prod-go`                            |
| **Next.js Base Image**  | `node:lts-alpine`                                  | `node:lts-alpine`                                  | `node:lts-alpine`                                  | `node:lts-alpine`                                  |
| **Go Base Image**       | `golang:alpine` / `alpine:latest`                  | `golang:alpine` / `alpine:latest`                  | `golang:alpine` / `alpine:latest`                  | `golang:alpine` / `alpine:latest`                  |
| **Database Image**      | `postgres:alpine`                                  | `postgres:alpine`                                  | `postgres:alpine`                                  | `postgres:alpine`                                  |
| **Source Mounting**     | **Disposable `--rm` containers + named DB volume** | **Disposable `--rm` containers + named DB volume** | **Synced `current` source; no runtime bind mount** | **Synced `current` source; no runtime bind mount** |
| **Web Port Binding**    | `127.0.0.1:3000`                                   | `127.0.0.1:3001` (build/verify only)               | `127.0.0.1:3002` (Behind Proxy)                    | `127.0.0.1:3003` (Behind Proxy)                    |
| **Go API Port Binding** | NONE (internal net)                                | NONE (internal net)                                | NONE (internal net)                                | NONE (internal net)                                |
| **DB Port Binding**     | `NONE` (Internal Podman Net)                       | `NONE` (Internal Podman Net)                       | `NONE` (Internal Podman Net)                       | `NONE` (Internal Podman Net)                       |
| **Web Container Name**  | `lemans-demo-app`                                  | `lemans-prodlike-app`                              | `lemans-demo-app`                                  | `lemans-prod-app`                                  |
| **Go Container Name**   | `lemans-demo-go`                                   | `lemans-prodlike-go`                               | `lemans-demo-go`                                   | `lemans-prod-go`                                   |
| **DB Volume Name**      | `lemans-demo-db-data`                              | `lemans-prodlike-db-data`                          | `lemans-demo-db-data`                              | `lemans-prod-db-data`                              |
| **Podman Network**      | `lemans-demo-net`                                  | `lemans-prodlike-net`                              | `lemans-demo-net`                                  | `lemans-prod-net`                                  |
| **Auth Secret**         | Not used in demo (production-only planning value)  | Production-only                                    | Not used in demo                                   | Production-only                                    |
| **Backblaze B2 Bucket** | `bridge-ph` (`lemans/demo`)                        | `bridge-ph` (`lemans`)                             | `bridge-ph` (`lemans/demo`)                        | `bridge-ph` (`lemans`)                             |
| **Reset Policy**        | Manual via `scripts/reset-local.sh`                | Manual only                                        | Every 30 minutes plus manual trigger               | None (persistent)                                  |

## Run local validation

```bash
export PATH="/opt/podman/bin:$PATH"
podman machine start

# Run local demo (database + Go API + web, loopback only)
./scripts/run-local.sh

# Stop local demo
./scripts/stop-local.sh

# Reset local demo to seeded state
./scripts/reset-local.sh

# Optional local validation build (not used by remote deployment)
./scripts/build.sh demo   # demo-web + demo-go
./scripts/build.sh prod   # prod-web + prod-go

# Verify
./scripts/verify-vertical-slice.sh
```

## Remote directories and Quadlet paths

### Remote Demo Environment

- **Remote Demo Application Build Path**: `/home/jk/bridge-ph/lemans-demo`
- **Remote Demo Systemd Quadlet Path**: `/home/jk/.config/containers/systemd/bridge-ph/lemans-demo`
- **Remote Demo Backblaze Bucket**: `bridge-ph`, prefix `lemans/demo`
- **Reset Service**: `/home/jk/.config/systemd/user/lemans-demo-reset.service`
- **Reset Timer**: `/home/jk/.config/systemd/user/lemans-demo-reset.timer`

### Remote Production Environment

- **Remote Production Application Build Path**: `/home/jk/bridge-ph/lemans`
- **Remote Production Systemd Quadlet Path**: `/home/jk/.config/containers/systemd/bridge-ph/lemans`
- **Remote Production Backblaze Bucket**: `bridge-ph`, prefix `lemans`
- **Backup Service**: `/home/jk/.config/systemd/user/lemans-backup.service`
- **Backup Timer**: `/home/jk/.config/systemd/user/lemans-backup.timer`

## 5. Caddy Reverse Proxy Integration

The existing rootless Caddy Quadlet already exposes the public HTTP/HTTPS ports.
Its `caddy.network` file sets `NetworkName=caddy`. Each Le Mans environment
therefore retains `Network=caddy.network` in its Quadlet while joining the
actual `caddy` Podman network, allowing Caddy to reverse-proxy to the web
container by container name without exposing the web port publicly. The Go API
container is attached only to the internal network.

The demo route is tracked in
[`caddy/lemans-demo.handlers.Caddyfile`](../caddy/lemans-demo.handlers.Caddyfile).
An authorized demo deployment inserts it directly before the DelegateOps static
fallback in `/home/jk/caddy/conf/Caddyfile`, removes any indented legacy import,
formats and validates the complete Caddyfile, and gracefully reloads the
rootless Caddy container. It does not create backup files. The shared
`caddy.container` remains on the shared edge network; it does not join an
environment's internal network.

| Environment       | Web Container Networks      | Go Container Networks | DB Container Networks |
| ----------------- | --------------------------- | --------------------- | --------------------- |
| Remote Demo       | `caddy` + `lemans-demo-net` | `lemans-demo-net`     | `lemans-demo-net`     |
| Remote Production | `caddy` + `lemans-prod-net` | `lemans-prod-net`     | `lemans-prod-net`     |

## 6. Required Secrets / Environment Variables

Values are injected at container runtime through `Environment=` entries in the
generated Quadlet `.container` files or explicit `-e` flags in disposable
`podman run` commands. Remote runtime `.container` files containing credentials
are written with mode `600` and are never committed to source control. The
deployment no longer creates external `.env` files.

| Variable               | Purpose                                                                                         | Provider                       |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------ |
| `DATABASE_URL`         | PostgreSQL connection string                                                                    | Generated `Environment=` entry |
| `API_BASE_URL`         | Internal URL of the Go API container for the Next.js server (e.g. `http://lemans-demo-go:8080`) | Container env / Quadlet        |
| `B2_ENDPOINT`          | Backblaze S3-compatible endpoint, e.g. `https://s3.us-west-004.backblazeb2.com`                 | Quadlet `Environment=` entry   |
| `B2_REGION`            | Backblaze region segment, e.g. `us-west-004`                                                    | Quadlet `Environment=` entry   |
| `B2_ACCESS_KEY_ID`     | Backblaze application key ID                                                                    | Generated `Environment=` entry |
| `B2_SECRET_ACCESS_KEY` | Backblaze application key secret                                                                | Generated `Environment=` entry |
| `B2_BUCKET_NAME`       | Target bucket name per environment                                                              | Quadlet `Environment=` entry   |
| `B2_KEY_PREFIX`        | Profile object-key prefix (`lemans/demo` demo; `lemans` production)                             | Quadlet `Environment=` entry   |

## 7. Deployment Scripts

| Script                             | Purpose                                                       |
| ---------------------------------- | ------------------------------------------------------------- |
| `scripts/build.sh`                 | Optional local validation image build                         |
| `scripts/build-multiarch.sh`       | Build and push multi-arch images to registry                  |
| `scripts/run-local.sh`             | Start local DB + Go API + web with `--rm` containers          |
| `scripts/stop-local.sh`            | Stop local DB + Go API + web                                  |
| `scripts/reset-local.sh`           | Reset local DB volume to empty / seeded state                 |
| `scripts/verify-local.sh`          | Run format/lint/type-check/tests in `--rm` container          |
| `scripts/verify-vertical-slice.sh` | Full local verification incl. HTTP health checks              |
| `scripts/deploy-remote-profile.sh` | Sync source and optionally activate on the VPS                |
| `scripts/sync-remote-demo.sh`      | Demo source sync; prints one no-flag activation command       |
| `scripts/sync-remote-prod.sh`      | Production source sync; prints one no-flag activation command |
| `scripts/activate-remote-demo.sh`  | VPS-side demo build, activation, and verification             |
| `scripts/activate-remote-prod.sh`  | VPS-side production build, activation, and verification       |
| `scripts/deploy-remote-demo.sh`    | Automated demo sync + activation wrapper                      |
| `scripts/deploy-remote-prod.sh`    | Automated production sync + activation wrapper                |
| `scripts/configure-remote-*.sh`    | One-time macOS Keychain setup for remote profiles             |

## 8. Official Guidance

- [Next.js 16 self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Next.js `output: 'standalone'`](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Podman Quadlet rootless units](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html)
- [Podman Quadlet basic usage](https://docs.podman.io/en/latest/markdown/podman-quadlet-basic-usage.7.html)
- [Caddy command line (`fmt`, `validate`, and `reload`)](https://caddyserver.com/docs/command-line)
- [Caddy zero-downtime config reloads](https://caddyserver.com/docs/getting-started)
- [systemd `loginctl` linger](https://www.freedesktop.org/software/systemd/man/252/loginctl.html)
- [goose migrations](https://github.com/pressly/goose)
- [sqlc documentation](https://docs.sqlc.dev)

## 9. Architecture Compliance

- All application execution runs inside rootless Podman containers.
- `podman compose` / `docker compose` are **not used** anywhere.
- Database ports are never published to host interfaces.
- Production-like and remote environments use immutable images (no source bind mounts).
- Local builds/tests run in disposable `podman run --rm` containers.
- Quadlets place applications behind the upstream reverse proxy on loopback-only ports.
- Remote demo resets every 30 minutes through its rootless user timer; an
  explicit manual reset remains available. `RESET=true` controls deployment
  seeding/reset behavior and does not replace the scheduled timer.
- Production persists data and runs daily backups to Backblaze B2.

For full remote install, backup, restore, and rollback procedures, see `docs/REMOTE-OPERATIONS.md`.
