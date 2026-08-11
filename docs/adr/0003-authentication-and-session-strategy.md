# ADR 0003: Authentication & Session Strategy

- **Status**: Future production design; not implemented in the demo
- **Deciders**: Lead Agent, Project Architect
- **Date**: 2026-08-12

> **Demo boundary:** The current demo intentionally has no login, password,
> session, or authentication redirect. It uses the simulated actor described in
> [`../DEMO-IMPLEMENTATION-PLAYBOOK.md`](../DEMO-IMPLEMENTATION-PLAYBOOK.md)
> and enforces role policy in the Go API for walkthrough safety. This ADR must
> not be used to add authentication to the demo profile.

## Context

Production will eventually require authenticated RBAC for Sales, Service,
Purchasing, General Manager, DCS, and Admin roles. Critical rules such as
“DCS cannot approve” and Admin-only accounting must remain enforced by the
backend, not only by navigation or hidden buttons.

## Decision for the future production profile

Evaluate Better Auth or an equivalent maintained session framework at the
Next.js boundary, backed by PostgreSQL and integrated with the Go API policy
boundary. Adoption requires a separate compatibility-tested implementation
plan; the current repository has no Prisma or Better Auth dependency.

Required properties:

1. Opaque, revocable sessions stored in a durable production database.
2. HttpOnly, Secure, SameSite cookies with an environment-specific canonical
   URL.
3. Server-side authorization in the Go API for every mutation and protected
   read; UI checks remain usability aids only.
4. Explicit migration, logout, secret rotation, backup, and rollback procedures.
5. No change to the demo’s splash, Admin default, or visible role simulation.

## Consequences

- Production gains auditable identity and revocable sessions.
- The production profile will add operational and schema complexity.
- The Go policy matrix remains the source of truth for business authorization.

## Compliance

The current demo uses `lemans-demo-role` and `X-Demo-Role` only for simulation.
It is not suitable for real customer data or public production access.
