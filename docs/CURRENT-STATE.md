# Current repository state

- **Updated**: 2026-08-12 (implementation audit)
- **Authority**: Current implementation and the demo rules in
  [`DEMO-IMPLEMENTATION-PLAYBOOK.md`](./DEMO-IMPLEMENTATION-PLAYBOOK.md)
- **Documentation index**: [`DOCUMENTATION-INDEX.md`](./DOCUMENTATION-INDEX.md)

Use this guide for the current app, workflow, and validation process. Historical
material in `to-review-and-delete/` is preserved for review, not for day-to-day
implementation or operations.

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

### Runtime branding

The canonical LeMans Service Plus logo is tracked at
`public/lemans-service-plus-logo.jpg` (copied byte-for-byte from
`references/branding/logo.jpg`). Next Image renders it in the persistent
`Header` and `DemoSplash` with explicit dimensions; the same asset supplies
the app icon metadata.

## Run the demo locally

The demo base path is `/lemans/demo`; the production profile uses `/lemans`.
The optional local validation workflow is:

```bash
export PATH="/opt/podman/bin:$PATH"
./scripts/build.sh demo
./scripts/run-local.sh
./scripts/verify-local.sh
./scripts/verify-vertical-slice.sh
./scripts/verify-e2e.sh
./scripts/stop-local.sh
```

`./scripts/reset-local.sh` removes the demo database volume; the next
`run-local.sh` invocation recreates migrations and seed data. The database never
publishes port 5432 to the host.

Remote deployment is separate: the workstation stages a clean committed source
tree to the stable `current` path and syncs it with rsync, the VPS builds and
smoke-tests stable profile images with
rootless Podman, and the existing Quadlets under
`/home/jk/.config/containers/systemd/bridge-ph/lemans-demo` activate those
images. Remote operations require explicit authorization.

## What you can do in the demo

Use the demo to follow this workflow:

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
8. View the Admin-only accounting summary and download deterministic,
   Excel-compatible CSV or JSON accounting exports for customers, vendors,
   bills, expenses, invoices, collections, and payments.

The exports are stable interchange files, not direct QuickBooks-import schemas.

The API validates every quotation line and saves the quotation, items, and
totals in one transaction. Conversion claims the approved quotation, creates a
job order, copies its items, records the event, and marks the quotation as
converted in the same transaction. Quote and job-order numbers include a
cryptographically random suffix to avoid collisions.

## What this demo does not include

- B2 upload/download actions require valid runtime B2 credentials; local demo
  seed data does not include real uploads.
- The demo role switcher demonstrates policy behavior but does not authenticate
  users or protect public data.
- Job Costing supports server-rendered search and status filtering across job
  number, customer, vehicle, and technician, with estimate/actual summary
  metrics. List actuals and variances are recorded labor plus parts costs;
  supplier invoice allocations are included on each detail sheet. Customer-wide
  search, richer customer contacts, deeper reporting,
  a dedicated quotation detail view, and production authentication remain
  future work until the playbook adds implementation and verification
  requirements.
- Customer detail pages now load `/api/customers/{id}/service-history` and show
  a linked service-history timeline of the customer's job orders.
- A complete UI/UX and workflow-navigation revamp is planned from
  [`UI-UX-REVAMP-HANDOFF.md`](./UI-UX-REVAMP-HANDOFF.md). The handoff is a
  future-work contract; current route and behavior facts remain here and in the
  demo playbook until that work is implemented and verified.
- Remote deployment is intentionally not part of local verification and requires
  explicit user authorization.

## Keep the documentation current

- Current runtime, build, and verification claims belong here, the README,
  `AGENTS.md`, the demo playbook, and the remote deployment playbook.
- `to-review-and-delete/` contains historical phase, migration, review, and
  superseded UX material awaiting user review. It is not implementation
  authority and must not be used for commands, routes, versions, or completion
  claims.
- Do not document removed Prisma/Better Auth files, `/login` redirects,
  `docker-compose` workflows, or `Dockerfile.prod` as current implementation.

## Git policy

- Work remains on `main`; do not create or switch to feature branches.
- GitHub remote inspection, synchronization, and branch administration use the
  official `gh` CLI over HTTPS.
- Never delete `main`. Before deleting another branch, inspect its protection
  status and compare it with `main`.
- The complete documentation status map is maintained in
  [`DOCUMENTATION-INDEX.md`](./DOCUMENTATION-INDEX.md).
