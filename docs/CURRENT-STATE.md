# Current Repository State

- **Updated**: 2026-08-12
- **Authority**: Current implementation and the demo rules in
  [`DEMO-IMPLEMENTATION-PLAYBOOK.md`](./DEMO-IMPLEMENTATION-PLAYBOOK.md)
- **Documentation index**: [`DOCUMENTATION-INDEX.md`](./DOCUMENTATION-INDEX.md)

This is the implementation-backed guide to the repository. Historical phase
reports remain useful evidence of earlier work, but they are not current runtime
documentation unless they explicitly say so.

## Runtime architecture

- Next.js 16.3 App Router frontend in `src/`.
- Go 1.26 API in `backend/`; it owns PostgreSQL access, Goose migrations,
  business rules, and Backblaze B2 presigned URLs.
- PostgreSQL `postgres:alpine` on an internal rootless Podman network.
- `Dockerfile.web` builds `lemans-bridge-dashboard:{demo,prod}-web`.
- `Dockerfile.go` builds `lemans-bridge-dashboard-go:{demo,prod}-go`.
- The demo has no real authentication. It starts with the simulated splash,
  enters as Admin, and uses the `lemans-demo-role` cookie plus `X-Demo-Role`
  header for role simulation. This is not a security boundary.

## Demo entrypoints

The demo base path is `/lemans/demo`; the production profile uses `/lemans`.
The optional local validation workflow is:

```bash
export PATH="/opt/podman/bin:$PATH"
./scripts/build.sh demo
./scripts/run-local.sh
./scripts/verify-local.sh
./scripts/verify-vertical-slice.sh
./scripts/stop-local.sh
```

`./scripts/reset-local.sh` removes the demo database volume; the next
`run-local.sh` invocation recreates migrations and seed data. The database never
publishes port 5432 to the host.

Remote deployment is separate: the workstation packages a clean committed
source archive, the VPS builds and smoke-tests release images with rootless
Podman, and the existing Quadlets under
`/home/jk/.config/containers/systemd/bridge-ph/lemans-demo` activate those
images. Remote operations require explicit authorization.

## Implemented demo workflow

The current UI and API support the primary walkthrough path:

1. Create a customer and vehicle.
2. Create, approve, and convert a quotation.
3. Inspect and update the generated job order, including technician, status,
   events, costing, and attachment metadata.
4. Create purchase requests and supplier invoices, including multi-job-order
   supplier-invoice allocation.
5. Create and approve OPEX requests and supplier-invoice disbursements.
6. Record DCS payments and optional proof-of-payment uploads when B2 is
   configured.
7. Complete a job order, create a VAT-inclusive service invoice, and record
   customer payments.
8. View the Admin-only accounting summary.

## Known boundaries

- B2 upload/download actions require valid runtime B2 credentials; local demo
  seed data does not include real uploads.
- The demo role switcher demonstrates policy behavior but does not authenticate
  users or protect public data.
- Search, richer customer contacts, exports, and production authentication are
  future scope unless the current playbook is updated with an implementation and
  verification requirement.
- Remote deployment is intentionally not part of local verification and requires
  explicit user authorization.

## Documentation maintenance

- Current runtime, build, and verification claims belong here, the README,
  `AGENTS.md`, the demo playbook, and the remote deployment playbook.
- `PHASE-*`, old review, and migration-result files are historical records.
  They must carry a historical notice when their commands, routes, dependency
  versions, or completion claims no longer describe this source tree.
- Do not document removed Prisma/Better Auth files, `/login` redirects,
  `docker-compose` workflows, or `Dockerfile.prod` as current implementation.

## Git synchronization policy

- Work remains on `main`; do not create or switch to feature branches.
- GitHub remote inspection, synchronization, and branch administration use the
  official `gh` CLI over HTTPS.
- Never delete `main`. Before deleting another branch, inspect its protection
  status and compare it with `main`.
- The complete documentation status map is maintained in
  [`DOCUMENTATION-INDEX.md`](./DOCUMENTATION-INDEX.md).
