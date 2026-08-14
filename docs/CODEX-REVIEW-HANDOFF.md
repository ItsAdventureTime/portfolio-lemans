# ChatGPT Codex Review & Remediations Handoff

- **Target Audience**: ChatGPT Codex / AI Code Reviewer
- **Project**: Le Mans Operations & Job Cost Management System (`lemans-bridge-dashboard`)
- **Client**: Le Mans Service Plus OPC
- **Domain**: Auto Service Center Operations, Job Costing, Procurement, Billing, and Financial Accounting
- **Repository Architecture**: Next.js 16.3 App Router (`src/`), Go 1.26 API (`backend/`), PostgreSQL on rootless Podman network
- **Demo URL**: `http://127.0.0.1:3000/lemans/demo` (Base Path: `/lemans/demo`)
- **Updated**: 2026-08-14

---

## 1. Overview of Completed UI/UX Revamp

The UI/UX revamp has been fully implemented and verified against the 36-test Playwright E2E suite (`./scripts/verify-e2e.sh`), 200 OK vertical slice probes (`./scripts/verify-vertical-slice.sh`), ESLint, TypeScript `tsc`, and Prettier format checks.

### Key Functional & Visual Components Added

1. **Accessible Dynamic Breadcrumbs (`src/components/Breadcrumb.tsx`)**:
   - Renders dynamic breadcrumb hierarchy (`Overview / Customers / Customer C-2026-001`, `Overview / Job Orders / RA0003973`).
   - Targets WCAG 2.2 navigation and focus requirements with explicit
     `aria-label="Breadcrumb"`, `aria-current="page"`, and the shared 2px
     brand `:focus-visible` ring. Validate conformance with the browser suite;
     this handoff is not itself a conformance certificate.

2. **Connected 7-Stage Operational Visualizer (`src/components/EndToEndWorkflowVisualizer.tsx`)**:
   - Embedded on Overview (`/`) as the orientation surface; module and detail pages stay focused on their records, forms, and contextual status controls.
   - Receives the active simulated role and renders only permitted workflow links;
     the overview and Go dashboard handler apply the same role policy to
     dashboard records and sensitive counts.
   - Represents the complete 7-stage operational lifecycle:
     1. **INTAKE** (Customer & Vehicle Check-in)
     2. **QUOTATION** (SQ Estimation & Conversion)
     3. **JOB_ORDER** (Work Authorization & Repair Execution)
     4. **PURCHASING** (Parts Procurement & Supplier Invoices)
     5. **BILLING** (DCS Payments & Service Invoices)
     6. **COSTING** (Est. vs Actual Cost Variance & Margin Analysis)
     7. **ACCOUNTING** (General Ledger & QuickBooks Interchange Exports)

3. **WCAG 2.2 Accessibility & Mobile Usability**:
   - Skip to main content link embedded in `src/app/layout.tsx` (`<a href="#main-content">`).
   - Touch targets enforced at `min-height: 44px` and `min-width: 44px` across desktop and mobile.
   - Text, icons, and status badges communicate state without relying on color alone.
   - Reduced-motion media query support (`@media (prefers-reduced-motion: reduce)`).

---

## 2. Code Review & Inspection Checklist for ChatGPT Codex

When reviewing or revising code in this repository, check against the following standards:

- [ ] **Base Path Safety**: Ensure internal routing links use `<Link href="...">` or `router.push()` with relative paths. Next.js handles `NEXT_PUBLIC_BASE_PATH` (`/lemans/demo` or `/lemans`). Do NOT hardcode prefixed `/lemans/demo` in router calls.
- [ ] **No-Auth Demo Theatre**: Preserve the simulated splash screen (`DemoSplash.tsx`), default Admin role, role switcher (`RoleSwitcher.tsx`), and policy enforcement. Do not add real login redirects or session requirements.
- [ ] **Containerized Execution Boundary**: All Next.js builds, Go API builds, PostgreSQL instances, unit tests, and Playwright E2E tests must execute inside rootless Podman containers.
- [ ] **Financial Precision**: Money amounts are stored as integers in centavos (`cents`) and formatted using `formatPeso()`. Never use floating-point numbers for currency calculations.
- [ ] **Single Source Repository**: Maintain unified repository code for demo and production profiles.

---

## 3. Copy-and-Paste Prompt for ChatGPT Codex

Use the prompt block below when initiating a review, code inspection, or follow-up revision pass with ChatGPT Codex:

```markdown
You are acting as a Senior Staff Software Engineer and UX Auditor reviewing the Le Mans Operations & Job Cost Management System codebase (`lemans-bridge-dashboard`).

### Task Context

The team has completed a full UI/UX overhaul of the Le Mans demo dashboard. The system incorporates an accessible dynamic breadcrumb navigation bar, an operational 7-stage lifecycle visualizer (`EndToEndWorkflowVisualizer`), responsive header/navbar drawer, and module page revamps across Customer Intake, Quotations, Job Orders, Purchasing, DCS, Invoices, Job Costing, and Accounting Exports.

### Directives for Code Inspection & Revisions

1. Inspect the codebase in `src/` (Next.js 16.3 App Router) and `backend/` (Go 1.26 API).
2. Verify WCAG 2.2 accessibility compliance:
   - Ensure all interactive controls have visible focus rings (`focus-visible:ring-2 focus-visible:ring-brand-primary`) and min 44x44px target sizes.
   - Confirm `<a href="#main-content">` skip link works cleanly.
   - Verify text, icons, and status badges communicate state without relying on color alone.
3. Validate Architectural Constraints:
   - Base paths must inherit `NEXT_PUBLIC_BASE_PATH` cleanly (`/lemans/demo`). Do not hardcode prefixed paths in `router.push()`.
   - Money calculations must remain exact integer centavos (`cents`) using `formatPeso()`.
   - Preserve the demo theatre role switcher and simulated policy helper (`X-Demo-Role` header).
4. Run validation checks inside rootless Podman containers:
   - `./scripts/verify-local.sh` (Prettier, ESLint, TypeScript tsc, Next.js build, Go tests)
   - `./scripts/verify-vertical-slice.sh` (Health checks and database isolation)
   - `./scripts/verify-e2e.sh` (Playwright 36-test E2E suite)

Provide concise feedback, highlight any performance or UX improvement opportunities, and output diffs for any proposed code revisions.
```
