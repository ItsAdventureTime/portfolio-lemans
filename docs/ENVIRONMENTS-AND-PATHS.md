# Environment Matrix & Remote Quadlet Path Specifications

## 1. Overview & Single Repository Mandate

All application logic, container build files, database schemas, and Quadlet definitions reside in a **single unified source repository**. Environment isolation is strictly maintained through environment files, container naming, database volume identifiers, network namespaces, and distinct Quadlet systemd unit configurations.

- **Remote GitHub Repository**: `https://github.com/ItsAdventureTime/bridge-lemans`
- **Transport Protocol**: HTTPS (`https://github.com/ItsAdventureTime/bridge-lemans.git`) authenticated by default (SSH deprecated)
- **Git & Remote Workflow**: Local `git` for local commits; GitHub official CLI (`gh`) for remote commits and remote operations.

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
- Disposable local Podman execution remains permitted for build, compile, and
  verification tasks.
- Remote Quadlets install under
  `/home/jk/.config/containers/systemd/bridge-ph/lemans-demo`.
- Remote demo data/config/database boundary is
  `/home/jk/bridge-ph/lemans-demo`.
- Public URL is `https://delegateops.business/lemans/demo`.
- The single-command deployment contract is defined in
  [`REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md`](./REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md).

## 2. Four Isolated Target Environments

| Environment Parameter   | 1. `local-demo`                                    | 2. `local-prodlike`                                | 3. `remote-demo`                     | 4. `remote-production`               |
| ----------------------- | -------------------------------------------------- | -------------------------------------------------- | ------------------------------------ | ------------------------------------ |
| **Status**              | **Verified (200 OK)**                              | **Verified (200 OK)**                              | **Verified (200 OK)**                | **Prepared (Quadlets)**              |
| **Target Host**         | macOS (Apple Silicon arm64)                        | macOS (Apple Silicon arm64)                        | Remote Linux Server                  | Remote Linux Server                  |
| **Podman Command**      | `podman machine start` + `podman run`              | `podman machine start` + `podman run`              | Systemd User Quadlet                 | Systemd User Quadlet                 |
| **Web Image**           | `lemans-bridge-dashboard:demo-web`                 | `lemans-bridge-dashboard:prod-web`                 | `lemans-bridge-dashboard:demo-web`   | `lemans-bridge-dashboard:prod-web`   |
| **Go API Image**        | `lemans-bridge-dashboard-go:demo-go`               | `lemans-bridge-dashboard-go:prod-go`               | `lemans-bridge-dashboard-go:demo-go` | `lemans-bridge-dashboard-go:prod-go` |
| **Next.js Base Image**  | `node:lts-alpine`                                  | `node:lts-alpine`                                  | `node:lts-alpine`                    | `node:lts-alpine`                    |
| **Go Base Image**       | `golang:alpine` / `alpine:latest`                  | `golang:alpine` / `alpine:latest`                  | `golang:alpine` / `alpine:latest`    | `golang:alpine` / `alpine:latest`    |
| **Database Image**      | `postgres:alpine`                                  | `postgres:alpine`                                  | `postgres:alpine`                    | `postgres:alpine`                    |
| **Source Mounting**     | **Disposable `--rm` containers + named DB volume** | **Disposable `--rm` containers + named DB volume** | **Immutable Image** (No bind mounts) | **Immutable Image** (No bind mounts) |
| **Web Port Binding**    | `127.0.0.1:3000`                                   | `127.0.0.1:3001` (build/verify only)               | `127.0.0.1:3002` (Behind Proxy)      | `127.0.0.1:3003` (Behind Proxy)      |
| **Go API Port Binding** | NONE (internal net)                                | NONE (internal net)                                | NONE (internal net)                  | NONE (internal net)                  |
| **DB Port Binding**     | `NONE` (Internal Podman Net)                       | `NONE` (Internal Podman Net)                       | `NONE` (Internal Podman Net)         | `NONE` (Internal Podman Net)         |
| **Web Container Name**  | `lemans-demo-app`                                  | `lemans-prodlike-app`                              | `lemans-demo-app`                    | `lemans-prod-app`                    |
| **Go Container Name**   | `lemans-demo-go`                                   | `lemans-prodlike-go`                               | `lemans-demo-go`                     | `lemans-prod-go`                     |
| **DB Volume Name**      | `lemans-demo-db-data`                              | `lemans-prodlike-db-data`                          | `lemans-demo-db-data`                | `lemans-prod-db-data`                |
| **Podman Network**      | `lemans-demo-net`                                  | `lemans-prodlike-net`                              | `lemans-demo-net`                    | `lemans-prod-net`                    |
| **Auth Secret**         | Not used in demo (production-only planning value)  | Production-only                                    | Not used in demo                     | Production-only                      |
| **Backblaze B2 Bucket** | `lemans-demo-attachments`                          | `lemans-prodlike-attachments`                      | `lemans-remote-demo-attachments`     | `lemans-remote-prod-attachments`     |
| **Reset Policy**        | Manual via `scripts/reset-local.sh`                | Manual only                                        | Explicit `RESET=true` only           | None (persistent)                    |

## 3. Local Quick Reference

```bash
export PATH="/opt/podman/bin:$PATH"
podman machine start

# Run local demo (database + Go API + web, loopback only)
./scripts/run-local.sh

# Stop local demo
./scripts/stop-local.sh

# Reset local demo to seeded state
./scripts/reset-local.sh

# Build images
./scripts/build.sh demo   # demo-web + demo-go
./scripts/build.sh prod   # prod-web + prod-go

# Verify
./scripts/verify-vertical-slice.sh
```

## 4. Remote Directory & Systemd Quadlet Paths

### Remote Demo Environment

- **Remote Demo Application Build Path**: `/home/jk/bridge-ph/lemans-demo`
- **Remote Demo Systemd Quadlet Path**: `~/.config/containers/systemd/bridge-ph/lemans-demo`
- **Remote Demo Backblaze Bucket**: `lemans-remote-demo-attachments`
- **Reset Service**: `~/.config/systemd/user/lemans-demo-reset.service`
- **Reset Timer**: `~/.config/systemd/user/lemans-demo-reset.timer`

### Remote Production Environment

- **Remote Production Application Build Path**: `/home/jk/bridge-ph/lemans`
- **Remote Production Systemd Quadlet Path**: `~/.config/containers/systemd/bridge-ph/lemans`
- **Remote Production Backblaze Bucket**: `lemans-remote-prod-attachments`
- **Backup Service**: `~/.config/systemd/user/lemans-backup.service`
- **Backup Timer**: `~/.config/systemd/user/lemans-backup.timer`

## 5. Caddy Reverse Proxy Integration

The existing rootless Caddy quadlet already exposes the public HTTP/HTTPS ports. Each Le Mans environment attaches the Next.js web container to both the internal app network (`lemans-*-net`) and `caddy.network`, allowing Caddy to reverse-proxy to the web container by container name without exposing the web port publicly. The Go API container is attached only to the internal network.

| Environment       | Web Container Networks              | Go Container Networks | DB Container Networks |
| ----------------- | ----------------------------------- | --------------------- | --------------------- |
| Remote Demo       | `caddy.network` + `lemans-demo-net` | `lemans-demo-net`     | `lemans-demo-net`     |
| Remote Production | `caddy.network` + `lemans-prod-net` | `lemans-prod-net`     | `lemans-prod-net`     |

## 6. Required Secrets / Environment Variables

Values are injected at container runtime via `EnvironmentFile=` in Quadlet files or `--env-file` / `-e` in `podman run` commands. They are **never committed to source control**.

| Variable               | Purpose                                                                                         | Provider                            |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string                                                                    | Container env / generated by script |
| `API_BASE_URL`         | Internal URL of the Go API container for the Next.js server (e.g. `http://lemans-demo-go:8080`) | Container env / Quadlet             |
| `B2_ENDPOINT`          | Backblaze S3-compatible endpoint, e.g. `https://s3.us-west-004.backblazeb2.com`                 | Prompted or env file                |
| `B2_REGION`            | Backblaze region segment, e.g. `us-west-004`                                                    | Prompted or env file                |
| `B2_ACCESS_KEY_ID`     | Backblaze application key ID                                                                    | Prompted at deploy time             |
| `B2_SECRET_ACCESS_KEY` | Backblaze application key secret                                                                | Prompted at deploy time             |
| `B2_BUCKET_NAME`       | Target bucket name per environment                                                              | Per-environment env file            |

## 7. Deployment Scripts

| Script                             | Purpose                                              |
| ---------------------------------- | ---------------------------------------------------- |
| `scripts/build.sh`                 | Build local demo/prod image                          |
| `scripts/build-multiarch.sh`       | Build and push multi-arch images to registry         |
| `scripts/run-local.sh`             | Start local DB + Go API + web with `--rm` containers |
| `scripts/stop-local.sh`            | Stop local DB + Go API + web                         |
| `scripts/reset-local.sh`           | Reset local DB volume to empty / seeded state        |
| `scripts/verify-local.sh`          | Run format/lint/type-check/tests in `--rm` container |
| `scripts/verify-vertical-slice.sh` | Full local verification incl. HTTP health checks     |
| `scripts/deploy-remote-demo.sh`    | Deploy demo Quadlets to VPS and start services       |
| `scripts/deploy-remote-prod.sh`    | Deploy production Quadlets to VPS and start services |

## 8. Official Guidance

- [Next.js 16 self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Next.js `output: 'standalone'`](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output)
- [Podman Quadlet rootless units](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html)
- [goose migrations](https://github.com/pressly/goose)
- [sqlc documentation](https://docs.sqlc.dev)

## 9. Architecture Compliance

- All application execution runs inside rootless Podman containers.
- `podman compose` / `docker compose` are **not used** anywhere.
- Database ports are never published to host interfaces.
- Production-like and remote environments use immutable images (no source bind mounts).
- Local builds/tests run in disposable `podman run --rm` containers.
- Quadlets place applications behind the upstream reverse proxy on loopback-only ports.
- Remote demo resets only when explicitly requested with `RESET=true`.
- Production persists data and runs daily backups to Backblaze B2.

For full remote install, backup, restore, and rollback procedures, see `docs/REMOTE-OPERATIONS.md`.
