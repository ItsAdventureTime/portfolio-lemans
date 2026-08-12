# Design system

- **Document Version**: 2.0.0
- **Audience**: UI engineers, reviewers, and mobile developers (SwiftUI / Jetpack Compose)
- **Client Brand**: LeMans Service Plus OPC (Angeles City, Pampanga)

---

## Design principles and sources

This design system draws from these sources:

1. **Client Brand Identity**: Official logo for **LeMans Service Plus OPC** (`references/branding/logo.jpg`), featuring a racing-inspired shield badge with LeMans Racing Red (`#d32f2f`), Crisp White (`#ffffff`), and Dark Slate (`#0f172a`).
2. **UI Architecture Inspiration**: ColdTrace Operations Dashboard (`references/design-inspiration/coldtrace-ui-mockup.webp`), featuring a modern light interface, elevated cards, subtle borders, high-visibility metric displays, and data-dense tables.
3. **UI context guides**: Blueprints in `references/prompts/` define reusable interface patterns, four visual states, and cross-platform alignment for web, iOS (SwiftUI), and Android (Jetpack Compose).
4. **2026 Modern UX & WCAG 2.2 Standards**:
   - **Readable Density**: Context-aware centered shells (`max-w-screen-2xl` for the app frame, narrower wrappers for forms and error states) with horizontal scrolling for genuinely wide tables.
   - **High-Readability Typography**: 16px baseline body text and high-contrast typography designed for users wearing glasses or viewing under shop lighting.
   - **Role-Aware RBAC Navigation**: Navigation items filtered by active role; explicit 403 "Access Restricted" views instead of silent redirects.
   - **Accessible Target Sizing**: Minimum 44x44px touch/click targets with focus ring states.

---

## Visual identity and semantic palette

> [!IMPORTANT]
> **Prohibited Interpretation Rule**: Words like "internal", "demo", "confidential", or "not for production" MUST NOT be used to justify a harsh red danger theme across the interface. LeMans Racing Red (`#d32f2f`) is a **brand accent** for key primary actions, active tabs, and logo accents. Red alert/danger colors MUST be reserved strictly for real validation errors, stock shortages, system alerts, or destructive actions (e.g., voiding a JO).

### Color Token Palette

```css
:root {
  /* Brand Tokens (Derived from Logo) */
  --brand-primary: #d32f2f; /* LeMans Racing Red */
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
}
```

---

## 3. High-Readability Typography Scale & Spacing Grid

### Accessible Typography Scale

- `text-3xl` / `text-4xl` (32px-36px, font-extrabold): Primary KPI metric numbers.
- `text-2xl` (24px, font-bold): Main page headers and section titles.
- `text-xl` (20px, font-bold): Card container titles and modal headers.
- `text-base` (16px, font-medium/semibold): Baseline body text, form input text, table cell primary values.
- `text-sm` (14px, font-semibold): Navigation tabs, table column headers, form field labels.
- `text-xs` (12px, font-bold): Status pills, metadata tags.

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
   - Navigation implementation: `src/components/Navbar.tsx` accepts a `role` prop and filters `navItems` by permission. Active tab uses LeMans Red (`#d32f2f`).
2. **Explicit 403 Access Restricted View**:
   - When an un-permitted user attempts to access a restricted URL directly, the page MUST render a dedicated `<AccessDenied />` component.
   - Component location: `src/components/AccessDenied.tsx`.
   - Usage example: `src/app/accounting/page.tsx` renders `<AccessDenied />` for non-Admin users instead of calling `redirect('/')`.
   - **Prohibited**: Silent `redirect('/')` without user feedback is strictly forbidden.

---

## 5. Mandatory Multi-State Visual UI Contract

Every dynamic component MUST explicitly implement four discrete visual UI states:

1. **LOADING STATE**: Use a lightweight, layout-preserving loading boundary. Motion is optional (`motion-safe`) and must honor reduced-motion preferences; do not cover the shell with a full gray skeleton.
2. **EMPTY STATE**: Render an accessible container displaying instructional copy, icon, and a primary call-to-action button.
3. **ERROR STATE**: Render clear error boundary notifications with action retry triggers (`onClick={retry}`).
4. **SUCCESS / DEFAULT STATE**: Render the fully hydrated, populated user interface.

---

## 6. Accessibility & Native Mobile Alignment

- **WCAG 2.2 Compliance**:
  - Interactive targets meet minimum **44x44px** on touch and **36px-40px** on desktop.
  - Visible keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-[#d32f2f]`).
  - Text contrast ratio exceeds 7:1 for primary copy.
- **Cross-Platform Preparedness**:
  - Web UI views map directly to declarative mobile view models (SwiftUI `@Observable` / Jetpack Compose `State`).
  - Fluid layouts prevent clipping across mobile, tablet, and desktop screens.

---

## 7. Demo Shell, Motion, and Role Simulation

The current demo profile has no real authentication. A login-like splash may
offer `Enter as an Admin` as demo theatre; that action enters the `Admin`
simulated actor without passwords, sessions, or authentication redirects. The
application exposes a visible role switcher for all six business roles. The
shell MUST show a persistent `Demo mode` indicator and the active role. Role
simulation changes navigation and available workflow actions, but is not a
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
