# Le Mans Operations & Job Cost Management System - Architecture Specification

## 1. Executive Summary & Strategy
This document specifies the containerized fullstack architecture for the **Le Mans Operations & Job Cost Management System**. All proposed solutions comply strictly with the project's **Rootless Podman Containerization Mandate** (local Apple Silicon macOS development via `podman machine start` + remote Linux Quadlet systemd deployment).

---

## 2. Industry Research Grounding & Best Practices

Based on current 2026 containerization standards for Node.js/Next.js and Podman Quadlet:

1. **Next.js Standalone Optimization**:
   - Next.js is configured with `output: 'standalone'` in `next.config.js`.
   - Multi-stage Dockerfile builds separate dependencies (`deps`), build (`builder`), and runtime (`runner`) stages.
   - Production images run under an unprivileged non-root user (`nextjs:nodejs`, UID/GID 1001).
   - Telemetry disabled (`NEXT_TELEMETRY_DISABLED=1`).
2. **Container Image Tagging Policy**:
   - **Demo Builds**: Use `node:20-alpine` tagged as `latest-alpine` or `latest-slim` (fallback: `latest`).
   - **Production Builds**: Use `node:20-alpine` tagged as `lts-alpine` or `lts-slim` (fallback: `lts`).
3. **Declarative Podman Quadlet Systemd Management**:
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
│  │   │ - Image Tag: demo (`postgres:alpine`), prod (`postgres:16-alpine`)       │  │  │
│  │   │ - Volume: Named Volume (`lemans-db-data`)                                 │  │  │
│  │   │ - Published Ports: NONE (0 Exposed Ports to Host)                        │  │  │
│  │   └───────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Security, Observability, & Failure Recovery

### Security Baseline
- **Zero Exposed Database Ports**: Database container listens exclusively on container-internal bridge network (`lemans-net`). Host cannot access port 5432 directly.
- **Loopback App Port Binding**: Application container binds exclusively to `127.0.0.1:3000` locally.
- **Unprivileged Container Execution**: Application process runs as non-root `nextjs` user (UID 1001).

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
- **Database Backup**: Nightly containerized `pg_dump` execution storing compressed SQL backups into dedicated volume.
- **Object Storage Backup**: Backblaze B2 bucket versioning and lifecycle rules managed in Backblaze console; references preserved in PostgreSQL.
- **Restore Protocol**: One-line container execution: `podman exec -i lemans-db psql -U postgres lemans_db < backup.sql`.
