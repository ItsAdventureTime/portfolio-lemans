# Current repository state

- **Updated**: 2026-08-14 (branded UI/UX redesign, documentation, and validation)
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
- The demo has no real authentication or production security boundary. It starts
  with the simulated splash; the `lemans-demo-entered` cookie gates the shared
  dashboard shell, and the `lemans-demo-role` cookie plus `X-Demo-Role` header
  provide role simulation after entry.

### Runtime branding

The canonical Le Mans Service Plus logo is tracked at
`public/lemans-service-plus-logo.jpg` (copied byte-for-byte from
`references/branding/logo.jpg`). Next Image renders it in the persistent
`Header` and `DemoSplash` with explicit dimensions; the same asset supplies
the app icon, Open Graph, Twitter summary, and canonical metadata. The shared
shell uses the logo-derived red accent with a charcoal navigation rail and
responsive workflow cards. The overview labels the active simulated role and
only renders workflow links, dashboard records, and actions allowed by that
role; detail forms and cards use the same `.surface-card` treatment as the
shell.
Module visibility is centralized in `src/lib/roles.ts`; navigation and every
primary module/detail route use the same policy and render a branded
`AccessDenied` surface before fetching restricted data.
The connected seven-stage visualizer is intentionally an Overview-only
orientation surface; module and detail pages stay focused on their records,
forms, and contextual status controls.
Before simulated entry, direct module URLs render the branded splash without the
dashboard header, navigation, breadcrumbs, footer, or module data surface.
After entry, the footer uses the same centered shell container on every route and
the primary navigation prefetches complete dynamic sections for faster changes.
The entry action performs one base-path document navigation after writing the
demo cookie so the persistent root layout reevaluates the shell gate; ordinary
section changes remain soft, prefetched client navigations.

## Run the demo locally

The demo base path is `/lemans/demo`; the production profile uses `/lemans`.
The optional local validation workflow is:

```bash
export PATH="/opt/homebrew/bin:$PATH"
./scripts/build.sh demo
./scripts/run-local.sh
./scripts/verify-local.sh
./scripts/verify-vertical-slice.sh
./scripts/verify-e2e.sh
./scripts/stop-local.sh
```

`./scripts/reset-local.sh` removes the demo database volume; the next
`run-local.sh` invocation recreates migrations and seed data. The database never
publishes port 5432 to the host. The local runtime containers are named for
verification and stopped by `stop-local.sh`; `run-local.sh` removes and replaces
those project-specific containers on the next start. Validation-only containers
use `--rm`.

The current demo validation baseline is complete in rootless Podman:

- `verify-local.sh`: Prettier, ESLint, TypeScript, Next.js production build,
  and Go tests pass.
- `verify-vertical-slice.sh`: all health and module routes return 200; the API
  is reachable on the internal network; PostgreSQL has no published host port.
- `verify-e2e.sh`: runs 42 Playwright tests across desktop, mobile, and
  reduced-motion projects. Final project-isolated desktop and mobile runs passed
  14/14 each, and focused reduced-motion checks for the changed entry/navigation
  behavior passed. Combined runs can hit host-level Podman browser startup or
  navigation timeouts when other workspaces are consuming the VM.
- `npm audit --omit=dev`: no reported vulnerabilities after pinning the
  transitive `nanoid` dependency to the patched `3.3.18` release.

The 2026-08-14 branded redesign and responsiveness refinement were additionally checked with fresh rootless
Podman frontend validation (`format:check`, `lint`, `typecheck`, and
production build), a successful demo web/API image build, and browser checks at
desktop and 390x844 mobile widths. Those checks covered role-aware overview
actions, seven readable workflow cards, mobile navigation disclosure, no
overview horizontal overflow, role-filtered workflow and dashboard surfaces,
branded logo rendering, a stable centered footer across routes, the entry gate
on direct module URLs, a horizontally contained accounting table, and a
reduced-motion-safe route/content transition.

The UI keeps the configured `NEXT_PUBLIC_BASE_PATH` at runtime, uses integer
centavos for monetary values, exposes keyboard-visible focus states and 44px
minimum targets, and preserves the demo role policy through `X-Demo-Role`.

Remote deployment is separate: the workstation stages a clean committed source
tree to the stable `current` path and syncs it with rsync, the VPS builds and
smoke-tests stable profile images with
rootless Podman, and the existing Quadlets under
`/home/jk/.config/containers/systemd/bridge-ph/lemans-demo` activate those
images. Remote operations require explicit authorization.

The normal macOS operator path is documented in
[`REMOTE-DEPLOYMENT-QUICKSTART.md`](./REMOTE-DEPLOYMENT-QUICKSTART.md). The
deployment wrapper auto-starts the existing macOS Keychain setup when no saved
profile host exists, so routine updates do not require exported environment
variables. The demo reset Quadlet calls the Go API over its internal network;
B2 upload-object cleanup remains unverified from this workspace.

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
- Customer detail pages load `/api/customers/{id}/service-history` and present
  an accessible linked service-history timeline of the customer's job orders.
- Completed full UI/UX and visual workflow navigation revamp from
  [`UI-UX-REVAMP-HANDOFF.md`](./UI-UX-REVAMP-HANDOFF.md):
  - Accessible `<Breadcrumb>` dynamic routing bar across all modules.
  - Connected 7-stage operational visualizer (`EndToEndWorkflowVisualizer`) on Overview only; module pages keep their focused record and form surfaces.
  - Enhanced Header with brand logo, live actor pill, and responsive Navbar drawer.
  - High-contrast, WCAG 2.2-targeted typography, touch targets (min 44x44px), focus-visible outlines, and reduced-motion safety.
  - Shared route-level error, not-found, and access-denied surfaces use branded
    recovery actions. The route boundary is intentionally quiet during section
    navigation; primary links use full Next.js prefetching and a short
    transform content transition keeps the shared shell responsive.
    Mutation-level busy states remain inline and accessible, and reduced-motion
    users receive no non-essential movement.
  - The 2026-08-14 branded pass extends the shared surface treatment through
    detail pages and forms, removes static status live-region semantics, adds
    share metadata, and keeps workflow links, dashboard records, and overview
    actions accurate for the active role. The Go dashboard handler now applies
    the same role policy before returning role-sensitive counts and records.

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
- Complete validated changes require a local commit and synchronization to
  remote `main`; confirm both refs point to the same SHA before reporting
  completion.
- The official `gh` CLI is the only GitHub-facing CLI. Use HTTPS with
  `gh auth setup-git --hostname github.com`; never use SSH remotes, SSH keys,
  passkeys, or another GitHub transport. `git commit` remains the necessary
  local commit primitive because `gh` has no local commit command.
- Inspect all branches after each change. Delete every non-`main` branch locally
  and remotely after checking protection and unique commits. Never delete
  `main`.
- The complete documentation status map is maintained in
  [`DOCUMENTATION-INDEX.md`](./DOCUMENTATION-INDEX.md).
