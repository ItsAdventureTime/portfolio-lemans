# Le Mans Operations System — Master UX Workflow & Realistic Multi-Role Demo Specification

- **Document Version**: 3.0.0 (Master Handoff Specification)
- **Target Audience**: AI Developer Agent / Coding LLM / Engineering Team
- **Client**: LeMans Service Plus OPC (Angeles City, Pampanga)
- **Project Repository**: `lemans-bridge-dashboard`
- **Scope**: Comprehensive UX/UI overhaul across all 6 user roles (`ROLE-SALES`, `ROLE-SVC`, `ROLE-PURCH`, `ROLE-GM`, `ROLE-DCS`, `ROLE-ADMIN`), complete elimination of developer shortcuts/pipe textareas, interactive line-item editors, cascading dropdown selectors, visual workflow steppers, and a realistic multi-role, multi-month operational database seed.
- **Mandatory Constraint**: The executing agent MUST NOT break rootless Podman containerized execution (`./scripts/run-local.sh`, `./scripts/verify-vertical-slice.sh`), database schema constraints, demo actor/policy handling, or Server Action contracts. The current demo has no Better Auth session layer.

---

## 1. Executive Scope & Operational Principles

The objective of this specification is to transform the `lemans-bridge-dashboard` application from a developer scaffold into a **fully functional, mature, highly intuitive enterprise platform** that feels complete and production-ready in every view and for every user role.

### 1.1 Core Principles

1. **One Job Order (`JO` / `RA`) is the Single Source of Truth**: All estimates, parts procurement, labor logs, supplier invoice allocations, OPEX requests, customer billings, and job profitability calculations bind directly to the Job Order.
2. **Zero Developer Shortcuts / Zero Pipe Syntax**: Developer temporary shortcuts—such as requiring users to type raw pipe-delimited text (`labor | Service labor | 1 | 2000 | 200`) into a text area—are strictly prohibited. All user input MUST occur via intuitive, interactive UI components with real-time feedback and validation.
3. **Role-Aware Personalization**: The interface MUST dynamically adapt to the logged-in user's role. Un-permitted navigation links must be hidden from the UI, and unauthorized URL access must yield an explicit **403 Access Restricted** view (never a silent redirect).
4. **Rich & Realistic Seed Data**: The demo database MUST NOT look like an empty shell. It must be seeded with multi-month, multi-role operational data reflecting real-world automotive center transactions in Angeles City, Pampanga.

---

## 2. Role-by-Role UX & Feature Specifications

### 2.1 `ROLE-SALES` (Sales & Customer Intake)

- **Primary Tasks**: Customer intake, vehicle registration, drafting labor & parts estimates, generating Sales Quotations (`SQ`), sending quotes for customer approval, and converting approved quotes into Job Orders (`JO`).
- **Required UI Components & Workflows**:
  - **Customer & Vehicle Registry (`/customers`)**: High-density searchable customer table with expandable vehicle cards, TIN validation, contact person details, and vehicle service history lookup.
  - **Interactive Quote Builder (`/quotations`)**:
    - Replacing raw textareas with `<SalesQuoteBuilder />` (see Section 3.1).
    - Cascading Customer → Vehicle selector: Selecting a customer immediately filters the vehicle dropdown.
    - Inline `+ Quick Add Customer` and `+ Quick Add Vehicle` modals directly inside the quote form.
  - **Quote-to-JO Conversion**: Visual "Convert to Job Order" CTA button on approved quotes with one-click cloning of estimated labor and parts line items into a new Job Order (`RA0003973+`).

### 2.2 `ROLE-SVC` (Service Delivery & Workshop)

- **Primary Tasks**: Managing active Job Orders, technician assignment, repair progress tracking, recording work completion, and attaching inspection photos.
- **Required UI Components & Workflows**:
  - **Workshop Kanban & List View (`/job-orders`)**: Filterable job order grid by status (`DRAFT`, `APPROVED`, `IN_PROGRESS`, `PARTS_PENDING`, `COMPLETED`, `BILLED`, `CLOSED`).
  - **Job Order Detail Workspace (`/job-orders/[id]`)**:
    - Visual **Status Workflow Stepper** (see Section 3.4).
    - Technician Assignment Panel: Assign technicians per labor item with work progress timers.
    - Inspection Photo Gallery: Drag-and-drop attachment zone for pre-repair and post-repair photos stored in Backblaze B2.
    - One-click "Print Repair Order (`RA`)" generating official document layout matching client template (`photo_2026-08-03_00-36-12.jpg`).

### 2.3 `ROLE-PURCH` (Purchasing & Procurement)

- **Primary Tasks**: Converting JO parts estimates into Purchase Requests (`PR`), issuing Purchase Orders (`PO`) after GM approval, recording Supplier Invoices, and allocating supplier invoice lines across single or multiple JOs.
- **Required UI Components & Workflows**:
  - **Purchase Requests & POs (`/purchasing`)**: Form to create PRs linked to specific JOs or general shop replenishment. Visual status pills (`PENDING_APPROVAL`, `APPROVED_BY_GM`, `PO_ISSUED`, `FULFILLED`).
  - **Interactive Multi-JO Allocation (`/purchasing`)**:
    - Modal or drawer `<MultiJoAllocationModal />` allowing staff to record a Supplier Invoice (e.g. ₱45,000 from Tri-Star Auto Parts) and allocate specific line item amounts across active Job Orders (`RA0003974`: ₱20,000, `RA0003975`: ₱15,000, Shop Stock: ₱10,000).
    - Real-time unallocated balance calculator to prevent allocation errors.

### 2.4 `ROLE-GM` (General Manager)

- **Primary Tasks**: Approving Purchase Requests (`PR`), approving Other Expenses / OPEX Requests, reviewing final Customer Billing drafts, and monitoring enterprise profitability reports.
- **Required UI Components & Workflows**:
  - **GM Executive Overview (`/`)**: High-visibility KPI cards displaying Active JOs, Quotations Value, Enterprise Job Profitability Margin (%), and Pending Approvals count.
  - **Pending Approvals Queue (`/expenses` & `/purchasing`)**: Dedicated approval workspace allowing 1-click "Approve" or "Reject" with optional audit rationale notes.
  - **Job Costing Analytics (`/job-costing/[id]`)**: Detailed breakdown comparing Estimated vs Actual Labor, Parts, and Allocated Direct OPEX with Net Job Profit ($ and %).

### 2.5 `ROLE-DCS` (Disbursement & Cashier Services)

- **Primary Tasks**: Executing disbursements for GM-approved PRs and OPEX requests, uploading proof of payment receipts/cheques, and recording customer payments.
- **Restrictions**: Strictly barred from approving requests (`AC-DCS-001`).
- **Required UI Components & Workflows**:
  - **Dual-Queue Disbursement Hub (`/dcs`)**:
    - Tab 1: **Awaiting Release** (Lists only `APPROVED_BY_GM` disbursements with "Record Payment Release" CTA).
    - Tab 2: **Disbursement History & Proofs** (Lists completed disbursements with cheque details and presigned B2 proof attachment links).
  - **Payment Release Modal**: Fields for Payment Mode (Cheque, Cash, Bank Transfer), Bank Name (BDO, BPI, MBTC), Cheque Number, Release Date, and file drop zone for receipt upload.

### 2.6 `ROLE-ADMIN` (System Administrator)

- **Primary Tasks**: Full system management, user role assignment, RBAC permission matrix audit, audit log inspection, system backup/restore, QBO export engine, and Admin-Only Accounting Module.
- **Required UI Components & Workflows**:
  - **QBO Export Engine (`/accounting`)**: One-click export of structured CSV/Excel/JSON files for Customers, Vendors, Bills, Expenses, Invoices, and Payments.
  - **Admin Accounting Module (`/accounting`)**: General Ledger (`GL`) overview, Accounts Payable (`AP`) ledger, Journal Entries (`JE`), and financial summaries.
  - **Access Control Guard**: Non-admin roles attempting to access `/accounting` MUST be presented with an explicit `<AccessDenied />` screen (see Section 3.5).

---

## 3. Interactive Component Architecture (Zero Shortcut Mandate)

### 3.1 `<SalesQuoteBuilder />` (Replacing Raw Textarea)

- **File Location**: `src/components/sales-quote-builder.tsx`
- **Features**:
  - Form state containing an array of item rows: `{ id, itemType, description, quantity, unitPrice, discount, netAmount }`.
  - Dropdown for `itemType`: `LABOR` | `PARTS` | `MISC`.
  - Searchable description input.
  - Number inputs for `quantity` (default `1`), `unitPrice` (₱), and `discount` (₱).
  - Live calculated line net: `(quantity * unitPrice) - discount`.
  - Buttons: `+ Add Labor Row`, `+ Add Parts Row`, and a `Trash` icon on each row.
  - Summary Card: Displays Labor Subtotal, Parts Subtotal, Total Discounts, and Quote Grand Total.

### 3.2 `<CascadingCustomerVehicleSelector />`

- **Behavior**:
  - Customer `<select>` triggers an `onChange` handler that filters the Vehicle `<select>` options.
  - When no Customer is selected, the Vehicle dropdown is disabled with option `"Select Customer First"`.
  - Includes inline `+ New Customer` and `+ New Vehicle` quick-modal triggers so users can register new accounts without navigating away.

### 3.3 `<MultiJoAllocationModal />`

- **Behavior**:
  - Displays total Supplier Invoice amount.
  - Renders a list of active Job Orders with input fields for allocated amounts.
  - Displays real-time **Remaining Unallocated Balance**: Highlights in emerald green when ₱0.00, amber yellow when partially allocated, and rose red if over-allocated.

### 3.4 `<StatusWorkflowStepper />`

- **Behavior**:
  - Renders a horizontal visual stepper bar on Job Order and Quotation pages showing progress across lifecycle stages (`Draft` → `Approved` → `In Progress` → `Completed` → `Billed`).
  - Active step highlighted in LeMans Racing Red (`#d32f2f`); completed steps in Emerald Green (`#059669`).

### 3.5 `<AccessDenied />` (Explicit 403 Component)

- **File Location**: `src/components/access-denied.tsx`
- **Behavior**:
  - Rendered when a user accesses a route without required permissions (e.g. `ROLE-GM` accessing `/accounting`).
  - Displays a high-contrast shield icon, title "Access Restricted", description stating the required role vs active role, and a primary CTA "Return to Overview" linking to `/`.
  - **Never perform a silent redirect**.

---

## 4. Master Realistic Demo Database Expansion (`backend/internal/api/handlers_seed.go`)

The executing agent MUST expand the Go seed handler to create a rich,
multi-month operational dataset:

> The persona list below is historical planning input. The current demo has no
> user accounts or passwords; its Admin and five business roles are simulated
> by the browser cookie/header actor. Never use the credentials below as current
> runtime instructions.

### 4.1 Accounts & User Personas (6 Authenticated Accounts)

- `admin@lemans.ph` / `demo12345` (`ROLE-ADMIN`)
- `gm@lemans.ph` / `demo12345` (`ROLE-GM`)
- `sales@lemans.ph` / `demo12345` (`ROLE-SALES`)
- `svc@lemans.ph` / `demo12345` (`ROLE-SVC`)
- `purch@lemans.ph` / `demo12345` (`ROLE-PURCH`)
- `dcs@lemans.ph` / `demo12345` (`ROLE-DCS`)

### 4.2 Corporate & Individual Customers (6 Accounts)

1. **Accustandard Medical & Diagnostic Corp.** (TIN: `009-881-234-000`, Corporate, Angeles City)
2. **Angeles Logistics & Freight Inc.** (TIN: `210-443-199-000`, Corporate, Highway Pampang)
3. **Juan Dela Cruz** (Individual, Balibago, Angeles City)
4. **Maria Santos** (Individual, Cutcut, Angeles City)
5. **Pampanga Express Transport OPC** (TIN: `401-992-108-000`, Corporate, San Fernando)
6. **Engr. Robert Tan** (Individual, Telebastagan, Pampanga)

### 4.3 Vehicles (10 Vehicle Profiles)

1. 2023 Toyota LiteAce (`CBE7864`, White, Manual) — Accustandard Medical
2. 2022 Isuzu Traviz (`NBF4912`, White, Diesel) — Accustandard Medical
3. 2021 Mitsubishi L300 FB (`NDR8821`, Silver, Manual) — Angeles Logistics
4. 2020 Hino 300 Light Truck (`CAK3091`, Blue, Diesel) — Angeles Logistics
5. 2022 Ford Ranger 2.0 Bi-Turbo (`NCN5520`, Black, Automatic) — Juan Dela Cruz
6. 2021 Toyota Fortuner 2.8 V (`CBA9901`, Pearl White, Automatic) — Maria Santos
7. 2023 Toyota Commuter Van (`CBB1204`, Silver, Manual) — Pampanga Express
8. 2022 Nissan Urvan NV350 (`NDO7743`, White, Manual) — Pampanga Express
9. 2020 Isuzu D-Max 3.0 Ls-A (`CAJ8810`, Silver, Automatic) — Engr. Robert Tan
10. 2021 Toyota Hilux Conquest (`NDN3302`, Red, Automatic) — Engr. Robert Tan

### 4.4 Job Orders (`RA0003973` to `RA0003982` — 10 JOs Across All Statuses)

- **RA0003973** (`BILLED`): Accustandard LiteAce — PMS 10k, Oil, Filter, Brake Pads. Billed: ₱15,931.49.
- **RA0003974** (`IN_PROGRESS`): Angeles Logistics L300 — Transmission Overhaul, Clutch Lining. Billed: ₱28,450.00.
- **RA0003975** (`PARTS_PENDING`): Juan Dela Cruz Ford Ranger — Aircon General Cleaning, Evaporator. Billed: ₱18,200.00.
- **RA0003976** (`APPROVED`): Maria Santos Fortuner — 4-Wheel Brake Cleaning, Rotor Refacing. Billed: ₱12,500.00.
- **RA0003977** (`COMPLETED`): Pampanga Express Commuter — Radiator & Coolant Replacement. Billed: ₱24,800.00.
- **RA0003978** (`CLOSED` / Paid): Engr. Robert Tan D-Max — Suspension Overhaul, Shocks. Billed: ₱34,100.00.
- **RA0003979** (`DRAFT`): Accustandard Traviz — Battery Replacement & Starter Inspection.
- **RA0003980** (`BILLED` / Partial AR): Angeles Logistics Hino 300 — Heavy PMS, Fuel Filters. Billed: ₱42,000.00 (Paid: ₱20,000, AR: ₱22,000).
- **RA0003981** (`COMPLETED`): Pampanga Express NV350 — Wheel Alignment & Tire Balancing. Billed: ₱8,600.00.
- **RA0003982** (`IN_PROGRESS`): Engr. Robert Tan Hilux — EGR Cleaning & Fuel Injector Calibration. Billed: ₱19,500.00.

### 4.5 Vendors, Supplier Invoices & Multi-JO Allocations (5 POs / Invoices)

- **Vendors**: Tri-Star Auto Parts Angeles, Pampanga Automotive Supply, Central Luzon Hardware.
- **Allocated Invoices**:
  - `INV-TS-9910` (₱45,000.00 from Tri-Star) → Allocated to `RA0003974` (₱20k) and `RA0003975` (₱15k), ₱10k Shop Stock.
  - `INV-PAS-4011` (₱28,000.00 from Pampanga Automotive) → Allocated to `RA0003977` (₱18k) and `RA0003978` (₱10k).

### 4.6 OPEX Budget Requests & DCS Disbursements (8 Records)

- `OPEX-GJOB-JULY/2026-007` (Acetylene Gas Refill: ₱4,500.00 — `DISBURSED`, Cheque `BDO-0089201`)
- `OPEX-GJOB-AUG/2026-001` (Technician Pneumatic Wrench Upgrade: ₱12,800.00 — `APPROVED`)
- `OPEX-GJOB-AUG/2026-002` (Facility Electric Utility Bill: ₱28,900.00 — `PENDING_APPROVAL`)
- `OPEX-GJOB-AUG/2026-003` (Shop Waste Oil Disposal Fee: ₱3,500.00 — `DISBURSED`, Cheque `BPI-441092`)

---

## 5. UI/UX & High-Readability System Standards

1. **Fluid Screen Utilization**: All page layout wrappers MUST use `w-full max-w-[1920px] mx-auto px-6 lg:px-8 xl:px-10` to eliminate wasted side margins on wide displays.
2. **Accessible High-Readability Typography**:
   - Base body text: `16px` (`text-base` / 1rem).
   - Table cells: `15px-16px` (`text-sm`/`text-base`) with high-contrast slate (`text-slate-800`).
   - Big KPI numbers: `32px-36px font-extrabold` (`text-3xl`/`text-4xl`).
   - Form inputs: `16px` (`text-base`) to prevent mobile auto-zoom.
3. **Button Text Wrapping Prevention**:
   - All table action buttons MUST use `whitespace-nowrap inline-flex items-center justify-center h-9 px-4`.
4. **Brand Tone & Accent Alignment**:
   - LeMans Racing Red (`#d32f2f`, hover `#b71c1c`) as the primary brand accent for primary CTA buttons, active tab indicators, and shield logo accents.
   - High-contrast slate backgrounds (`#f8fafc` canvas, `#ffffff` elevated cards, `#0f172a` primary headings).

---

## 6. Automated Verification & Quality Criteria

Before declaring completion, the executing agent MUST run and pass:

1. **Containerized Build & Test Suite**:

   ```bash
   export PATH="/opt/podman/bin:$PATH"
   ./scripts/verify-local.sh
   ```
   - Must pass format check, ESLint, TypeScript compilation (`tsc --noEmit`), and all unit/integration tests (`src/__tests__/*.test.ts`).

2. **Vertical Slice Verification**:
   ```bash
   ./scripts/verify-vertical-slice.sh
   ```
   - Must run the Go API migrations and seed flow, verify HTTP health checks
     (`200 OK` on the demo splash and routes, explicit `AccessDenied` for
     unauthorized `/accounting`), and confirm database port isolation.

---

## 7. Master Prompt for the Executing LLM Agent

Copy and paste the following prompt when assigning implementation to the coding agent:

```markdown
You are assigned to implement the Master UX & Demo Data Overhaul for the Le Mans Operations System (`lemans-bridge-dashboard`) according to `docs/UX-AND-DEMO-DATA-OVERHAUL-SPEC.md`, `docs/UI-UX-OVERHAUL-SPECIFICATION.md`, and `docs/DESIGN-SYSTEM.md`.

### Core Deliverables:

1. **Interactive Line Item Builder (`src/components/sales-quote-builder.tsx`)**:
   - Replace the developer pipe-string `<textarea>` on `/quotations` with an interactive `<SalesQuoteBuilder />`.
   - Provide explicit row fields: Type (Labor/Parts/Misc), Description, Quantity, Unit Price, Discount, and Row Subtotal.
   - Include `+ Add Labor Row`, `+ Add Parts Row`, and `Delete` row buttons with real-time total calculation.

2. **Cascading Dropdowns & Inline Quick-Add**:
   - Implement cascading Customer -> Vehicle selection on Quote and Job Order creation forms.
   - Disable Vehicle dropdown until a Customer is selected.

3. **Role-Aware Navigation & Explicit 403 Page**:
   - Filter `src/components/navbar.tsx` items based on the logged-in role's permissions.
   - Create `src/components/access-denied.tsx` and render it on `/accounting` (and restricted routes) when accessed by non-admin roles (`ROLE-GM`, `ROLE-SALES`, etc.) instead of executing a silent redirect.

4. **Table Action Button Wrapping & Fluid Layouts**:
   - Add `whitespace-nowrap inline-flex items-center justify-center h-9 px-4` to all table action buttons (e.g. "View RA").
   - Update layout containers across all page views to fluid full width (`w-full max-w-[1920px] mx-auto px-6 lg:px-8`).
   - Upgrade baseline body typography to 16px (`text-base`) and KPI big numbers to 32px-36px bold.

5. **Expanded Realistic Demo Seeding (`prisma/seed.ts`)**:
   - Expand `prisma/seed.ts` to populate 6 corporate/individual customers, 10 vehicles, 10 Job Orders (RA0003973–RA0003982) across all statuses, 5 supplier invoices/allocations, 8 OPEX requests, and 6 DCS payment releases with cheque details.

6. **Verification**:
   - Run `./scripts/verify-local.sh` and `./scripts/verify-vertical-slice.sh` inside rootless Podman to verify zero lint/type-check regressions, successful database seeding, and 100% HTTP health check pass.
```
