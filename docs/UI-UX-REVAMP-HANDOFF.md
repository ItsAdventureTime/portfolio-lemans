# UI/UX revamp handoff

- **Status**: IMPLEMENTED & VERIFIED

- **Version**: 1.2.6
- **Updated**: 2026-08-15
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
  `/lemans` retain the same route state. Its module policy is shared with the
  primary route and detail guards, so direct URLs render a branded
  `AccessDenied` surface instead of loading restricted data. Overview remains
  available as the shared landing surface for every simulated role.
- `DemoSplash` uses a responsive two-column entry surface with the existing
  `Enter as an Admin` demo-theatre action, a visible no-auth explanation, and a
  non-interactive workflow preview. Entry errors and busy state remain inline.
- The entry cookie gates the complete dashboard shell: before entry, direct
  module URLs show only the branded splash; after entry, Header, Navbar,
  Breadcrumb, footer, and dashboard content render together.
- `DemoSplash` submits through a base-path-aware server-action form when client
  hydration is unavailable. The hydrated enhancement uses an eight-second
  timeout, same-origin request, actionable inline error, and a return to the
  base-path overview after success.
- Browser-side API mutations use the base-path-aware same-origin proxy, keeping
  internal Go API service names out of browser requests while preserving the
  shared API contract.
- The overview now has a branded operating-picture header, decision-oriented
  count and finance sections, and a quieter recent-job-order surface. The
  active demo role filters workflow links, sensitive dashboard records, and
  available actions while preserving the existing route contracts and status
  values.
- Shared `SectionCard`, `DataTable`, `EmptyState`, `FormField`, `Skeleton`, and
  `StatusBadge` primitives now share the same surface, spacing, focus, state,
  table-header, and semantic-markup conventions. `DataTable` also exposes
  optional loading and error surfaces with an action slot for retry.
- Global CSS adds the off-white micro-texture, tinted elevation, stronger focus
  treatment, motion-safe skeletons, reduced-motion support, and reusable action
  and surface classes. The visual foundation remains Racing Red `#d32f2f`,
  Deep Slate `#0f172a`, and Off-White `#f8fafc`.
- Non-heading UI copy uses regular weight for labels, descriptions, table
  headers, metadata, notes, and workflow labels. Medium weight is limited to
  controls or small semantic cues; semibold remains for headings and
  intentional numeric emphasis. Opaque rectangular surfaces, borders, icons,
  and state text carry emphasis without making routine copy shout.
- Shared focus treatment is layered deliberately: the global `:focus-visible`
  rule is in `@layer base`, and `.nav-link` keeps its component-layer override.
  This preserves a visible inset keyboard outline without the white outer ring
  appearing beside Accounting or another primary navigation item after a route
  change.
- The desktop nav scroller keeps `overflow-x-auto` for narrow layouts and
  explicitly clips vertical overflow. The pressed `translate-y-px` feedback
  therefore cannot create a transient scrollbar beside Accounting while the
  pointer is held.
- Route-level error, not-found, and access-restricted surfaces use the same
  branded surface/action language. The route loading boundary is intentionally
  quiet during section navigation so the shared shell stays responsive; form
  and mutation busy states remain inline and accessible. Error boundaries keep
  diagnostic details in logs while showing plain recovery copy to users. The
  utility header uses a non-heading brand label so each route retains one clear
  page-level `h1`.

### Shared table and action refinement — 2026-08-15

- `DataTable` now uses fixed layout and exposes optional alignment, numeric, and
  width metadata. Module tables declare stable widths so Customer No., JO No.,
  Invoice No., and related identifiers stay aligned across rows and routes.
- Table cells use middle alignment. Numeric columns are right-aligned with
  tabular numerals, while status columns are centered and status badges use a
  consistent inline height and line height.
- Dense approval, conversion, allocation, and supplier-invoice actions use
  `action-compact`: the control keeps a 44px hit area while its visual surface
  is inset to reduce perceived button height.
- The type hierarchy now favors regular body text and regular labels; heavier
  weights are reserved for page titles, identifiers, monetary values, and
  controls. Solid state surfaces make approved, current, completed, and error
  states scannable without bolding their copy.
- The existing `motion` dependency is the implementation boundary for the
  Motion/SmoothUI-inspired route interaction. It uses a short opacity and
  transform transition, honors `prefers-reduced-motion`, and does not delay
  navigation.

### Detail-view typography refinement — 2026-08-15

- Job costing, invoice, and job-order detail screens use 14–16px regular labels,
  readable supporting copy, and 18–20px semibold/tabular values only where
  scanning financial or record data benefits from emphasis.
- Secondary metrics, notes, lifecycle context, controls, and variance content
  use muted or inset rectangular surfaces so grouping carries the hierarchy;
  repeated bold or all-caps text is not used as the primary visual signal.
- `DataTable` uses a readable 16px body with 14px regular headers and preserves
  stable alignment for identifiers, quantities, statuses, and monetary values.

### Surface emphasis refinement — 2026-08-15

- Shared `surface-card-muted` and `surface-card-inset` surfaces now use solid
  tokens. Workflow states use explicit current, completed, and upcoming
  rectangles with readable contrast instead of relying on bold or color alone.
- Form labels, navigation labels, table headers, routine detail values, and
  workflow state copy no longer request medium weight by default. IDs and
  financial values retain quiet monospaced treatment; headings retain the page
  hierarchy.
- The seven-stage job-order stepper keeps readable labels in a contained
  horizontal scroll region on narrow screens. It does not truncate stage names.
- The visual treatment follows the SmoothUI reference language—quiet borders,
  solid tints, clear state grouping, and short interaction transitions—while
  the existing `motion/react` boundary remains the only animation dependency.

### Motion and focus refinement — 2026-08-15

- `SmoothPageTransition` is now a client component using the existing
  `motion/react` dependency. A pathname key replays a 180ms opacity/4px
  transform settle for each route without an exit phase, mode wait, or
  artificial navigation delay. A CSS enter fallback remains available when
  scripting is disabled.
- `MotionConfig` and `useReducedMotion` honor the user's reduced-motion
  preference. The reduced path removes route movement; CSS also disables
  non-essential animation. Hover, focus, pressed, and status states remain
  understandable without motion.
- `RouteScrollReset` no longer blurs the active element on every render. After
  a route change it focuses `#main-content` only when focus was in navigation,
  route content, or the document body, preserving role-switcher continuity.
- Quick-add and supplier-invoice allocation dialogs now provide initial focus,
  Tab containment, Escape dismissal, and focus restoration. Their controls
  expose accessible names for icon-only actions.
- The root `loading.tsx` boundary now uses a quiet, layout-preserving skeleton;
  it does not block the shell or introduce a one-second navigation delay.

### Guidance review — 2026-08-15

This pass checked the current implementation against the [WCAG 2.2 W3C
Recommendation](https://www.w3.org/TR/WCAG22/), the [WAI-ARIA Authoring
Practices Guide](https://www.w3.org/WAI/ARIA/apg/), the [Next.js production
checklist](https://nextjs.org/docs/app/guides/production-checklist), and the
[Next.js Linking and Navigating guide](https://nextjs.org/docs/app/getting-started/linking-and-navigating),
[W3C reduced-motion technique C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39),
[WCAG contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum),
[Motion accessibility](https://motion.dev/docs/react-accessibility), [Motion for React](https://motion.dev/docs/react), the [SmoothUI
collection](https://github.com/educlopez/smoothui), and the [Tailwind CSS
v3-to-v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide).
The app keeps its pinned Next.js 16.3 and Tailwind CSS 3.4 stack; the review
applies current accessibility and App Router guidance without introducing a
major framework migration into a visual refinement.

### Verification recorded for this pass

- `npm run format:check`, `npm run lint`, `npm run typecheck`, and
  `npm run build` are run through the initialized Docker Sandbox; remote
  rootless Podman is reserved for VPS runtime activation.
- `jk-sbx-project exec -- ./scripts/build.sh demo` produces the required demo web and Go
  image tags.
- `jk-sbx-project exec -- ./scripts/build.sh prod` produces the required production web and
  Go image tags from the same source.
- `./scripts/verify-e2e.sh` covers all 57 desktop, mobile, and reduced-motion
  Playwright tests, including focus rings, 44px targets, role switching,
  workflow mutations, seeded data, no-hydration form submission, the browser API
  proxy, entry-error handling, and shared table/action alignment. The final full
  matrix passed 56 tests with one intentional mobile skip.
- Browser spot checks confirm both logo instances resolve under
  `/lemans/demo/`, mobile grouped navigation opens, Overview remains available
  to the DCS simulated role, and the DCS overview shows only its permitted
  workflow stage without recent job-order records. The entry gate hides the
  dashboard shell before entry, footer copy stays aligned between Overview and
  Invoices, and route content enters with reduced-motion-safe transform
  motion.
- The full Go/API `verify-local.sh` pass remains the broader repository
  validation step and has been rerun because the dashboard handler now applies
  role policy before returning role-sensitive data.
- The desktop Playwright regression holds the pointer down on every primary nav
  link and verifies the rail remains vertically clipped while preserving its
  keyboard focus styles.

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

- Keep the branded Le Mans Service Plus logo visible in the header and splash.
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

The implemented Overview visualizer represents that flow with a reusable stepper that
shows completed, current, blocked, and future stages. Do not infer business
state only from color. Each stage must expose text, status, timestamp or amount
when available, and a link to the relevant record. The visualization must remain
useful on a small screen and with a keyboard or screen reader.

### Interaction quality

- Use `next/link` for internal navigation so App Router prefetching and client
  transitions remain available. The small grouped primary navigation opts into
  full prefetching for dynamic sections.
- Keep the root `loading.tsx` boundary quiet during section navigation; use
  nested Suspense or local busy states only where asynchronous content needs
  immediate, layout-preserving feedback instead of a full-page overlay.
- `SmoothPageTransition` is a pathname-keyed client wrapper using
  `motion/react` with a short transform/opacity enter transition. Content
  remains visible while it moves a few pixels, it honors
  `prefers-reduced-motion`, and its CSS fallback does not hide server-rendered
  content when client JavaScript is unavailable.
- Keep `scrollbar-gutter: stable` and the shared footer container so centered
  footer copy does not shift when route height changes.
- Primary navigation keeps a stable inset keyboard-focus outline and avoids the
  global focus shadow during route changes, preventing a transient vertical edge
  beside the active item. Keep the shared rule in `@layer base` and the nav
  override in `@layer components` so the cascade remains deterministic.
- Keep the desktop nav rail's `overflow-y-hidden` paired with
  `overflow-x-auto`; pressed-state transforms must not create a scrollable edge.
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
- Keep the entry gate as a UX boundary only: direct module URLs show the splash
  before entry and the full shell after entry; this is not production auth.
- Keep `NEXT_PUBLIC_BASE_PATH` behavior for `/lemans/demo` and `/lemans`.
  Internal links must remain base-path safe.
- Do not add a separate production source tree, login system, external `.env`,
  compose workflow, or new deployment mechanism.
- Keep all application execution, builds, tests, and local validation inside
  the initialized Docker Sandbox with Docker. Remote rootless Podman remains a
  separate authorized runtime operation.
- Preserve API routes, request/response contracts, role policy, seeded data, and
  the shared `bridge-ph` Backblaze bucket convention (`lemans/demo` demo prefix,
  `lemans` production prefix) unless a separate approved change expands scope.
- Reuse existing design tokens, logo asset, UI primitives, and status semantics
  before adding new visual systems.

## 6. Delivered components and maintenance checks

1. Revised shell and grouped navigation model with a route/state map.
2. Reusable workflow visualization used on Overview as the orientation surface;
   module and detail pages use focused contextual status controls instead.
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
- No page relies on a full-screen loading mask or an icon without a label.
- The entry splash is the only pre-entry surface; direct module URLs cannot
  expose the dashboard shell before simulated entry.
- Route-level loading, error, not-found, and access-denied states preserve the
  shared brand language, recovery action, and safe user-facing copy.
- Each route maintains a clear page-level heading hierarchy; utility branding is
  not used as a competing `h1`.
- The existing Docker Sandbox validation, API tests, and Playwright suite pass.
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
- [MDN `:active` pseudo-class](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:active)
- [MDN `scrollbar-gutter`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scrollbar-gutter)
