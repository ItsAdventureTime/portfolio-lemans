# Le Mans Operations & Job Cost Management System - Architecture Specification

## 1. Executive Summary & Strategy

This document specifies the containerized fullstack architecture for the **Le Mans Operations & Job Cost Management System**. All proposed solutions comply strictly with the project's **Rootless Podman Containerization Mandate** (local Apple Silicon macOS development via `podman machine start` + remote Linux Quadlet systemd deployment).

> **Demo profile override (2026-08-09):** The demo build is intentionally
> authentication-free. It defaults to the Admin simulated actor and provides a
> visible role switcher. Better Auth, session persistence, and protected-route
> behavior described elsewhere in this document belong to the future production
> profile and must not block the demo. Production is promoted from the validated
> demo source/image lineage; it is not a separately maintained codebase.

---

## 2. Industry Research Grounding & Best Practices

Based on current 2026 containerization standards for Node.js/Next.js, Go, and Podman Quadlet:

1. **Next.js Standalone Optimization**:
   - Next.js is configured with `output: 'standalone'` in `next.config.js` to preserve API routes, dynamic DB-backed pages, and client-side navigation.
   - Multi-stage Dockerfile builds separate dependencies (`deps`), build (`builder`), and runtime (`runner`) stages.
   - Production images run under an unprivileged non-root user (`nextjs:nodejs`, UID/GID 1001).
   - Telemetry disabled (`NEXT_TELEMETRY_DISABLED=1`).
2. **Go API Backend**:
   - All persistence, business logic, migrations, and S3 presigned URLs are owned by the Go API (`backend/`).
   - Built with `golang:1.24-alpine`; runtime image based on `alpine:latest`.
   - Chi router, sqlc-generated repository, `goose` migrations, structured logging via `slog`.
3. **Container Image Runtime Policy**:
   - **Web Base Image**: `node:24-alpine`.
   - **Go API Base Images**: `golang:1.24-alpine` (build), `alpine:latest` (runtime).
   - **Database Image**: `postgres:17-alpine`.
   - **Fallback**: lightest Debian-based image (`-slim`) only when dependency compatibility explicitly requires it.
4. **Container Image Tagging Policy**:
   - **Demo Builds**: Web `lemans-bridge-dashboard:demo-web`, Go API `lemans-bridge-dashboard-go:demo-go`.
   - **Production Builds**: Web `lemans-bridge-dashboard:prod-web`, Go API `lemans-bridge-dashboard-go:prod-go`.
5. **No Compose Mandate**:
   - `podman compose` / `docker compose` are not used.
   - Local builds, linting, testing, and execution use `podman run --rm` helper scripts or rootless Quadlet systemd units.
6. **Declarative Podman Quadlet Systemd Management**:
   - Production containers are managed declaratively using Quadlet files (`.container`, `.volume`, `.network`) placed in user systemd paths (`~/.config/containers/systemd/`).
   - Systemd user lingering enabled (`loginctl enable-linger <user>`) to keep services active across reboots.
   - Observability via structured JSON logging to `stdout`/`stderr` collected by systemd journal (`journalctl --user -u <service>`) and `podman logs`.

---

## 3. Recommended Architecture: Next.js 16 + Go API + PostgreSQL Container

### Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ HOST SYSTEM (macOS Podman Machine / Remote Linux Host)                                 │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ PODMAN USER NETWORK (`lemans-net` - Isolated Bridge, No Host Port Publishing DB) │  │
│  │                                                                                  │  │
│  │   ┌───────────────────────────────────────────────────────────────────────────┐  │  │
│  │   │ WEB CONTAINER (`lemans-app`)                                              │  │  │
│  │   │ - Framework: Next.js 16 App Router (Node 24 Alpine Standalone)            │  │  │
│  │   │ - Role simulation, API routes for attachments, server-side API client      │  │  │
│  │   │ - Image Tag: demo (`demo-web`), prod (`prod-web`)                        │  │  │
│  │   │ - Exposed Port: 127.0.0.1:3000 (Loopback Only)                            │  │  │
│  │   └─────────────────────────────────────┬─────────────────────────────────────┘  │  │
│  │                                         │                                        │  │
│  │              HTTP (internal net)        │ HTTP over internal bridge (5432)       │  │
│  │                                         ▼                                        │  │
│  │   ┌───────────────────────────────────────────────────────────────────────────┐  │  │
│  │   │ GO API CONTAINER (`lemans-go`)                                            │  │  │
│  │   │ - Go 1.24, Chi router, sqlc, goose migrations, slog logging              │  │  │
│  │   │ - Business logic, migrations, presigned B2 URLs                            │  │  │
│  │   │ - Image Tag: demo (`demo-go`), prod (`prod-go`)                          │  │  │
│  │   │ - Exposed Port: internal only                                              │  │  │
│  │   └─────────────────────────────────────┬─────────────────────────────────────┘  │  │
│  │                                         │                                        │  │
│  │                                         │ PostgreSQL (internal port 5432)        │  │
│  │                                         ▼                                        │  │
│  │   ┌───────────────────────────────────────────────────────────────────────────┐  │  │
│  │   │ DATABASE CONTAINER (`lemans-db`)                                         │  │  │
│  │   │ - Engine: PostgreSQL 17 Alpine                                            │  │  │
│  │   │ - Image Tag: `postgres:17-alpine`                                         │  │  │
│  │   │ - Volume: Named Volume (`lemans-db-data`)                                 │  │  │
│  │   │ - Published Ports: NONE (0 Exposed Ports to Host)                        │  │  │
│  │   └───────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Remote Caddy Pattern

For VPS demo and production, the Next.js web container joins both the public
`caddy.network` (shared with the existing rootless Caddy reverse proxy) and the
internal app network, allowing Caddy to route traffic to the web container by
name without publishing the web port to the public interface. The Go API
container is attached only to the internal network.

---

## 4. Security, Observability, & Failure Recovery

### Security Baseline

- **Zero Exposed Database Ports**: Database container listens exclusively on container-internal bridge network (`lemans-net`). Host cannot access port 5432 directly.
- **Loopback App Port Binding**: Application container binds exclusively to `127.0.0.1:3000` locally; on VPS, only the Caddy bridge container binds the public proxy port.
- **Unprivileged Container Execution**: Application process runs as non-root `nextjs` user (UID 1001).
- **No Compose**: All execution uses `podman run --rm` scripts or Quadlet units; no `docker.sock` or compose socket mounts.

### Observability & Logging

- **Structured JSON Logging**: Application outputs structured JSON logs to `stdout`/`stderr`.
- **Podman Systemd Journaling**: Collected via `journalctl --user -u <service>` or `podman logs -f <container_name>`.

### Authentication & Authorization Layer

- **Framework**: Demo uses no authentication. Role simulation via `lemans-demo-role` cookie and `X-Demo-Role` header. Production will use a real auth layer (separate planning).
- **Role Enforcement**: Project-specific role matrix in `src/lib/roles.ts`, validated server-side by the Go API using `internal/actor` and `internal/policy`.
- **Middleware**: None required for the demo profile.

### File Attachment Layer

- **Object Store**: Backblaze B2 via S3-compatible API (see ADR-0004).
- **SDK**: AWS SDK for Go v2.
- **Access Pattern**: Server-side `PutObject` uploads; presigned `GetObject` URLs for authorized downloads generated by the Go API.
- **Metadata Registry**: PostgreSQL `attachments` table links S3 object keys to Job Orders, DCS payments, supplier invoices, and OPEX requests.

### Backup & Disaster Recovery

- **Database Backup**: Daily containerized `pg_dump` execution storing compressed SQL backups to Backblaze B2 `backups/db/` (production only).
- **Object Storage Backup**: Backblaze B2 bucket versioning and lifecycle rules managed in Backblaze console; references preserved in PostgreSQL.
- **Restore Protocol**: One-line container execution: `podman exec -i lemans-db psql -U postgres lemans_db < backup.sql`.
- **Demo Reset**: Remote demo resets every 30 minutes (systemd timer) or on manual trigger, restoring DB to seeded state and clearing uploaded attachments.
