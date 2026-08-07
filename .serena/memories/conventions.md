Code conventions

- Server-only data access: put Prisma client in `src/lib/db.ts` with `import "server-only"`.
- Authorization: enforce in Server Actions / Route Handlers / Server Components, not only UI.
- Forms: use Server Actions + `useActionState`; validate with Zod before DB writes.
- Currency: prefer integer cents in DB; use exact thresholds in tests to avoid float drift.
- UI states: every dynamic component must implement LOADING, EMPTY, ERROR, SUCCESS/default.
- Tailwind: use 4px-multiple spacing only; arbitrary pixel values (e.g. px-[13px]) are forbidden.
- Brand red (#D32F2F) is a brand accent; danger red is reserved for real errors/alerts.
- Container ports: always `127.0.0.1:<port>` in local/prodlike; DB port never published.
- Environment secrets: injected via container env only; never commit values.
- Git: do not run git push, reset, rebase, or other mutations without explicit user confirmation.
