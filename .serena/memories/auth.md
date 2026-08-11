# Demo role policy

- The demo intentionally has no real login, passwords, sessions, redirects, or `requireSession` checks.
- Splash entry sets the simulated Admin actor; visible switcher supports Admin, General Manager, Sales Advisor, Service Advisor, Purchasing, and DCS.
- Browser cookie `lemans-demo-role` and API `X-Demo-Role` flow through centralized actor/policy helpers. Demo role checks are walkthrough behavior, not a public-data security boundary.
- Every role-sensitive mutation still validates input and uses centralized policy. Admin-only accounting/export access uses `policy.ViewAccounting`.
- Production authentication is a future runtime/profile concern; do not import older Better Auth/Prisma assumptions into the demo.