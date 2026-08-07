# Le Mans Operations & Job Cost Management System - Architecture Specification

## 1. Executive Summary & Strategy

This document specifies the containerized fullstack architecture for the **Le Mans Operations & Job Cost Management System**. All proposed solutions comply strictly with the project's **Rootless Podman Containerization Mandate** (local Apple Silicon macOS development via `podman machine start` + remote Linux Quadlet systemd deployment).

---

## 2. Industry Research Grounding & Best Practices

Based on current 2026 containerization standards for Node.js/Next.js and Podman Quadlet:

1. **Next.js Standalone Optimization**:
   - Next.js is configured with `output: 'standalone'` in `next.config.js` to preserve Server Actions, API routes, middleware, and dynamic DB-backed pages.
   - Multi-stage Dockerfile builds separate dependencies (`deps`), build (`builder`), and runtime (`runner`) stages.
   - Production images run under an unprivileged non-root user (`nextjs:nodejs`, UID/GID 1001).
   - Telemetry disabled (`NEXT_TELEMETRY_DISABLED=1`).
2. **Container Image Runtime Policy**:
   - **Base Images**: `node:20-alpine3.20` for application; `postgres:16-alpine` for database.
   - **Fallback**: lightest Debian-based image (`-slim`) only when dependency compatibility explicitly requires it.
3. **Container Image Tagging Policy**:
   - **Demo Builds**: Tag `latest-alpine` (fallback: `latest-slim`, then `latest`).
   - **Production Builds**: Tag `lts-alpine` (fallback: `lts-slim`, then `lts`).
4. **No Compose Mandate**:
   - `podman compose` / `docker compose` are not used.
   - Local builds, linting, testing, and execution use `podman run --rm` helper scripts or rootless Quadlet systemd units.
5. **Declarative Podman Quadlet Systemd Management**:
   - Production containers are managed declaratively using Quadlet files (`.container`, `.volume`, `.network`) placed in user systemd paths (`~/.config/containers/systemd/`).
   - Systemd user lingering enabled (`loginctl enable-linger <user>`) to keep services active across reboots.
   - Observability via structured JSON logging to `stdout`/`stderr` collected by systemd journal (`journalctl --user -u <service>`) and `podman logs`.

---

## 3. Recommended Architecture: Next.js 14+ App Router + PostgreSQL Container

### Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ HOST SYSTEM (macOS Podman Machine / Remote Linux Host)                                 │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ PODMAN USER NETWORK (`lemans-net` - Isolated Bridge, No Host Port Publishing DB) │  │
│  │                                                                                  │  │
│  │   ┌───────────────────────────────────────────────────────────────────────────┐  │  │
│  │   │ APP CONTAINER (`lemans-app`)                                              │  │  │
│  │   │ - Framework: Next.js 14 App Router (Node 20 Alpine Standalone)            │  │  │
│  │   │ - Server Actions & API Routes for RBAC & Business Logic                  │  │  │
│  │   │ - Image Tag: demo (`latest-alpine`), prod (`lts-alpine`)                 │  │  │
│  │   │ - Exposed Port: 127.0.0.1:3000 (Loopback Only)                            │  │  │
│  │   └─────────────────────────────────────┬─────────────────────────────────────┘  │  │
│  │                                         │                                        │  │
│  │                                         │ Prisma Connection (Internal Port 5432) │  │
│  │                                         ▼                                        │  │
│  │   ┌───────────────────────────────────────────────────────────────────────────┐  │  │
│  │   │ DATABASE CONTAINER (`lemans-db`)                                         │  │  │
│  │   │ - Engine: PostgreSQL 16 Alpine                                            │  │  │
│  │   │ - Image Tag: `postgres:16-alpine`                                         │  │  │
│  │   │ - Volume: Named Volume (`lemans-db-data`)                                 │  │  │
│  │   │ - Published Ports: NONE (0 Exposed Ports to Host)                        │  │  │
│  │   └───────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Remote Caddy Bridge Pattern

For VPS demo and production, a single lightweight Caddy bridge container joins both the public `caddy.network` (shared with the existing rootless Caddy reverse proxy) and the internal app network, allowing Caddy to route traffic to the app container by name without publishing the app port to the public interface.

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

- **Framework**: Better Auth with database sessions (see ADR-0003).
- **Role Enforcement**: Project-specific role matrix in `src/lib/auth.ts`, enforced in Server Actions, Route Handlers, and Server Components through `auth.api.getSession()` / `verifySession()`.
- **Middleware**: `src/middleware.ts` performs coarse optimistic checks only; real authorization happens at the data layer.

### File Attachment Layer

- **Object Store**: Backblaze B2 via S3-compatible API (see ADR-0004).
- **SDK**: AWS SDK for JavaScript v3.
- **Access Pattern**: Server-side `PutObject` uploads; presigned `GetObject` URLs for authorized downloads.
- **Metadata Registry**: PostgreSQL `Attachment` table links S3 object keys to Job Orders, DCS payments, supplier invoices, and OPEX requests.

### Backup & Disaster Recovery

- **Database Backup**: Daily containerized `pg_dump` execution storing compressed SQL backups to Backblaze B2 `backups/db/` (production only).
- **Object Storage Backup**: Backblaze B2 bucket versioning and lifecycle rules managed in Backblaze console; references preserved in PostgreSQL.
- **Restore Protocol**: One-line container execution: `podman exec -i lemans-db psql -U postgres lemans_db < backup.sql`.
- **Demo Reset**: Remote demo resets every 30 minutes (systemd timer) or on manual trigger, restoring DB to seeded state and clearing uploaded attachments.
