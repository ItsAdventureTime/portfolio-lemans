# Le Mans Demo Implementation Playbook

- **Status**: Authoritative for demo-build work
- **Version**: 1.0.0
- **Updated**: 2026-08-11
- **Audience**: Coding agents, implementation agents, reviewers, and operators

This document converts the repository audit into an executable specification.
For demo work, it takes precedence over older phase-completion matrices,
historical credentials, and production-authentication documents. Those documents
remain useful as historical context or future production guidance, but they must
not override this playbook.

## 1. Demo mission and boundary

The demo is the canonical actively developed build. New features, removals,
workflow improvements, data-model changes, and visual improvements are made and
validated here first. When the demo is accepted, production is promoted from the
same validated source and image lineage with production-only runtime
configuration enabled.

The demo must be easy to open, easy to reset, and easy to use during a live
walkthrough.

The demo has **no real authentication**. It may present a simulated entry
experience for a walkthrough, but it must not implement accounts, passwords,
sessions, or an authorization boundary:

- Opening `/lemans/demo/` starts at a branded splash/landing state.
- The splash presents an `Enter as an Admin` action. This is demo theatre, not a
  login screen or security control.
- Activating the action enters the dashboard as the `Admin` simulated actor.
- There is no login requirement, session check, password flow, or
  authentication redirect in the demo profile.
- The user can change the active simulated role from a visible role switcher.
- The simulated role affects navigation, available actions, labels, empty states,
  and workflow explanations.
- The role switcher is a demonstration control, not a security boundary.
- The demo must never be exposed to the public internet with real customer data.

Keep production authentication and deployment controls isolated behind a
production runtime profile; do not maintain a separate production code copy.
Production promotion may enable Better Auth, secrets, persistent storage,
backups, stricter authorization, and remote deployment controls without changing
the demo's no-auth walkthrough behavior.

The production build must never be promoted from an unverified or partially
implemented demo state.

### 1.1 Canonical demo actor

Use one shared demo actor abstraction throughout the UI and server actions:

| Role              | Display name         | Primary demonstration focus                           |
| ----------------- | -------------------- | ----------------------------------------------------- |
| `ADMIN`           | Admin                | Full system, accounting, exports, role switching      |
| `GROUP_MANAGER`   | General Manager      | Approvals, release controls, management overview      |
| `SALES_ADVISOR`   | Sales Advisor        | Customers, vehicles, quotations, billing              |
| `SERVICE_ADVISOR` | Service Advisor      | Job orders, technicians, inspections, attachments     |
| `PURCHASING`      | Purchasing           | Purchase requests, purchase orders, supplier invoices |
| `DCS`             | Disbursement Control | Approved disbursements, payments, proof of payment    |

Rules:

1. Missing or invalid demo-role state always resolves to `ADMIN`.
2. Role state must have one typed source of truth; do not duplicate role logic
   across pages.
3. The header must show `Demo mode`, the active role, and a role-switch action.
4. Switching roles must preserve the current route where possible and must not
   require a page reload to update navigation.
5. Every role-sensitive action must use the shared demo actor/policy helper.
6. Do not call production `requireSession` or redirect to `/login` in demo mode.

The splash entry state must not prevent direct deterministic navigation to
internal demo routes used by verification and walkthroughs.

## 2. Authority and implementation order

When documents disagree, use this order:

1. This playbook for demo behavior and acceptance criteria.
2. [`docs/DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) for visual tokens and layout.
3. [`docs/PROJECT-SPEC.md`](./PROJECT-SPEC.md) for domain terminology and
   business requirements, interpreted through the demo boundary above.
4. [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) and `AGENTS.md` for runtime and
   repository safety rules.
5. Historical phase results and handoffs only as evidence, never as proof that
   an incomplete feature is complete.

The repository remains a single source repository. Demo and production are
runtime/build profiles of the same codebase, not separate applications.

Implementation sequence:

1. Establish demo profile, actor state, navigation, and seeded reset behavior.
2. Complete data contracts and validation before polishing individual screens.
3. Complete the cross-module workflow from customer through collection.
4. Complete role simulation and approval boundaries.
5. Complete attachments, exports, reports, and accounting views.
6. Apply the visual system and motion consistently across all routes.
7. Add focused tests, browser workflow tests, and accessibility checks.
8. Run the containerized verification commands and update the handoff evidence.

For deployment-specific requirements, follow
[`REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md`](./REMOTE-DEMO-DEPLOYMENT-PLAYBOOK.md).

## 3. Functional definition of done

The demo is not complete until each item below works with seeded data and with
freshly created records.

### 3.1 Customers and vehicles

- Customer create, list, search, view, and edit.
- TIN, billing address, phone, email, and multiple contact persons.
- Vehicle linked to exactly one customer.
- Plate, VIN/chassis, engine number, year, make, model, color, transmission,
  and odometer fields.
- Customer detail shows a complete service-history timeline.

### 3.2 Quotations and job orders

- Itemized labor and parts lines with quantity, unit price, discount, net, and
  totals.
- Quote lifecycle includes draft, approval, rejection, and conversion.
- Approved quote converts to one job order while retaining the source quote ID
  and cloning all items.
- Job order captures advisor, Cube Topper, promised date/time, payment mode,
  insurer/LOA, technician, vehicle, and customer.
- Job status visibly supports `PARTS_PENDING`; it must never render as `DRAFT`.
- Job order timeline supports status events, notes, technician assignment, and
  inspection/photo attachments.

### 3.3 Purchasing and supplier invoices

- Purchase request can originate from a job order or general replenishment.
- Supplier is stored as structured data, not embedded only in notes or item text.
- General Manager approval is required before a purchase order is released.
- Supplier invoice supports multiple line allocations across multiple job orders.
- Allocation totals must equal the supplier invoice total, with server-side
  validation and an explicit remainder/error state.
- Allocated parts cost appears in every affected job-cost sheet.

### 3.4 Expenses, disbursements, and DCS

- OPEX form follows the supplied reference structure.
- General Manager approval is required before disbursement release.
- DCS sees only releasable, approved disbursements.
- DCS has no approve action in its UI or action policy.
- Payment records method, reference, date, amount, and proof of payment.
- Proof upload, download, and empty/error states are demonstrable locally.

### 3.5 Billing, collections, costing, and exports

- Invoice shows labor, parts, miscellaneous, subtotal, 12% VAT, and grand total.
- Invoice includes the exact footer:
  `THIS IS NOT AN OFFICIAL RECEIPT. NOT VALID FOR CLAIMING INPUT TAX`.
- Payments update AR status and reject invalid, negative, or overpaid amounts.
- Job costing shows estimated versus actual labor, parts, expenses, revenue,
  margin, and a visual job timeline.
- Admin accounting view provides demo read-only GL/AP/JE summaries and
  deterministic CSV, JSON, and Excel-compatible exports for customers, vendors,
  bills, expenses, invoices, collections, and payments.

## 4. Demo data and deterministic behavior

- Seed data must tell a coherent story: intake → quote → approval → job order →
  parts request → supplier invoice → completion → billing → collection.
- Include at least one record for every important empty, pending, approved,
  rejected, overdue, paid, and error state.
- `scripts/reset-local.sh` must return the demo to the same known state.
- The public remote demo must automatically restore its fictional seeded state
  every 30 minutes, including removal of demo uploads. A manual reset command
  must remain available for operators.
- The reset job must run as a rootless user-level systemd timer, use the tracked
  reset implementation, and never target production data or services.
- Demo data must be fictional and safe to display in screenshots or screen shares.
- Number generation must be collision-safe and deterministic enough for repeatable
  walkthroughs.
- Monetary values must use exact decimal or integer-minor-unit calculations;
  floating-point arithmetic is not acceptable for persisted financial totals.

## 5. UI and UX contract

The product should feel like a calm, modern operations cockpit: high information
density, strong hierarchy, quick scanning, and restrained motion. It must look
like one product across every module.

### 5.1 Visual system

Use the existing tokens in `docs/DESIGN-SYSTEM.md`:

- LeMans Racing Red `#d32f2f` for brand accents and primary actions only.
- Deep Slate `#0f172a` for primary text.
- Off-white application canvas `#f8fafc` and white elevated surfaces.
- Functional success, warning, danger, and info colors only for their semantic
  meaning; do not turn the demo into a red danger dashboard.
- Fluid wrapper: `w-full max-w-[1920px] mx-auto px-6 lg:px-8 xl:px-10`.
- Spacing uses 4px multiples.
- Body and input text starts at 16px; buttons and table actions never wrap.
- Use one icon family, consistent stroke weight, and accessible labels.

### 5.2 Interaction and motion

- Every clickable control has hover, focus-visible, pressed, disabled, and busy
  states where applicable.
- Use short transitions for color, opacity, border, and elevation; do not animate
  layout unnecessarily.
- Prefer opacity/transform over large positional movement.
- Use progressive-enhancement View Transitions for route or record transitions
  only when supported; the app must work normally without the API.
- Always honor `prefers-reduced-motion: reduce`; remove non-essential movement,
  large scaling, and parallax. Verify this with a browser media-emulation test,
  not CSS inspection alone.
- Motion must communicate continuity or feedback, never delay task completion.

### 5.3 Four-state component contract

Every data-dependent page and component explicitly implements:

1. Loading: geometry-matched skeleton.
2. Empty: explanation, next action, and no dead-end blank panel.
3. Error: plain-language message, retry action, and preserved context.
4. Success/default: populated content with clear status and next action.

### 5.4 Accessibility contract

- Target WCAG 2.2 AA; preserve the existing AAA contrast ambition for primary
  text where practical.
- Keyboard navigation must be complete and focus must be visible and not hidden.
  Add a consistent `:focus-visible` ring to links, buttons, inputs, selects,
  textareas, tabs, role switchers, and modal actions.
- Touch targets are at least 44×44 CSS pixels; desktop controls remain comfortably
  clickable.
- Status is never conveyed by color alone.
- Dialogs trap focus correctly and return focus to the invoking control.
- Tables have meaningful headers; forms have labels, descriptions, and errors.
- Use semantic headings, landmarks, live regions for async status, and text
  alternatives for meaningful images.
- Keep `prefers-reduced-motion: reduce` behavior; disable nonessential
  animations when the user prefers reduced motion.

## 6. Engineering rules for the implementation agent

- Read this document before changing code.
- Inspect existing code and preserve unrelated user changes.
- Use `apply_patch` for edits; do not rewrite entire files unnecessarily.
- Keep all builds, tests, migrations, and app execution inside rootless Podman.
- Do not use Compose, privileged containers, host networking, broad mounts, or
  published database ports.
- Do not perform remote deployment, SSH, DNS, backup, or production changes
  without an explicit user request.
- Validate all user input on the server/action boundary even though the demo has
  no authentication.
- Keep role-policy decisions centralized and test each role explicitly.
- Do not mark a requirement complete because a page or placeholder exists.
  Demonstrate the full action, persistence, feedback, and error path.
- Search official framework and standards documentation before adopting a new
  API or dependency; record the source and date in the handoff.

## 7. Documentation and Git synchronization

Documentation is part of the implementation, not a final optional chore. Every
code, configuration, schema, seed, container, deployment, or UX change must
update all affected documentation and guides in the same change set.

At minimum, update the relevant requirement/specification, design or operating
guide, agent handoff, verification evidence, and README/index entry when their
content changes. Remove or mark stale claims rather than allowing contradictory
completion statements to remain authoritative.

Git workflow:

1. Inspect `git status` and preserve unrelated user changes.
2. Use local `git` for local branches, staging, commits, and local history.
3. Run formatting, focused tests, and required Podman verification before commit.
4. Use the official GitHub CLI (`gh`) for remote GitHub operations.
5. Keep the remote URL on HTTPS; do not use SSH or SSH keys.
6. Push only the intended branch/commit and report the commit, branch, and remote
   result in the handoff.
7. Never stage or commit unrelated dirty-worktree files merely to make a release
   appear complete.

When a change cannot be safely committed because unrelated work overlaps the
same file, document the exact blocker and leave the user's work untouched.

## 8. Required verification

Run from the repository root:

```bash
export PATH="/opt/podman/bin:$PATH"
podman machine start
./scripts/build.sh demo
./scripts/build.sh prod
./scripts/verify-local.sh
./scripts/run-local.sh
./scripts/verify-vertical-slice.sh
./scripts/stop-local.sh
```

The verification result must explicitly report:

- build, formatting, ESLint, and type-check status (`npm run build`,
  `npm run format:check`, `npm run lint`, and `npm run typecheck`);
- unit/integration test status;
- browser workflow status for each simulated role;
- accessibility (visible focus, target sizing, reduced motion, ARIA live/error
  regions) and reduced-motion checks;
- database port exposure (must be zero published host ports);
- remaining warnings and known limitations.

Do not report “verification complete” if any check failed or was skipped.

The current remediation baseline and unresolved findings are tracked in
[`reviews/NEXT-AGENT-REMEDIATION-REPORT-2026-08-11.md`](../reviews/NEXT-AGENT-REMEDIATION-REPORT-2026-08-11.md).

## 9. Official guidance used

Review these sources before implementation and again before handoff:

- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js authentication and authorization guidance](https://nextjs.org/docs/app/guides/authentication)
- [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [Next.js self-hosting guidance](https://nextjs.org/docs/app/guides/self-hosting)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [WCAG 2.2 changes](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- [OWASP ASVS](https://github.com/OWASP/ASVS)
- [MDN reduced-motion guidance](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)
- [Playwright `page.emulateMedia`](https://playwright.dev/docs/next/api/class-page)
- [Playwright projects and device emulation](https://playwright.dev/docs/test-projects)
- [systemd timers](https://man7.org/linux/man-pages/man5/systemd.timer.5.html)
- [MDN View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [goose migrations](https://github.com/pressly/goose)
- [Podman Quadlet](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html)

At the time of this playbook update, the repository baseline is Next.js 16.3.0,
React 19.2, Tailwind CSS 3.4, Go latest (`golang:alpine`), and PostgreSQL latest
(`postgres:alpine`). Review the current official guidance before planning any
further upgrades:

- [Next.js 16 self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Next.js `output: 'standalone'`](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output)
- [React 19](https://react.dev)
- [Go releases](https://go.dev/doc/devel/release)
- [goose migrations](https://github.com/pressly/goose)
- [sqlc documentation](https://docs.sqlc.dev)

Treat a major version upgrade as a separate, compatibility-tested work item;
never perform a blind dependency migration while implementing business workflows.

Framework upgrades must be planned and tested; do not perform a blind major
version upgrade while implementing the demo feature set. Production promotion
must record the demo commit/image digest, verification results, migration plan,
runtime configuration differences, and rollback target.
