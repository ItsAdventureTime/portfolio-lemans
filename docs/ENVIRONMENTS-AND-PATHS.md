# Environment Matrix & Remote Quadlet Path Specifications

## 1. Overview & Single Repository Mandate

All application logic, container build files, database schemas, and Quadlet definitions reside in a **single unified source repository**. Environment isolation is strictly maintained through environment files, container naming, database volume identifiers, network namespaces, and distinct Quadlet systemd unit configurations.

- **Remote GitHub Repository**: `https://github.com/ItsAdventureTime/bridge-lemans`
- **SSH Target**: `git@github.com:ItsAdventureTime/bridge-lemans.git`

## 2. Four Isolated Target Environments

| Environment Parameter   | 1. `local-demo`                                    | 2. `local-prodlike`                                | 3. `remote-demo`                     | 4. `remote-production`               |
| ----------------------- | -------------------------------------------------- | -------------------------------------------------- | ------------------------------------ | ------------------------------------ |
| **Status**              | **Verified (200 OK)**                              | **Verified (200 OK)**                              | **Verified (200 OK)**                | **Prepared (Quadlets)**              |
| **Target Host**         | macOS (Apple Silicon arm64)                        | macOS (Apple Silicon arm64)                        | Remote Linux Server                  | Remote Linux Server                  |
| **Podman Command**      | `podman machine start` + `podman run`              | `podman machine start` + `podman run`              | Systemd User Quadlet                 | Systemd User Quadlet                 |
| **Image Tag Standard**  | `latest-alpine`                                    | `lts-alpine`                                       | `latest-alpine`                      | `lts-alpine`                         |
| **Base Image**          | `node:20-alpine3.20`                               | `node:20-alpine3.20`                               | `node:20-alpine3.20`                 | `node:20-alpine3.20`                 |
| **Database Image**      | `postgres:16-alpine`                               | `postgres:16-alpine`                               | `postgres:16-alpine`                 | `postgres:16-alpine`                 |
| **Source Mounting**     | **Disposable `--rm` containers + named DB volume** | **Disposable `--rm` containers + named DB volume** | **Immutable Image** (No bind mounts) | **Immutable Image** (No bind mounts) |
| **App Port Binding**    | `127.0.0.1:3000`                                   | `127.0.0.1:3001` (build/verify only)               | `127.0.0.1:3002` (Behind Proxy)      | `127.0.0.1:3003` (Behind Proxy)      |
| **DB Port Binding**     | `NONE` (Internal Podman Net)                       | `NONE` (Internal Podman Net)                       | `NONE` (Internal Podman Net)         | `NONE` (Internal Podman Net)         |
| **Container Name**      | `lemans-demo-app`                                  | `lemans-prodlike-app`                              | `lemans-remote-demo-app`             | `lemans-remote-prod-app`             |
| **DB Volume Name**      | `lemans-demo-db-data`                              | `lemans-prodlike-db-data`                          | `lemans-remote-demo-db-data`         | `lemans-remote-prod-db-data`         |
| **Podman Network**      | `lemans-demo-net`                                  | `lemans-prodlike-net`                              | `lemans-remote-demo-net`             | `lemans-remote-prod-net`             |
| **Better Auth Secret**  | `BETTER_AUTH_SECRET` (dev value, injected)         | `BETTER_AUTH_SECRET` (prod value, injected)        | `BETTER_AUTH_SECRET` (injected)      | `BETTER_AUTH_SECRET` (injected)      |
| **Backblaze B2 Bucket** | `lemans-demo-attachments`                          | `lemans-prodlike-attachments`                      | `lemans-remote-demo-attachments`     | `lemans-remote-prod-attachments`     |
| **Reset Policy**        | Manual via `scripts/reset-local.sh`                | Manual only                                        | Auto every 30 min + manual           | None (persistent)                    |

## 3. Local Quick Reference

```bash
export PATH="/opt/podman/bin:$PATH"
podman machine start

# Run local demo (database + app, loopback only)
./scripts/run-local.sh

# Stop local demo
./scripts/stop-local.sh

# Reset local demo to seeded state
./scripts/reset-local.sh

# Build images
./scripts/build.sh demo   # tag: latest-alpine
./scripts/build.sh prod   # tag: lts-alpine

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

The existing rootless Caddy quadlet already exposes the public HTTP/HTTPS ports. Each Le Mans environment uses a lightweight **single Caddy bridge container** that joins both the internal app network and `caddy.network`, allowing Caddy to reverse-proxy to the app container by container name without exposing the app port publicly.

| Environment       | Bridge Container Name      | Joins Networks                             |
| ----------------- | -------------------------- | ------------------------------------------ |
| Remote Demo       | `lemans-demo-caddy-bridge` | `caddy.network` + `lemans-remote-demo-net` |
| Remote Production | `lemans-prod-caddy-bridge` | `caddy.network` + `lemans-remote-prod-net` |

## 6. Required Secrets / Environment Variables

Values are injected at container runtime via `EnvironmentFile=` in Quadlet files or `--env-file` / `-e` in `podman run` commands. They are **never committed to source control**.

| Variable               | Purpose                                                                         | Provider                            |
| ---------------------- | ------------------------------------------------------------------------------- | ----------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string                                                    | Container env / generated by script |
| `BETTER_AUTH_SECRET`   | Better Auth token signing secret                                                | Auto-generated or env file          |
| `BETTER_AUTH_URL`      | Canonical app URL for Better Auth callbacks                                     | Per-environment URL                 |
| `B2_ENDPOINT`          | Backblaze S3-compatible endpoint, e.g. `https://s3.us-west-004.backblazeb2.com` | Prompted or env file                |
| `B2_REGION`            | Backblaze region segment, e.g. `us-west-004`                                    | Prompted or env file                |
| `B2_ACCESS_KEY_ID`     | Backblaze application key ID                                                    | Prompted at deploy time             |
| `B2_SECRET_ACCESS_KEY` | Backblaze application key secret                                                | Prompted at deploy time             |
| `B2_BUCKET_NAME`       | Target bucket name per environment                                              | Per-environment env file            |

## 7. Deployment Scripts

| Script                             | Purpose                                              |
| ---------------------------------- | ---------------------------------------------------- |
| `scripts/build.sh`                 | Build local demo/prod image                          |
| `scripts/build-multiarch.sh`       | Build and push multi-arch images to registry         |
| `scripts/run-local.sh`             | Start local DB + app with `--rm` containers          |
| `scripts/stop-local.sh`            | Stop local DB + app                                  |
| `scripts/reset-local.sh`           | Reset local DB volume to empty / seeded state        |
| `scripts/verify-local.sh`          | Run format/lint/type-check/tests in `--rm` container |
| `scripts/verify-vertical-slice.sh` | Full local verification incl. HTTP health checks     |
| `scripts/deploy-remote-demo.sh`    | Deploy demo Quadlets to VPS and start services       |
| `scripts/deploy-remote-prod.sh`    | Deploy production Quadlets to VPS and start services |

## 8. Architecture Compliance

- All application execution runs inside rootless Podman containers.
- `podman compose` / `docker compose` are **not used** anywhere.
- Database ports are never published to host interfaces.
- Production-like and remote environments use immutable images (no source bind mounts).
- Local builds/tests run in disposable `podman run --rm` containers.
- Quadlets place applications behind the upstream reverse proxy on loopback-only ports.
- Remote demo auto-resets every 30 minutes and on manual trigger.
- Production persists data and runs daily backups to Backblaze B2.

For full remote install, backup, restore, and rollback procedures, see `docs/REMOTE-OPERATIONS.md`.
