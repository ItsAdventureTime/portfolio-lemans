# Le Mans Operations & Job Cost Management System — Delivery Plan

- **Updated**: 2026-08-12
- **Current delivery authority**: [`CURRENT-STATE.md`](./CURRENT-STATE.md)
- **Demo acceptance authority**: [`DEMO-IMPLEMENTATION-PLAYBOOK.md`](./DEMO-IMPLEMENTATION-PLAYBOOK.md)
- **Branch policy**: `main` only

## 1. Delivered baseline

The repository has moved from the former Prisma/Next.js monolith to the
implementation that is currently in source control:

- Next.js 16.3 App Router frontend with build-time `/lemans/demo` and `/lemans`
  base paths.
- Go API with Goose migrations, sqlc repository code, centralized demo actor
  policy, and PostgreSQL persistence.
- Rootless Podman local demo topology: PostgreSQL, Go API, and Next.js web.
- Customer → quotation → job order → procurement → costing → billing → payment
  walkthrough, plus OPEX → approval → DCS payment/proof flow.
- Transactional purchasing, supplier-invoice allocation and approval, service
  invoice creation, and customer payment persistence.
- Demo splash, Admin default, six-role switcher, loading/empty/error/success
  states, keyboard focus, mobile touch targets, and reduced-motion behavior.
- Rootless remote-demo Quadlets and reset-timer artifacts prepared in source,
  but remote deployment remains authorization-gated and unexercised here.

## 2. Current verification gates

When local validation is explicitly required, run from the repository root.
Remote deployment does not execute this local workflow; it builds and smoke-tests
on the VPS:

```bash
export PATH="/opt/podman/bin:$PATH"
./scripts/build.sh demo
./scripts/verify-local.sh
./scripts/run-local.sh
./scripts/verify-vertical-slice.sh
./scripts/verify-e2e.sh
./scripts/stop-local.sh
```

The browser gate runs the Playwright projects (Chromium, mobile, and
reduced-motion) in a disposable Playwright container on `lemans-demo-net`.
The exact result must be recorded in the handoff or release evidence.

## 3. Remaining demo boundaries

These are known and intentional, not delivery failures:

1. B2 upload/download requires valid runtime credentials.
2. Search, richer contacts, and deeper reporting remain future scope.
3. The role switcher is a demo policy simulation, not authentication or a
   production security boundary.
4. Local runtime is disposable; remote deployment requires explicit user
   authorization and live Caddy/network context.

## 4. Future production profile

Production promotion must come from the validated demo source and image lineage,
with runtime-only controls for:

- real authentication and revocable sessions;
- secrets, backups, retention, and audit controls;
- production B2 storage and attachment lifecycle;
- deeper reporting and external integrations;
- staged migrations and deployment rollback.

The future authentication decision is recorded in
[`adr/0003-authentication-and-session-strategy.md`](./adr/0003-authentication-and-session-strategy.md).

## 5. Documentation and Git hygiene

Keep all work on `main`. Update the affected current guides and verification
evidence with each source change. Historical phase reports remain dated evidence
and must not be used to override the current-state guide. Use the complete
[`DOCUMENTATION-INDEX.md`](./DOCUMENTATION-INDEX.md) for the document map and
GitHub CLI synchronization policy.
