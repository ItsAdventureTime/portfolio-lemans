# Le Mans Operations Dashboard — UI/UX Overhaul Specification & Implementation Blueprint

- **Document Target**: Future AI Developer Agent / Coding Agent / Engineer
- **Client**: LeMans Service Plus OPC (Angeles City, Pampanga)
- **Project**: `lemans-bridge-dashboard`
- **Scope**: Screen space utilization, high-readability typography, role-aware RBAC navigation, brand color alignment, and component defect resolution.
- **Strict Constraint**: The executing agent must implement all specified code changes in Next.js 14 App Router and Tailwind CSS without breaking existing server actions, authentication, database schemas, or rootless Podman execution.

---

## 1. Executive Summary & Audit Findings

During empirical usability testing under the `ROLE-GM` (General Manager) demo persona, two critical UI/UX defects were identified:

### 1.1 Silent Redirect UX Anti-Pattern (`/accounting`)
- **Observed Behavior**: Clicking the "Accounting" tab in the navigation bar while logged in as `ROLE-GM` causes the browser URL to briefly hit `/accounting` and then silently bounce back to `/` (Overview) with no error toast, alert, or status message.
- **Root Cause**:
  1. `src/components/navbar.tsx` unconditionally renders the "Accounting" link for all logged-in roles.
  2. `src/app/accounting/page.tsx` checks `hasPermission(role, 'viewAccounting')`. Since `ROLE-GM` lacks this permission (Admin-only per AC-ACCT-001), it invokes `redirect('/')`.
- **Impact**: Users perceive the system as broken or buggy, assuming the button click failed.
- **Required Fix**:
  - **Navbar Filtering**: `src/components/navbar.tsx` must inspect the active user's role and filter out menu items for which the user lacks permissions.
  - **Explicit 403 Page**: `src/app/accounting/page.tsx` (and all protected routes) must render an explicit **403 Access Restricted UI Component** when unauthorized users access the URL directly, explaining why access is barred and offering a "Back to Dashboard" button.

### 1.2 Table Action Button Text Wrapping (`View RA`)
- **Observed Behavior**: In the "Recent Job Orders" table on `/`, the "View RA" action button wraps vertically into two lines ("View" on top, "RA" below) inside a dark background badge, distorting layout geometry.
- **Root Cause**: The `<Link>` action button in `src/app/page.tsx` (and similar table views) lacks `whitespace-nowrap` and flex alignment constraints.
- **Required Fix**: Enforce `whitespace-nowrap`, `inline-flex items-center justify-center`, minimum height `h-9` (36px), and horizontal padding `px-4` on all table action buttons.

---

## 2. Industry Grounding & Design Standards (2026 Guidelines)

### 2.1 WCAG 2.2 Accessibility & High-Readability Typography
- **Target Audience**: Auto center managers, service advisors, technicians, and finance officers who operate under shop lights or wear corrective glasses.
- **Typography Scale Adjustments**:
  - Base body text: Upgrade from `14px` (`text-sm`) to **`16px` (`text-base`)** (1rem baseline).
  - Table cells: Upgrade from `12px`/`14px` to **`15px-16px`** (`text-sm`/`text-base`) with high-contrast slate text (`text-slate-800`).
  - Metric big numbers: Upgrade from `24px` to **`32px-36px` (`text-3xl` / `text-4xl` font-bold)**.
  - Form labels: Minimum **`14px` (`text-sm` font-semibold)** in dark slate (`text-slate-700`), eliminating faint gray (`text-slate-400`) labels.
- **Touch & Click Target Sizing (WCAG 2.2 SC 2.5.8 & Mobile Standards)**:
  - All buttons, links, inputs, and tab triggers must meet a **minimum target height/width of 44x44px** on touch and mobile, and **minimum 36px-40px** on desktop with clear focus rings (`focus-visible:ring-2 focus-visible:ring-red-600`).

### 2.2 Fluid Screen Space Utilization & Full-Bleed Layouts
- **Zero Wasted Space Directive**: Replace restrictive fixed max-widths (`max-w-7xl` with wide empty left/right margins) with **fluid full-bleed containers (`w-full px-6 lg:px-8 xl:px-10 max-w-[1920px] mx-auto`)**.
- **Responsive Fluid Grid**:
  - Top KPI Bar: Use `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-5` to span full width cleanly.
  - Data Tables: Tables must stretch 100% width with `table-auto` or `table-fixed`, sticky headers (`sticky top-0 bg-slate-50 z-10`), and horizontal scrolling wrappers for narrow viewports.

### 2.3 Brand Palette & Visual Tone Alignment
- **Client Identity**: LeMans Service Plus OPC (Racing-inspired badge logo: LeMans Racing Red `#d32f2f`, Slate `#0f172a`, Crisp White `#ffffff`).
- **Color Token System**:
  - **Brand Primary Accent**: `bg-[#d32f2f]` / `text-[#d32f2f]` / `hover:bg-[#b71c1c]` (LeMans Racing Red) for primary action buttons, active tab indicators, and key metric accents.
  - **Card & Surface Backgrounds**: Elevated pure white (`#ffffff`) surfaces on subtle off-white canvas (`#f8fafc`) with crisp slate borders (`#e2e8f0` / `#cbd5e1`).
  - **High-Contrast Text**: `#0f172a` (Primary headings/metrics), `#334155` (Secondary copy), ensuring WCAG AAA contrast ratio (> 7:1).
  - **Status Badges**:
    - Completed / Approved: Emerald Green (`bg-emerald-50 text-emerald-700 border-emerald-200`)
    - Pending / In Progress: Amber Yellow (`bg-amber-50 text-amber-700 border-amber-200`)
    - Overdue / Draft: Sapphire Blue (`bg-blue-50 text-blue-700 border-blue-200`)
    - Danger / Voided: Rose Red (`bg-rose-50 text-rose-700 border-rose-200`)

---

## 3. Detailed Technical Blueprint for Code Changes

The executing agent must implement edits across the following core files:

### File 1: `src/components/navbar.tsx`
- **Objective**: Make navigation role-aware and enhance readability.
- **Changes Needed**:
  1. Accept user role prop or resolve session role.
  2. Map `navItems` with a `permission` key matching `src/lib/roles.ts` (e.g. `viewAccounting`, `disburseView`, etc.).
  3. Filter `navItems` so users only see links they have permission to access.
  4. Expand container padding (`px-6 lg:px-8 max-w-[1920px]`).
  5. Upgrade link typography: `text-sm font-semibold`, padding `px-4 py-2.5`, icon size `h-4 w-4`.

### File 2: `src/app/accounting/page.tsx` & Access Restricted Component
- **Objective**: Replace silent `redirect('/')` with an explicit 403 Access Restricted component.
- **Changes Needed**:
  1. Create a reusable component `src/components/access-denied.tsx`:
     - Displays a clear shield/lock icon.
     - Title: "Access Restricted".
     - Subtitle: "This module requires System Administrator privileges (`ROLE-ADMIN`). You are currently signed in as [Role Name]."
     - Action button: "Return to Overview" linking to `/`.
  2. Update `src/app/accounting/page.tsx` to render `<AccessDenied session={session} requiredRole="ROLE-ADMIN" />` when unauthorized, instead of calling `redirect('/')`.

### File 3: `src/app/page.tsx` (Dashboard Overview)
- **Objective**: Full screen width utilization, larger typography, button text wrap fix.
- **Changes Needed**:
  1. Change top outer wrapper from `max-w-7xl` to `w-full max-w-[1920px] mx-auto px-6 lg:px-8 space-y-8`.
  2. Welcome banner: Increase title to `text-2xl font-bold`, body to `text-sm text-slate-600`.
  3. KPI Cards: Increase numbers to `text-3xl lg:text-4xl font-extrabold text-slate-900`, card titles to `text-sm font-bold text-slate-600`.
  4. Job Orders Table:
     - Table font size: `text-sm` (14px) / `text-base` (15px-16px).
     - Column headers: `text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100/80 px-6 py-4`.
     - Action link: Add `whitespace-nowrap inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-sm`.

### File 4: `src/app/job-orders/page.tsx`, `src/app/purchasing/page.tsx`, `src/app/expenses/page.tsx`, `src/app/dcs/page.tsx`, `src/app/invoices/page.tsx`
- **Objective**: Apply layout width, typography, and button wrapping fixes across all module list/table pages.
- **Changes Needed**:
  1. Replace tight containers with fluid full-bleed containers (`w-full max-w-[1920px] mx-auto px-6 lg:px-8`).
  2. Add `whitespace-nowrap` to all table action cells and buttons.
  3. Ensure all form input fields use `text-base` (16px) to prevent mobile browser auto-zoom and increase legibility.

---

## 4. Prompt to Copy-Paste for the Executing LLM Agent

When delegating implementation to the coding agent, provide the following exact prompt:

```markdown
You are assigned to implement the UI/UX Overhaul for the Le Mans Operations & Job Cost Management System (`lemans-bridge-dashboard`) according to `docs/UI-UX-OVERHAUL-SPECIFICATION.md` and `docs/DESIGN-SYSTEM.md`.

### Instructions for Code Changes:
1. **Fix Silent Redirect & RBAC Navbar (`src/components/navbar.tsx` & `src/app/accounting/page.tsx`)**:
   - Filter navbar menu items based on the active user's role permissions (`hasPermission(role, permission)`).
   - Create `src/components/access-denied.tsx` to display an explicit 403 "Access Restricted" screen (with "Return to Overview" button).
   - In `src/app/accounting/page.tsx` (and any restricted routes), render `<AccessDenied />` instead of calling `redirect('/')` when unauthorized.

2. **Fix Table Action Button Wrapping (`src/app/page.tsx` & all table views)**:
   - Add `whitespace-nowrap inline-flex items-center justify-center` to all table action buttons (e.g. "View RA"). Ensure button text never wraps vertically into multiple lines.

3. **Maximize Screen Utilization & Fluid Layouts**:
   - Update layout containers across all page views (`src/app/**/page.tsx`) to use full fluid width (`w-full max-w-[1920px] mx-auto px-6 lg:px-8`).
   - Remove narrow max-width constraints that leave empty margins on wide monitors.

4. **High-Readability Typography & Touch Targets**:
   - Increase baseline body text to 16px (`text-base`).
   - Increase table cell font sizes to 14px-16px (`text-sm`/`text-base`) with high-contrast slate colors (`text-slate-800`).
   - Increase KPI metric values to 32px-36px bold (`text-3xl`/`text-4xl font-extrabold`).
   - Ensure all interactive buttons and inputs have minimum height 36px-44px for easy tapping/clicking.

5. **Brand Color Alignment**:
   - Apply LeMans Racing Red (`#d32f2f`, hover `#b71c1c`) as the primary brand accent for primary CTA buttons, active navigation indicators, and key brand highlights.

6. **Verification**:
   - Run `./scripts/verify-local.sh` and `./scripts/verify-vertical-slice.sh` inside rootless Podman to verify zero lint/type-check regressions and HTTP health checks pass.
```
