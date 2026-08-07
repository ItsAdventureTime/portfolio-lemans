# ADR 0003: Authentication & Session Strategy

- **Status**: Approved
- **Deciders**: Lead Agent, Project Architect
- **Date**: 2026-08-07

## Context

The Le Mans Operations & Job Cost Management System requires role-based access control (RBAC) for Sales, Service Delivery, Purchasing, General Manager, DCS, and Admin roles. Critical acceptance criteria AC-DCS-001 (DCS cannot approve) and AC-ACCT-001 (admin-only accounting) require server-side authorization. The Phase 2 vertical slice used hardcoded UI personas without real authentication.

## Decision

We adopt **Better Auth** as the production authentication and session framework for the Next.js 14 App Router application, backed by the existing **PostgreSQL** database via the official Prisma adapter.

1. **Library Choice**: `better-auth` (latest stable).
   - Database-session model (sessions stored in PostgreSQL) gives immediate revocation.
   - First-class Prisma adapter and generated schema/migration path.
   - Role/organization primitives available as plugins.
   - TypeScript-first API that fits the existing stack.
2. **Session Model**: Database sessions only.
   - Session token is opaque and stored in a `session` table.
   - Every `auth.api.getSession()` call resolves against PostgreSQL.
3. **Role Model**: Use Better Auth's built-in `admin()` plugin plus a custom project-specific role field.
   - Roles: `ROLE-SALES`, `ROLE-SVC`, `ROLE-PURCH`, `ROLE-GM`, `ROLE-DCS`, `ROLE-ADMIN`.
   - Permissions are enforced in a custom `src/lib/auth.ts` helper matrix.
4. **Integration Pattern**:
   - `src/lib/auth.ts` exports the Better Auth configuration.
   - `src/lib/auth-client.ts` exports the type-safe React client.
   - `src/middleware.ts` performs coarse cookie existence checks (optimistic redirects only).
   - Server Components, Server Actions, and Route Handlers call `auth.api.getSession()` or a project `verifySession()` DAL for real authorization.
5. **Security Baseline**:
   - HttpOnly, Secure, SameSite cookies.
   - Defense-in-depth: middleware for UX redirect, DAL/Server Action for enforcement.
   - Server Actions are treated as public HTTP endpoints and explicitly check roles.

## Consequences

- **Positive**: Real, auditable sessions; immediate revocation; type-safe auth client; role plugins available; aligns with 2026 Next.js best practices.
- **Negative**: Adds a dependency and generated schema surface; requires session DB round-trips; middleware cannot perform full DB checks at the edge (acceptable per ADR-0001 containerized Node runtime).

## Compliance

- No changes to framework (Next.js), database (PostgreSQL), or containerization model.
- Does not introduce host networking, privileged containers, or remote access.
