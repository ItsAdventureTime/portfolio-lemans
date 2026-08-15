# ADR 0002: Technology Stack Selection — Next.js 16 + Go API + PostgreSQL

- **Status**: Accepted; supersedes the original 2026-08-07 Prisma decision
- **Deciders**: Lead Agent, Project Architect
- **Date**: 2026-08-12

## Context

The application requires relational data modeling for job orders, supplier
invoices, multi-job-order allocations, customer billing, accounts receivable,
and audit-friendly operational records. It also needs a small self-hosted web
runtime and a backend boundary that can own migrations and financial rules.

## Decision

The current source uses Next.js 16 App Router (`output: 'standalone'`) as the
web frontend, a Go 1.26 API for persistence and business logic, and PostgreSQL.
Local execution uses Docker inside the initialized project Sandbox; the VPS
uses rootless Podman Quadlets for the persistent runtime:

1. **Web frontend**: Next.js Server Components and route handlers provide the
   demo UI and form feedback; standalone output produces the minimal runtime
   image.
2. **API boundary**: Go owns migrations, SQL transactions, role-policy checks,
   domain mutations, and S3-compatible presigned URLs. The frontend uses the
   typed client in `src/lib/api.ts`.
3. **Relational integrity**: PostgreSQL and the Go repository enforce durable
   job-cost, purchasing, billing, and payment records.
4. **Profiles**: Demo and production share this source tree. Runtime base paths,
   image tags, credentials, reset behavior, and deployment units vary by
   profile; there is no separate production source copy.

## Consequences

- **Positive**: Clear persistence ownership, compact frontend image, typed API,
  and explicit rootless container isolation.
- **Negative**: Frontend and backend contracts must stay synchronized, and both
  images must be built and verified together.
- **Migration note**: Prisma and Better Auth files described by earlier ADR
  revisions are historical and are not dependencies of the current demo.
