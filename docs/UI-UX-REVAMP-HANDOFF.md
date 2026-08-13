# UI/UX revamp handoff

- **Status**: IMPLEMENTED & VERIFIED

- **Version**: 1.0.0
- **Updated**: 2026-08-13
- **Audience**: Google Antigravity, UI engineers, UX reviewers, and coding agents
- **Product**: Le Mans Operations & Job Cost Management System demo

This document is the implementation brief for a complete demo UI/UX revamp. It
describes the current product and the outcome the next agent must deliver. It
does not replace the demo business rules, API contracts, deployment playbook,
or security boundaries. If this document conflicts with the current runtime,
`CURRENT-STATE.md` and `DEMO-IMPLEMENTATION-PLAYBOOK.md` remain authoritative
for facts; this handoff is authoritative for the intended revamp direction.

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
- Replace the long flat navigation strip with a clear information hierarchy:
  a primary workspace switcher, a compact active-workflow trail, and a role-aware
  secondary navigation or command menu.
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

The central visual model should be a connected operational flow:

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

Represent that flow with a reusable stepper or timeline that shows completed,
current, blocked, and future stages. Do not infer business state only from
color. Each stage must expose text, status, timestamp or amount when available,
and a link to the relevant record. The visualization must remain useful on a
small screen and with a keyboard or screen reader.

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
- 44px touch targets where practical,
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

## 6. Required deliverables

1. A revised shell and navigation model with a route/state map.
2. A reusable workflow visualization used on Overview and the relevant detail
   pages, not a one-off illustration.
3. Redesigned list, detail, create, approve, payment, and costing experiences.
4. Responsive behavior for phone, tablet, and desktop widths.
5. Explicit loading, empty, error, success, and access-denied states.
6. Keyboard and screen-reader checks for navigation, filters, tables, dialogs,
   steppers, and mutation feedback.
7. Updated screenshots or visual test evidence where the repository supports it.
8. Updated `CURRENT-STATE.md`, `DEMO-IMPLEMENTATION-PLAYBOOK.md`,
   `DESIGN-SYSTEM.md`, and this handoff when behavior or acceptance criteria
   change.

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
- The existing rootless Podman validation, API tests, and Playwright suite pass.
- The public subpath and logo remain correct in the built demo.

## 8. Source guidance

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [WCAG 2.2: consistent navigation](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html)
- [Next.js linking and navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating)
- [Next.js accessibility](https://nextjs.org/docs/architecture/accessibility)
- [Next.js loading UI and streaming](https://nextjs.org/docs/app/getting-started/linking-and-navigating#streaming)
