Task completion checklist

Before marking a feature complete:

1. TypeScript compiles cleanly: `podman exec -i lemans-demo-app npx tsc --noEmit`
2. Tests pass: run all `src/__tests__/*.test.ts` inside lemans-demo-app.
3. Prisma schema applies: `npx prisma db push` inside container.
4. Seed succeeds and new data is visible.
5. UI implements 4 states (loading, empty, error, success) per DESIGN-SYSTEM.md.
6. Server Actions enforce auth/authorization.
7. HTTP routes return 200 on local-demo and local-prodlike loopback ports.
8. Update relevant docs if behavior, env vars, or commands changed.

Do not commit code changes until tests pass inside a container.
