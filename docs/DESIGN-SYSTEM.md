# Design system

- **Document Version**: 2.3.0
- **Updated**: 2026-08-15
- **Audience**: UI engineers, reviewers, and mobile developers (SwiftUI / Jetpack Compose)
- **Client Brand**: Le Mans Service Plus OPC (Angeles City, Pampanga)

---

## Design principles and sources

This design system draws from these sources:

1. **Client Brand Identity**: Official logo for **Le Mans Service Plus OPC** (`references/branding/logo.jpg`), featuring a racing-inspired shield badge with Le Mans Racing Red (`#d32f2f`), Crisp White (`#ffffff`), and Dark Slate (`#0f172a`). The runtime copy is `public/lemans-service-plus-logo.jpg`, rendered in `Header` and `DemoSplash` with base-path-aware direct asset delivery and registered as the app icon.
2. **UI Architecture Inspiration**: ColdTrace Operations Dashboard (`references/design-inspiration/coldtrace-ui-mockup.webp`), featuring a modern light interface, elevated cards, subtle borders, high-visibility metric displays, and data-dense tables.
3. **UI context guides**: Blueprints in `references/prompts/` define reusable interface patterns, four visual states, and cross-platform alignment for web, iOS (SwiftUI), and Android (Jetpack Compose).
4. **Current web standards and framework guidance (reviewed 2026-08-14)**:
   - **Readable Density**: Context-aware centered shells (`max-w-screen-2xl` for the app frame, narrower wrappers for forms and error states) with horizontal scrolling for genuinely wide tables.
   - **High-Readability Typography**: 16px baseline body text and high-contrast typography designed for users wearing glasses or viewing under shop lighting.
   - **Role-Aware RBAC Navigation**: Navigation items filtered by active role; explicit 403 "Access Restricted" views instead of silent redirects.
   - **Accessible Target Sizing**: Minimum 44x44px touch/click targets with focus ring states.
   - **Workflow clarity**: The completed end-to-end workflow visualization and
     navigation hierarchy are recorded in
     [`UI-UX-REVAMP-HANDOFF.md`](./UI-UX-REVAMP-HANDOFF.md); implementation must
     preserve current route, role, and API contracts.
   - **WCAG 2.2 AA baseline**: Use the current W3C Recommendation as the
     accessibility baseline. The product policy intentionally keeps 44x44px
     controls, visible focus, clear status text, and reduced-motion support.
   - **ARIA APG patterns**: Prefer native HTML controls. When behavior needs
     ARIA, expose the accessible name, state, relationship, and keyboard path;
     the grouped navigation uses `aria-expanded`, `aria-controls`, and
     `aria-current` for its disclosure and route state.
   - **Next.js App Router**: Keep the shared shell interactive during navigation;
     use a quiet route boundary, full prefetching for the small grouped primary
     navigation, clear error/not-found UI, optimized metadata, static image
     handling, and accessibility linting in the App Router shell. The simulated
     entry action uses a base-path-aware server-action form with a hydrated
     fetch enhancement, explicit timeout/error feedback, and a return to the
     base-path overview after setting its UX cookie; ordinary section changes
     remain soft client navigations.
     Browser-side mutations use the same-origin `/api/proxy/[...path]` route;
     the internal Go API hostname remains server-only.
   - **SmoothUI / Motion**: Use the requested SmoothUI collection as a motion
     reference, with compositor-friendly CSS transform/opacity transitions.
     Honor user reduced-motion preferences, keep the wrapper server-rendered,
     and never make animation a prerequisite for task completion.
   - **Tailwind compatibility**: Tailwind CSS v4 is the current major release,
     but this focused redesign retains the pinned Tailwind CSS 3.4.10 stack. A
     v4 migration changes CSS configuration and browser support and must be a
     separately planned, compatibility-tested work item.

   Official references: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [ARIA
   Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/), [ARIA disclosure
   pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/), [ARIA keyboard
   interface guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/),
   [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist),
   and [Tailwind CSS v3-to-v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide).

---

## Visual identity and semantic palette

> [!IMPORTANT]
> **Prohibited Interpretation Rule**: Words like "internal", "demo", "confidential", or "not for production" MUST NOT be used to justify a harsh red danger theme across the interface. Le Mans Racing Red (`#d32f2f`) is a **brand accent** for key primary actions, active tabs, and logo accents. Red alert/danger colors MUST be reserved strictly for real validation errors, stock shortages, system alerts, or destructive actions (e.g., voiding a JO).

### Color Token Palette

```css
:root {
  /* Brand Tokens (Derived from Logo) */
  --brand-primary: #d32f2f; /* Le Mans Racing Red */
  --brand-primary-hover: #b71c1c; /* Dark Red Hover */
  --brand-primary-light: #ffebee; /* Light Red Tint for Badges */
  /* Implementation note: applied across src/app/page.tsx, src/components/DemoSplash.tsx,
     src/app/customers/page.tsx, src/app/quotations/page.tsx,
     src/app/job-orders/page.tsx, src/app/job-orders/[id]/page.tsx,
     src/app/job-costing/page.tsx, src/app/job-costing/[id]/page.tsx, src/app/purchasing/page.tsx,
     src/app/expenses/page.tsx, src/app/dcs/page.tsx, src/app/invoices/page.tsx,
     and src/app/invoices/[id]/page.tsx. */

  /* Neutral Slate Palette (High Contrast & Low Eye Strain) */
  --bg-app: #f8fafc; /* Clean Off-White Application Canvas */
  --bg-surface: #ffffff; /* Pure White Elevated Card Surfaces */
  --bg-subtle: #f1f5f9; /* Subtle Input & Secondary Backgrounds */

  /* Typography & Border Neutrals (WCAG AAA Target > 7:1) */
  --text-primary: #0f172a; /* Deep Slate for Primary Headings & Data */
  --text-secondary: #334155; /* Dark Slate for Labels & Secondary Copy */
  --text-tertiary: #64748b; /* Muted Slate for Timestamps & Secondary Badges */
  --border-subtle: #e2e8f0; /* Fine Light Card & Table Divider Borders */
  --border-strong: #cbd5e1; /* Interactive Control Borders */

  /* Semantic Status Colors (Functional Only) */
  --status-success-bg: #ecfdf5; /* Emerald Light Tint */
  --status-success-text: #047857; /* Emerald Green (Completed, Approved) */
  --status-warning-bg: #fffbeb; /* Amber Light Tint */
  --status-warning-text: #b45309; /* Amber Yellow (Pending Approval, In Progress) */
  --status-danger-bg: #fef2f2; /* Rose Light Tint */
  --status-danger-text: #b91c1c; /* Rose Red (Overdue AR, Rejected, Error) */
  --status-info-bg: #eff6ff; /* Blue Light Tint */
  --status-info-text: #1d4ed8; /* Blue (Draft, Info) */

  /* Elevation Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
  --shadow-surface: 0 18px 42px -30px rgba(15, 23, 42, 0.48);
  --shadow-raised: 0 14px 30px -24px rgba(211, 47, 47, 0.45);
}
```

The current implementation uses the same tokens in `src/app/globals.css` and
adds a restrained dot texture to the Off-White canvas. Texture is decorative
only and never carries status meaning. Reusable `.surface-card`,
`.surface-card-muted`, `.surface-card-inset`, `.action-primary`,
`.action-secondary`, `.nav-rail`, `.workflow-grid`, and `.utility-label` classes
are available to the shell, overview, forms, tables, and detail surfaces.
The charcoal navigation colors (`#17191d`, `#22252b`, and `#343840`) provide a
quiet contrast field for the logo-derived red accent. Logo URLs use
`getBasePath()` and `unoptimized` image delivery so the branded asset remains
valid under both `/lemans/demo` and `/lemans` deployments.

The seven-stage workflow is an Overview-only responsive card rail: it uses readable cards at
desktop widths and a single-column stack on narrow screens. Titles and
descriptions must wrap; truncation is not allowed when it removes the meaning
of a workflow stage. The visualizer receives the active demo role and renders
only permitted stage links; the dashboard applies the same policy to metrics,
financial summaries, and recent job-order records. Data tables keep genuinely
wide records inside their own horizontal scroll region so the page itself
remains stable on mobile.

Overview calls to action and detail-page actions are permission-aware. The
active simulated role appears in the overview eyebrow, and actions that the
role cannot perform are not rendered. `StatusBadge` is a static semantic badge;
live-region semantics belong only to real asynchronous status changes.

The app shell also publishes `metadataBase`, Open Graph, Twitter summary, and
canonical metadata using the tracked logo asset. This keeps the public demo’s
brand identity intact when links are shared while preserving base-path-aware
asset URLs.

---

## 3. High-Readability Typography Scale & Spacing Grid

### Accessible Typography Scale

- `text-3xl` / `text-4xl` (32px-36px, font-bold): Primary KPI metric numbers.
- `text-2xl` (24px, font-semibold): Main page headers and section titles.
- `text-xl` (20px, font-semibold): Card container titles and modal headers.
- `text-base` (16px, font-medium): Baseline body text, form input text, table cell primary values.
- `text-sm` (14px, font-medium): Navigation tabs, table column headers, form field labels.
- `text-xs` (12px, font-medium): Status pills, metadata tags.

### Spacing Grid & Readable Container Constraints

- The app shell uses `w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8`; page content should use a narrower `max-w-*` wrapper when the task is reading or editing rather than scanning a wide table.
- Implemented in `src/app/layout.tsx` and `src/components/Header.tsx`.
- All padding, margin, and gap values MUST follow strict 4px multiples (`p-2` [8px], `p-4` [16px], `p-6` [24px], `p-8` [32px]).
- Table action buttons MUST enforce `whitespace-nowrap inline-flex items-center justify-center h-9 px-4` to prevent awkward line breaks (e.g. `View RA`).

---

## 4. Role-Aware RBAC Navigation & Error Feedback Contract

1. **Role-Aware Navigation**:
   - `Navbar` components MUST inspect the active user's permissions via `hasPermission(role, permission)`.
   - Links for un-permitted modules (e.g. `Accounting` for `ROLE-GM`) MUST be filtered out of the navigation menu.
   - The same centralized module policy in `src/lib/roles.ts` MUST guard direct
     module and detail URLs before their data-fetching calls.
   - Navigation implementation: `src/components/Navbar.tsx` accepts a `role` prop, keeps Overview visible as the shared landing surface, filters grouped workspaces by permission, and uses `stripBasePath()` for active-route state. Active tab uses Le Mans Red (`#d32f2f`).
2. **Explicit 403 Access Restricted View**:
   - When an un-permitted user attempts to access a restricted URL directly, the page MUST render a dedicated `<AccessDenied />` component.
   - Component location: `src/components/AccessDenied.tsx`.
   - Usage example: `src/app/accounting/page.tsx` renders `<AccessDenied />` for non-Admin users instead of calling `redirect('/')`; the same branded guard pattern applies to every restricted module and detail route.
   - **Prohibited**: Silent `redirect('/')` without user feedback is strictly forbidden.

---

## 5. Shared primitive and state conventions

- `SectionCard` provides a titled, optionally described surface with an optional
  action slot and a generated or caller-supplied heading id.
- `DataTable` keeps genuinely wide content inside an overflow region, uses
  scoped column headers, muted row hover, the shared surface treatment, and
  optional loading/error surfaces with an action slot for retry.
- `EmptyState` is a composed instructional surface rather than a blank panel.
- `FormField` provides a block label, required-field text alternative, field
  description, focus state, and inline error association.
- `Skeleton` uses `motion-safe:animate-pulse`; reduced-motion users see no
  continuous loading animation.
- Route-level `loading.tsx` is intentionally quiet during section navigation;
  error, not-found, and access-denied surfaces use the same branded shell
  language and safe plain-language recovery copy.
- `SmoothPageTransition` provides a short route/content enter motion using
  Motion's React integration. It keeps content visible and animates a small
  transform only, uses `useReducedMotion`, and lives inside the entry-gated
  shell.
- `html { scrollbar-gutter: stable; }` and the shared footer container preserve
  optical horizontal alignment when routes differ in scroll height.
- Primary navigation links use a stable inset outline for keyboard focus. They
  do not inherit the global animated focus shadow, which prevents a transient
  vertical edge from flashing beside the active item during route changes.
- `StatusBadge` uses compact bordered status labels. Red remains reserved for
  rejected/error semantics; the brand red is not used as a general alert theme.

## 6. Mandatory Multi-State Visual UI Contract

Every dynamic component MUST explicitly implement four discrete visual UI states:

1. **LOADING STATE**: Use a lightweight, layout-preserving loading boundary. Motion is optional (`motion-safe`) and must honor reduced-motion preferences; do not cover the shell with a full-page skeleton during section navigation.
2. **EMPTY STATE**: Render an accessible container displaying instructional copy, icon, and a primary call-to-action button.
3. **ERROR STATE**: Render clear error boundary notifications with action retry triggers (`onClick={retry}`).
4. **SUCCESS / DEFAULT STATE**: Render the fully hydrated, populated user interface.

---

## 7. Accessibility & Native Mobile Alignment

- **WCAG 2.2 target**:
  - Interactive targets meet a minimum **44x44px** size for touch and pointer input.
  - Visible keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-[#d32f2f]`).
  - Text contrast ratio exceeds 7:1 for primary copy.
- Use one meaningful page-level `h1` per route; utility branding and eyebrow
  labels must not compete with the route heading hierarchy.
- **Cross-Platform Preparedness**:
  - Web UI views map directly to declarative mobile view models (SwiftUI `@Observable` / Jetpack Compose `State`).
  - Fluid layouts prevent clipping across mobile, tablet, and desktop screens.

---

## 8. Demo Shell, Motion, and Role Simulation

The current demo profile has no real authentication. A login-like splash offers
`Enter as an Admin` as demo theatre; the entry cookie gates the dashboard shell
and direct module URLs until that action completes, without passwords, sessions,
or authentication redirects. The application exposes a visible role switcher
for all six business roles. The shell MUST show a persistent `Demo mode`
indicator and the active role. Role simulation and the entry cookie are not a
production security boundary.

Motion is functional and restrained:

- Use short transitions for color, opacity, border, and elevation changes.
- Prefer opacity and transform over large movement or layout animation.
- Use View Transition API features only as progressive enhancement with a normal
  navigation fallback.
- Honor `prefers-reduced-motion: reduce` by removing non-essential movement,
  large scaling, parallax, and continuous animation.
- Do not use motion as the only signal for status, success, failure, or focus.

Every page and data-dependent component must visibly support loading, empty,
error, and success/default states. The full interaction and acceptance contract
is maintained in [`DEMO-IMPLEMENTATION-PLAYBOOK.md`](./DEMO-IMPLEMENTATION-PLAYBOOK.md).

The Job Costing index is the reference scanning workflow: it keeps the wide
records table inside an overflow region, provides server-rendered search and
status filters, reports the current filtered result count, and shows summary
cards for estimated cost, actual cost, billed revenue, and net profit. Detail
views use a narrower reading surface with estimate-versus-actual variance and
links back to the source job order; the index table also exposes per-job
estimate-versus-actual variance for quick scanning.
