# Architecture

## Overview

This document describes the containerized architecture for the **Le Mans Operations & Job Cost Management System**. The workstation Docker Sandbox builds and validates committed source; the Linux VPS imports those images and runs the Quadlet systemd deployment.

> **Demo profile override (2026-08-09):** The demo build is intentionally
> authentication-free. It starts with a simulated `Enter as an Admin` splash,
> then defaults to the Admin simulated actor and provides a visible role switcher.
> Better Auth, session persistence, and protected-route
> behavior described elsewhere in this document belong to the future production
> profile and must not block the demo. Production is promoted from the validated
> demo source/image lineage; it is not a separately maintained codebase.

---

## Research and technical choices

Based on current 2026 containerization standards (Docker Sandboxes, Docker image build practices, Next.js 16 self-hosting, Go latest backend patterns, Podman Quadlet rootless units, sqlc, and goose):

- Next.js standalone output is the recommended self-hosting mode for Docker/Container deployments: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
- Go backend best practice is SQL-first data access with sqlc + goose and HTTP routing with Chi: https://docs.sqlc.dev, https://github.com/pressly/goose, https://github.com/go-chi/chi
- Podman Quadlet rootless user units live in `/home/jk/.config/containers/systemd/` on this VPS and are managed via `systemctl --user`: https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html
- Podman’s rootless Quadlet workflow uses `daemon-reload` and `systemctl --user start`; generated units should be verified rather than enabled directly: https://docs.podman.io/en/latest/markdown/podman-quadlet-basic-usage.7.html
- Docker Sandboxes provide an isolated microVM workspace with a private Docker engine for local agent and project execution: https://docs.docker.com/ai/sandboxes/
- Docker recommends `.dockerignore`, multi-stage builds, and cache-aware Dockerfiles: https://docs.docker.com/build/building/best-practices/

Specific project choices:

1. **Next.js Standalone Optimization**:
   - Next.js is configured with `output: 'standalone'` in `next.config.ts` to produce a minimal runtime image that still supports API routes and dynamic pages.
   - Multi-stage Dockerfile builds separate dependencies (`deps`), build (`builder`), and runtime (`runner`) stages.
   - Production images run under the unprivileged `node` user provided by the
     official Node base image; the Go runtime is a static binary on Alpine with
     BusyBox `wget` used by the reset job.
   - Telemetry disabled (`NEXT_TELEMETRY_DISABLED=1`).
2. **Go API Backend**:
   - All persistence, business logic, migrations, and S3 presigned URLs are owned by the Go API (`backend/`).
   - Built with `golang:alpine` (latest Go on latest Alpine); runtime image based on `alpine:latest`.
   - Chi router, sqlc-generated repository, `goose` migrations, structured logging via `log/slog`.
3. **Container Image Runtime Policy**:
   - **Web Base Image**: `node:lts-alpine` (tracks the Node.js Active LTS release).
   - **Go API Base Image**: `golang:alpine` (latest stable Go on latest Alpine).
   - **Database Image**: `postgres:alpine` (latest stable PostgreSQL on latest Alpine).
   - **Fallback**: lightest Debian-based image (`-slim`) only when dependency compatibility explicitly requires it.
4. **Container Image Tagging Policy**:
   - **Demo Builds**: Web `lemans-bridge-dashboard:demo-web`, Go API `lemans-bridge-dashboard-go:demo-go`.
   - **Production Builds**: Web `lemans-bridge-dashboard:prod-web`, Go API `lemans-bridge-dashboard-go:prod-go`.
5. **No Compose Mandate**:
   - Compose is not used.
   - Local validation and the local demo runtime use Docker containers inside
     the project Sandbox. Remote deployment transfers locally built images;
     the VPS imports them and performs runtime activation only.
6. **Declarative Podman Quadlet Systemd Management**:
   - Production containers are managed declaratively using Quadlet files (`.container`, `.volume`, `.network`) placed in `/home/jk/.config/containers/systemd/` on the VPS.
   - Systemd user lingering is a remote operator prerequisite
     (`loginctl enable-linger <user>`) to keep services active across reboots.
   - Observability via structured JSON logging to `stdout`/`stderr` collected by systemd journal (`journalctl --user -u <service>`) and `podman logs`.

---

## Architecture: Next.js 16, Go API, and PostgreSQL

### Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PROJECT DOCKER SANDBOX (macOS) / REMOTE LINUX HOST                                  │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ DOCKER NETWORK LOCALLY / PODMAN NETWORK REMOTELY (`lemans-net`)                 │  │
│  │                                                                                  │  │
│  │   ┌───────────────────────────────────────────────────────────────────────────┐  │  │
│  │   │ WEB CONTAINER (`lemans-app`)                                              │  │  │
│  │   │ - Framework: Next.js 16 App Router (`node:lts-alpine` standalone)            │  │  │
│  │   │ - Role simulation, API routes for attachments, server-side API client      │  │  │
│  │   │ - Image Tag: demo (`demo-web`), prod (`prod-web`)                        │  │  │
│  │   │ - Exposed Port: 127.0.0.1:3000 (Loopback Only)                            │  │  │
│  │   └─────────────────────────────────────┬─────────────────────────────────────┘  │  │
│  │                                         │                                        │  │
│  │              HTTP (internal net)        │ HTTP over internal bridge (5432)       │  │
│  │                                         ▼                                        │  │
│  │   ┌───────────────────────────────────────────────────────────────────────────┐  │  │
│  │   │ GO API CONTAINER (`lemans-go`)                                            │  │  │
│  │   │ - Latest Go (`golang:alpine`), Chi router, sqlc, goose, slog              │  │  │
│  │   │ - Business logic, migrations, presigned B2 URLs                            │  │  │
│  │   │ - Image Tag: demo (`demo-go`), prod (`prod-go`)                          │  │  │
│  │   │ - Exposed Port: internal only                                              │  │  │
│  │   └─────────────────────────────────────┬─────────────────────────────────────┘  │  │
│  │                                         │                                        │  │
│  │                                         │ PostgreSQL (internal port 5432)        │  │
│  │                                         ▼                                        │  │
│  │   ┌───────────────────────────────────────────────────────────────────────────┐  │  │
   │  │   │ DATABASE CONTAINER (`lemans-db`)                                         │  │  │
   │  │   │ - Engine: PostgreSQL (`postgres:alpine`)                                  │  │  │
   │  │   │ - Image Tag: `postgres:alpine`                                            │  │  │
   │  │   │ - Volume: Named Volume (`lemans-db-data`)                                 │  │  │
   │  │   │ - Published Ports: NONE (0 Exposed Ports to Host)                        │  │  │
│  │   └───────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Remote Caddy Pattern

For VPS demo and production, the Next.js web container joins both the public
`caddy.network` Quadlet reference (which joins the `caddy` Podman network shared
with the existing rootless Caddy reverse proxy) and the
internal app network, allowing Caddy to route traffic to the web container by
name without publishing the web port to the public interface. The Go API
container is attached only to the internal network.

---

## Security, observability, and recovery

### Security Baseline

- **Zero Exposed Database Ports**: Database container listens exclusively on container-internal bridge network (`lemans-net`). Host cannot access port 5432 directly.
- **Loopback App Port Binding**: Application container binds exclusively to `127.0.0.1:3000` locally; on VPS, only the Caddy bridge container binds the public proxy port.
- **Unprivileged Container Execution**: Application process runs as non-root `nextjs` user (UID 1001).
- **No Compose**: Validation uses disposable Docker `run --rm` containers
  inside the Sandbox; the local demo uses named Docker containers and remote
  environments use Quadlet units. No container socket or compose socket mounts
  are allowed.

### Observability & Logging

- **Structured JSON Logging**: Application outputs structured JSON logs to `stdout`/`stderr`.
- **Podman Systemd Journaling**: Collected via `journalctl --user -u <service>` or `podman logs -f <container_name>`.

### Authentication & Authorization Layer

- **Framework**: Demo uses no real authentication and may show a simulated
  `Enter as an Admin` splash before the Admin actor. Role simulation uses the
  `lemans-demo-role` cookie and `X-Demo-Role` header. Production will use a real
  auth layer (separate planning).
- **Role Enforcement**: Project-specific role matrix in `src/lib/roles.ts`, validated server-side by the Go API using `internal/actor` and `internal/policy`.
- **Middleware**: None required for the demo profile.

### File Attachment Layer

- **Object Store**: Backblaze B2 via S3-compatible API (see ADR-0004).
- **SDK**: AWS SDK for Go v2.
- **Bucket and prefixes**: Private bucket `bridge-ph`; demo objects use the
  `lemans/demo` prefix and production objects use `lemans`.
- **Access Pattern**: The Go API issues short-lived presigned `PutObject` and
  `GetObject` URLs. Relative attachment keys are stored in PostgreSQL; the
  configured profile prefix is applied exactly once when signing each request.
- **Metadata Registry**: PostgreSQL `attachments` table links S3 object keys to Job Orders, DCS payments, supplier invoices, and OPEX requests.

### Backup & Disaster Recovery

- **Database Backup**: Daily containerized `pg_dump` execution stores compressed
  SQL backups in `s3://bridge-ph/lemans/backups/db/` (production only).
- **Object Storage Backup**: Backblaze B2 bucket versioning and lifecycle rules managed in Backblaze console; references preserved in PostgreSQL.
- **Restore Protocol**: One-line container execution: `podman exec -i lemans-db psql -U postgres lemans_db < backup.sql`.
- **Demo Reset**: Local demo resets on demand. The public remote demo resets
  every 30 minutes through a rootless user-level systemd timer, with a manual
  operator trigger also available. Both restore the DB seed and clear uploaded
  demo attachments; production never auto-resets.
