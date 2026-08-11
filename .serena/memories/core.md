# Le Mans workspace core

- Current authority: `AGENTS.md`, `docs/CURRENT-STATE.md`, `docs/DEMO-IMPLEMENTATION-PLAYBOOK.md`; historical Phase reports do not override them.
- Single repository and source tree. Demo is canonical; production differs only by runtime/profile configuration.
- Next.js 16.3 App Router frontend in `src/`; Go 1.26 API in `backend/`; PostgreSQL behind the Go API.
- One Job Order is the operational source of truth for quotation, procurement, OPEX, billing, collections, and profitability.
- All execution/validation uses rootless Podman. Never use Compose, host networking, privileged containers, published DB ports, broad mounts, or remote deployment without explicit authorization.
- Work stays on `main`; local Git uses `git`, remote GitHub operations use `gh`/HTTPS.
- Demo has no real authentication: splash → Admin, role-switcher, centralized demo actor/policy. It is not a security boundary. Read `mem:auth` for the exact boundary.
- B2 attachments use S3-compatible presigned URLs; runtime credentials are required for actual transfers. See `mem:attachments`.
- Read `mem:tech_stack`, `mem:workflow`, and `mem:suggested_commands` for implementation and validation facts.