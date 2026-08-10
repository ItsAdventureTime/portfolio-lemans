Code conventions

- Architecture: Next.js 16 frontend + Go 1.24 API backend + PostgreSQL 17. The Go API owns all persistence, migrations, and S3 presigned URLs. Next.js calls the Go API over the internal Podman network.
- Server-only data access: no Prisma. The Next.js app uses typed Go API client in `src/lib/api.ts` (server-side only for route handlers and server actions).
- Authorization: demo uses role simulation via `lemans-demo-role` cookie / `X-Demo-Role` header; production auth is future planning.
- Forms: use server actions + `useActionState` calling the Go API; validate inputs before sending.
- Currency: integer cents (`bigint`) in PostgreSQL, `int64` in Go, `₱` formatting helpers in Next.js; use exact thresholds in tests to avoid float drift.
- UI states: every dynamic component must implement LOADING, EMPTY, ERROR, SUCCESS/default.
- Tailwind: use 4px-multiple spacing only; arbitrary pixel values (e.g. px-[13px]) are forbidden.
- Brand red (#D32F2F) is a brand accent; danger red is reserved for real errors/alerts.
- Container ports: always `127.0.0.1:<port>` in local/prodlike; DB port never published.
- Environment secrets: injected via container env only; never commit values.
- Git: local commits use local `git` CLI; remote commits/ops MUST use GitHub CLI (`gh`) over HTTPS (`https://...`), not SSH. No git push/rebase/reset without explicit confirmation.
