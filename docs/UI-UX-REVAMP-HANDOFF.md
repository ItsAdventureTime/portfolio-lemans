# UI/UX revamp handoff

- **Status**: IMPLEMENTED & VERIFIED

- **Version**: 1.2.0
- **Updated**: 2026-08-14
- **Audience**: Google Antigravity, UI engineers, UX reviewers, and coding agents
- **Product**: Le Mans Operations & Job Cost Management System demo

This document records the completed demo UI/UX revamp and its maintenance
acceptance criteria. It describes the current product and the interaction
decisions that must be preserved. It does not replace the demo business rules,
API contracts, deployment playbook, or security boundaries. If this document
conflicts with the current runtime, `CURRENT-STATE.md` and
`DEMO-IMPLEMENTATION-PLAYBOOK.md` remain authoritative for facts; this handoff
is authoritative for the implemented revamp direction.

## 1. Outcome

Make the demo feel like one coherent operations workspace rather than a set of
separate pages. A user should always know:

1. where they are,
2. what the current record or workflow stage is,
3. what action is available next,
4. what changed after an action, and
5. how to return to the broader workflow.

The redesign must reduce visual sprawl, shorten navigation paths, make the
workflow legible at a glance, and preserve the fictional data and role-based
demo behavior already implemented.

### Current implementation pass

The current shell and overview pass implements the following bounded changes:

- `Header` uses `public/lemans-service-plus-logo.jpg` as the visible brand asset,
  adds a compact service-center eyebrow, and keeps `Demo mode` and the active
  role visible in the utility header. The logo URL is base-path-aware and uses
  direct public-asset delivery so it renders correctly in the demo and
  production subpaths.
- `Navbar` keeps the existing role-filtered route map, but presents it as three
  keyboard-accessible groups: Workspace, Control, and Finance. Active styling
  is calculated after removing the configured base path, so `/lemans/demo` and
  `/lemans` retain the same route state. Overview remains available as the
  shared landing surface for every simulated role.
- `DemoSplash` uses a responsive two-column entry surface with the existing
  `Enter as an Admin` demo-theatre action, a visible no-auth explanation, and a
  non-interactive workflow preview. Entry errors and busy state remain inline.
- The overview now has a branded operating-picture header, decision-oriented
  count and finance sections, and a quieter recent-job-order surface. Existing
  data fetches, links, role behavior, and status values are unchanged.
- Shared `SectionCard`, `DataTable`, `EmptyState`, `FormField`, `Skeleton`, and
  `StatusBadge` primitives now share the same surface, spacing, focus, state,
  table-header, and semantic-markup conventions. `DataTable` also exposes
  optional loading and error surfaces with an action slot for retry.
- Global CSS adds the off-white micro-texture, tinted elevation, stronger focus
  treatment, motion-safe skeletons, reduced-motion support, and reusable action
  and surface classes. The visual foundation remains Racing Red `#d32f2f`,
  Deep Slate `#0f172a`, and Off-White `#f8fafc`.
- Route-level loading, error, not-found, and access-restricted surfaces now use
  the same branded surface/action language. Loading preserves the page shape
  with reduced-motion-safe skeletons; error boundaries keep diagnostic details
  in logs while showing plain recovery copy to users. The utility header uses a
  non-heading brand label so each route retains one clear page-level `h1`.

### Guidance review — 2026-08-14

This pass checked the current implementation against the [WCAG 2.2 W3C
Recommendation](https://www.w3.org/TR/WCAG22/), the [WAI-ARIA Authoring
Practices Guide](https://www.w3.org/WAI/ARIA/apg/), the [Next.js production
checklist](https://nextjs.org/docs/app/guides/production-checklist), and the
[Tailwind CSS v3-to-v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide).
The app keeps its pinned Next.js 16.3 and Tailwind CSS 3.4 stack; the review
applies current accessibility and App Router guidance without introducing a
major framework migration into a visual refinement.

### Verification recorded for this pass

- `npm run format:check`, `npm run lint`, `npm run typecheck`, and
  `npm run build` pass in a disposable rootless Podman container.
- `./scripts/build.sh demo` passes and produces the required demo web and Go
  image tags.
- `./scripts/build.sh prod` passes and produces the required production web and
  Go image tags from the same source.
- `./scripts/verify-e2e.sh` passes all 33 desktop, mobile, and reduced-motion
  Playwright tests, including focus rings, 44px targets, role switching,
  workflow mutations, and seeded data.
- Browser spot checks confirm both logo instances resolve under
  `/lemans/demo/`, mobile grouped navigation opens, and Overview remains
  available to the DCS simulated role.
- The full Go/API `verify-local.sh` pass remains the broader repository
  validation step when backend changes are included; this UI-only pass did not
  change backend sources.

## 2. Current product map

The current shell exposes these modules through `src/components/Navbar.tsx`:

| Module      | Route          | Primary job                                               |
| ----------- | -------------- | --------------------------------------------------------- |
| Overview    | `/`            | Cross-module operational summary                          |
| Customers   | `/customers`   | Customer and vehicle records; service history             |
| Quotations  | `/quotations`  | Create, approve, reject, and convert quotes               |
| Job Orders  | `/job-orders`  | Work execution, status, technicians, events, attachments  |
| Purchasing  | `/purchasing`  | Purchase requests, orders, supplier invoices, allocations |
| Expenses    | `/expenses`    | OPEX requests and approvals                               |
| DCS         | `/dcs`         | Disbursements, payments, and proof of payment             |
| Invoices    | `/invoices`    | Service invoices and customer payments                    |
| Job Costing | `/job-costing` | Estimate, actual, variance, and profitability review      |
| Accounting  | `/accounting`  | Admin-only summaries and exports                          |

Dynamic detail routes include customers, job orders, invoices, and job costing.
The Go API owns business rules, persistence, migrations, role policy, and
Backblaze presigned URLs. Do not duplicate those rules in the UI.

## 3. Design direction

### Shell and navigation

- Keep the branded LeMans Service Plus logo visible in the header and splash.
- Use the grouped primary navigation rail (Workspace, Control, and Finance) as
  the compact active-workflow command surface. Keep the breadcrumb as the
  secondary context trail on non-overview routes.
- Keep Overview, Customers, Job Orders, Purchasing, Invoices, and Accounting
  easy to reach. Group Quotations with Job Orders and DCS with Expenses only if
  the grouping remains obvious and keyboard accessible.
- Show the active role and `Demo mode` without making the role switcher look
  like authentication.
- Preserve direct URLs and role filtering. A hidden link must not be the only
  access path to a permitted page, and a forbidden direct URL must still render
  `AccessDenied` with a clear return action.
- Provide breadcrumbs or an equivalent context trail on every detail page.

### Page composition

- Use a constrained reading width for forms, detail pages, and decision panels.
- Use wide, horizontally scrollable regions only for genuinely wide tables.
- Start each page with a concise title, one-sentence purpose, and the primary
  action. Move secondary actions into a contextual menu or secondary button.
- Keep summary metrics few and decision-oriented. Every metric needs a label,
  unit, time/context qualifier, and a path to the underlying records.
- Make filters persistent within a page and make the active filters visible.
- Use progressive disclosure for secondary fields, audit details, attachments,
  and long event histories.

### Workflow visualization

The central visual model is a connected operational flow:

```text
Customer + vehicle
        ↓
Quotation → approval → conversion
        ↓
Job order → assignment → work status → events/attachments
        ↓
Purchasing → supplier invoice allocation → recorded cost
        ↓
Invoice → collection
        ↓
Job costing + accounting review
```

The implemented visualizer represents that flow with a reusable stepper that
shows completed, current, blocked, and future stages. Do not infer business
state only from color. Each stage must expose text, status, timestamp or amount
when available, and a link to the relevant record. The visualization must remain
useful on a small screen and with a keyboard or screen reader.

### Interaction quality

- Use `next/link` for internal navigation so App Router prefetching and client
  transitions remain available.
- Use route-level `loading.tsx` or nested Suspense boundaries for dynamic pages;
  show lightweight, layout-preserving feedback instead of a full gray overlay.
- Preserve the shared shell during transitions and keep navigation interruptible.
- Use inline success, error, empty, and loading states near the affected content.
- After role changes or server mutations, refresh the server-rendered data and
  announce the result with an accessible status message.
- Never treat a failed network response as success. Especially protect payment,
  attachment, approval, conversion, and export workflows.
- Confirm destructive or financially consequential actions and make recovery
  or cancellation explicit.

## 4. Accessibility and content requirements

Target WCAG 2.2 AA as the minimum bar:

- consistent navigation and repeated controls,
- visible keyboard focus and logical focus order,
- a minimum 44x44 CSS-pixel target for every interactive control,
- sufficient text and non-text contrast,
- descriptive page titles and headings for route announcements,
- status messages that do not steal focus,
- field-level errors with recovery instructions,
- confirmation and review before financial or irreversible actions,
- reduced-motion behavior for all non-essential animation.

Use plain US English. Prefer labels such as `Approve quotation`, `Assign
technician`, `Record payment`, and `View service history` over icon-only or
ambiguous labels. Preserve domain identifiers and status values exactly.

## 5. Implementation boundaries

- Keep the demo no-auth theatre: splash entry, Admin default, visible role
  switcher, and simulated policy behavior remain.
- Keep `NEXT_PUBLIC_BASE_PATH` behavior for `/lemans/demo` and `/lemans`.
  Internal links must remain base-path safe.
- Do not add a separate production source tree, login system, external `.env`,
  compose workflow, or new deployment mechanism.
- Keep all application execution, builds, tests, and local validation inside
  rootless Podman. Remote deployment remains a separate authorized operation.
- Preserve API routes, request/response contracts, role policy, seeded data, and
  the shared `bridge-ph` Backblaze bucket convention (`lemans/demo` demo prefix,
  `lemans` production prefix) unless a separate approved change expands scope.
- Reuse existing design tokens, logo asset, UI primitives, and status semantics
  before adding new visual systems.

## 6. Delivered components and maintenance checks

1. Revised shell and grouped navigation model with a route/state map.
2. Reusable workflow visualization used on Overview and the relevant detail
   pages, not a one-off illustration.
3. Redesigned list, detail, create, approve, payment, and costing experiences.
4. Responsive behavior for phone, tablet, and desktop widths.
5. Explicit loading, empty, error, success, and access-denied states.
6. Keyboard and screen-reader checks for navigation, filters, tables, dialogs,
   steppers, and mutation feedback.
7. Updated screenshots or visual test evidence where the repository supports it.
8. Synchronized `DESIGN-SYSTEM.md` and this handoff with the current shell,
   surface, primitive, and motion implementation.

## 7. Acceptance checklist

- A first-time user can enter the demo and reach a meaningful next action in
  under one minute.
- A user can trace a customer from quotation through job order, purchasing,
  invoicing, costing, and accounting without losing context.
- Every detail page provides a predictable way back to its list and parent
  workflow.
- Role switching updates navigation, visible actions, and server-rendered data
  without requiring a manual reload.
- The app remains usable without hover, with keyboard only, and with reduced
  motion enabled.
- No page relies on a gray full-screen loading mask or an icon without a label.
- Route-level loading, error, not-found, and access-denied states preserve the
  shared brand language, recovery action, and safe user-facing copy.
- Each route maintains a clear page-level heading hierarchy; utility branding is
  not used as a competing `h1`.
- The existing rootless Podman validation, API tests, and Playwright suite pass.
- The public subpath and logo remain correct in the built demo.

## 8. Source guidance

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.2: consistent navigation](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html)
- [Next.js linking and navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating)
- [Next.js accessibility](https://nextjs.org/docs/architecture/accessibility)
- [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [Next.js loading UI and streaming](https://nextjs.org/docs/app/getting-started/linking-and-navigating#streaming)
- [Tailwind CSS v3-to-v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
