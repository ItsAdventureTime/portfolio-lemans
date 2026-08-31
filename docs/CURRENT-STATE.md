# Current repository state

- **Updated**: 2026-08-31 (Mac mini Docker Compose and Cloudflare Tunnel path)
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
- Browser-side API mutations use the base-path-aware Next.js
  `/api/proxy/[...path]` route; the Go API hostname stays server-side.
- PostgreSQL `postgres:16-alpine` on an internal Docker network locally and an
  internal rootless Podman network remotely.
- `Dockerfile.web` builds `lemans-bridge-dashboard:{demo,prod}-web`.
- `Dockerfile.go` builds `lemans-bridge-dashboard-go:{demo,prod}-go`.
- The demo has no real authentication or production security boundary. It starts
  with the simulated splash; the `lemans-demo-entered` cookie gates the shared
  dashboard shell, and the `lemans-demo-role` cookie plus `X-Demo-Role` header
  provide role simulation after entry.
- The Mac mini demo deployment uses [`../compose.yaml`](../compose.yaml):
  Next.js, Go, and PostgreSQL run as one Compose project. The web service binds
  only to `127.0.0.1:${LEMANS_WEB_PORT:-3001}` on macOS and keeps container port
  `3000`; set `LEMANS_WEB_PORT` when the default host port is occupied. The
  existing native macOS Cloudflare Tunnel is the sole public ingress. Docker
  Compose supplies only the database password as a service-scoped secret, and
  the deployment is operated through
  [`MACOS-DOCKER-COMPOSE.md`](./MACOS-DOCKER-COMPOSE.md).

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
The entry action uses a base-path-aware server-action form, with a client-side
fetch enhancement, timeout, and inline error state. The server action provides a
no-hydration fallback; successful entry returns to the base-path overview so the
persistent root layout reevaluates the shell gate. At the canonical base-path
root, the client explicitly reloads after the POST instead of assigning the
already-current URL; direct module routes still assign the base-path overview.
The page-transition wrapper is a small client-side `motion/react` boundary
keyed by pathname. It settles new content with 180ms opacity/4px transform
motion, skips exit waits and artificial delays, and disables movement for
reduced-motion users. A CSS fallback remains available without scripting.
Ordinary section changes remain soft, prefetched client navigations.

Route focus is deliberate: `RouteScrollReset` preserves the role switcher's
focus and focuses `#main-content` after a route change only when focus was in
navigation, route content, or the document body. Quick-add and supplier-invoice
allocation dialogs trap keyboard focus, dismiss on Escape, and restore focus to
their triggers. The root `loading.tsx` boundary is a compact layout-preserving
skeleton rather than a blocking full-page spinner.

## Run the demo locally

The demo base path is `/demo/lemans`; the production profile uses `/lemans`.
The optional local validation workflow is:

```bash
jk-sbx-project ensure
jk-sbx-project exec -- ./scripts/build.sh demo
jk-sbx-project publish 3000
jk-sbx-project exec -- ./scripts/run-local.sh
jk-sbx-project exec -- ./scripts/verify-local.sh
jk-sbx-project exec -- ./scripts/verify-vertical-slice.sh
jk-sbx-project exec -- ./scripts/verify-e2e.sh
jk-sbx-project exec -- ./scripts/stop-local.sh
```

`./scripts/reset-local.sh` removes the demo database volume; the next
`run-local.sh` invocation recreates migrations and seed data. The database never
publishes port 5432 to the host. The local runtime containers are named for
verification; `stop-local.sh` stops and removes those project-specific
containers. `run-local.sh` removes and replaces them on the next start.
Validation-only containers use `--rm`.

The current demo validation baseline runs through the initialized Docker Sandbox:

- `verify-local.sh`: Prettier, ESLint, TypeScript, Next.js production build,
  and Go tests pass.
- `verify-vertical-slice.sh`: all health and module routes return 200; the API
  is reachable on the internal network; PostgreSQL has no published host port.
- `verify-e2e.sh`: runs 57 Playwright tests across desktop, mobile, and
  reduced-motion projects. The final full matrix passed 56 tests with one
  intentional mobile skip, including
  hydrated-client, no-hydration form submission, nested-base-path, entry-error,
  browser API proxy, and reduced-motion coverage.
- `npm audit --omit=dev`: no reported vulnerabilities after pinning the
  transitive `nanoid` dependency to the patched `3.3.18` release.

The 2026-08-15 navigation focus repair and branded responsiveness refinement were additionally checked with fresh Docker Sandbox frontend
validation (`format:check`, `lint`, `typecheck`, and production build), a
successful demo web/API image build, and browser checks at
desktop and 390x844 mobile widths. Those checks covered role-aware overview
actions, seven readable workflow cards, mobile navigation disclosure, no
overview horizontal overflow, role-filtered workflow and dashboard surfaces,
branded logo rendering, a stable centered footer across routes, the entry gate
on direct module URLs, a horizontally contained accounting table, and a
reduced-motion-safe route/content transition, and the navigation focus cascade
after repeated route changes.

The UI keeps the configured `NEXT_PUBLIC_BASE_PATH` at runtime, uses integer
centavos for monetary values, exposes keyboard-visible focus states and 44px
minimum targets, and preserves the demo role policy through `X-Demo-Role`.

The desktop primary navigation preserves horizontal scrolling but clips vertical
overflow. This keeps the one-pixel pressed-link feedback from creating a transient
scrollbar beside Accounting while the pointer is held; the regression is covered
by the Playwright navigation test.

The shared data-table refinement keeps tables stable across modules with fixed
layout, explicit column widths, middle-aligned cells, right-aligned numeric
values, tabular numerals, and centered status badges. Compact action controls keep
the WCAG-sized 44px hit area while drawing a quieter visual surface, so approval
and form buttons do not dominate the page. Ordinary labels, table headers,
metadata, workflow labels, and supporting copy use regular weight. Opaque
current/completed/upcoming surfaces, borders, icons, and status text carry
semantic emphasis; headings, identifiers, and financial values retain deliberate
numeric or heading hierarchy. The pathname-keyed Motion route transition remains
Motion- and SmoothUI-aligned and honors `prefers-reduced-motion` without delaying
navigation.

Remote deployment is separate: the project Docker Sandbox builds stable
`linux/amd64` profile images using native build stages, the workstation stages an
exact `HEAD` source tree and checksum-verified image bundle to the stable
`current` path with rsync, and the VPS imports those images with rootless Podman
before activating the existing Quadlets under
`/home/jk/.config/containers/systemd/bridge-ph/lemans-demo`. The deployment
preflight reports blocking paths using stable Git
porcelain output and permits only the tracked Serena metadata file
`.serena/project.yml` to remain modified; it is excluded from the `HEAD`
snapshot. The VPS does not compile or build the application. Remote operations
require explicit authorization.

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
  - Primary navigation links scope keyboard focus to a stable inset outline and
    skip the global focus shadow, preventing a transient vertical edge from
    flashing beside the active item during route changes. The shared focus rule
    is in `@layer base`, and the navigation override is in `@layer components`.
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
