Authentication: Better Auth + PostgreSQL database sessions

See docs/adr/0003-authentication-and-session-strategy.md.

- Sessions are opaque tokens stored in PostgreSQL; revocation is immediate.
- Roles: ROLE-SALES, ROLE-SVC, ROLE-PURCH, ROLE-GM, ROLE-DCS, ROLE-ADMIN.
- Permission matrix lives in `src/lib/roles.ts`.
- `src/lib/auth.ts` exports Better Auth configuration.
- `src/lib/auth-client.ts` exports the type-safe React client.
- `src/middleware.ts` does coarse cookie/redirect checks only.
- Real authorization happens in Server Components / Server Actions / Route Handlers via `auth.api.getSession()` or a project `verifySession()` DAL.
- Acceptance criteria to enforce: AC-DCS-001 (DCS cannot approve), AC-ACCT-001 (admin-only /accounting).

Environment variables

- BETTER_AUTH_SECRET — signing secret
- BETTER_AUTH_URL — canonical app URL per environment
