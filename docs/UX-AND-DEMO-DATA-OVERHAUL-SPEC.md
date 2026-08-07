# Le Mans Operations System — UX Workflow & Realistic Demo Data Overhaul Specification

- **Document Target**: Next LLM / AI Developer Agent / Coding Engineer
- **Client**: LeMans Service Plus OPC (Angeles City, Pampanga)
- **Project**: `lemans-bridge-dashboard`
- **Scope**: User experience workflow overhaul, elimination of developer "pipe string" shortcuts, interactive line-item builders, cascading customer/vehicle selectors, and comprehensive realistic demo seeding.
- **Strict Constraint**: The executing agent must implement all specified UI/UX components and seed expansions without breaking rootless Podman execution, database schemas, Better Auth, or Server Action contracts.

---

## 1. UX & Workflow Audit Findings

Empirical review of the operational workflow identified major usability bottlenecks that make the system feel like an unpolished developer prototype:

### 1.1 Developer "Pipe Syntax" Input Anti-Pattern (e.g. `/quotations`)
- **Observed Behavior**: Creating a Sales Quote requires the user to manually type raw pipe-separated lines into a multiline `<textarea>`:
  `labor | Service labor | 1 | 2000 | 200`
- **Root Cause**: Developer scaffold left in place during initial feature wiring (`src/app/quotations/page.tsx`).
- **Impact**: Non-technical shop personnel (advisors, sales staff) cannot be expected to type raw delimiter syntax. It causes high error rates, confusion, and a poor user experience.
- **Required Fix**:
  - Replace the `<textarea>` with an interactive **Dynamic Line Item Builder component** (`<QuoteLineItemsEditor />` / `<LineItemRowBuilder />`).
  - Provide explicit input fields:
    - **Type**: Dropdown (`LABOR`, `PARTS`, `MISC`)
    - **Description**: Text input or auto-complete item picker
    - **Quantity**: Numeric input (default `1`)
    - **Unit Price**: Currency input (₱)
    - **Discount**: Currency or percentage discount input
  - Include real-time auto-calculation of line subtotals and quote grand total (`Qty × UnitPrice - Discount`).
  - Include an `+ Add Line Item` button and a `Trash` icon button per row.

### 1.2 Un-Cascading & Blank Dropdown Selectors
- **Observed Behavior**: "Select Customer" and "Select Vehicle" dropdowns appear blank or list all vehicles across all customers without filtering.
- **Required Fix**:
  - Implement **Cascading Customer/Vehicle Selection**: Selecting a customer immediately filters the Vehicle dropdown to show *only* vehicles registered under that specific customer.
  - If no customer is selected, disable the Vehicle dropdown with placeholder "Select Customer First".
  - Add inline `+ Quick Add Customer` / `+ Quick Add Vehicle` modals on quote/JO forms so staff don't have to leave the page to register a new customer or car.

### 1.3 Sparse Demo Data (Single Record Limitation)
- **Observed Behavior**: The demo database currently seeds only 1 Job Order (`RA0003973`), 1 Customer, and 1 Vehicle. The dashboard and lists appear empty, failing to demonstrate a fully functional enterprise platform.
- **Required Fix**: Expand `prisma/seed.ts` to populate a realistic, rich operational history across all modules.

---

## 2. Realistic Demo Database Seeding Plan (`prisma/seed.ts`)

The executing agent must expand `prisma/seed.ts` to create a realistic, multi-month operational dataset for **LeMans Service Plus OPC**:

### 2.1 Customers & Vehicles (Minimum 6 Accounts / 10 Vehicles)
1. **Accustandard Medical & Diagnostic Corp.** (Corporate, TIN 009-881-234-000)
   - 2023 Toyota LiteAce (`CBE7864`, White, Manual)
   - 2022 Isuzu Traviz (`NBF4912`, White, Diesel)
2. **Angeles Logistics & Freight Inc.** (Corporate, TIN 210-443-199-000)
   - 2021 Mitsubishi L300 FB (`NDR8821`, Silver, Manual)
   - 2020 Hino 300 Light Truck (`CAK3091`, Blue, Diesel)
3. **Juan Dela Cruz** (Individual, Private)
   - 2022 Ford Ranger 2.0 Bi-Turbo (`NCN5520`, Absolute Black, Automatic)
4. **Maria Santos** (Individual, Private)
   - 2021 Toyota Fortuner 2.8 V (`CBA9901`, Platinum White, Automatic)
5. **Pampanga Express Transport OPC** (Corporate, TIN 401-992-108-000)
   - 2023 Toyota Commuter Van (`CBB1204`, Silver, Manual)
   - 2022 Nissan Urvan NV350 (`NDO7743`, White, Manual)
6. **Engr. Robert Tan** (Individual, Commercial)
   - 2020 Isuzu D-Max 3.0 Ls-A (`CAJ8810`, Titanium Silver, Automatic)

### 2.2 Job Orders & Repair Orders (Minimum 8 Real-World JOs)
1. **RA0003973** (Status: `BILLED`) — Accustandard Medical / LiteAce (PMS 10,000km, Engine Oil, Oil Filter, Brake Pad Replacement). Billed: ₱15,931.49.
2. **RA0003974** (Status: `IN_PROGRESS`) — Angeles Logistics / L300 (Transmission Overhaul, Clutch Lining, Pressure Plate). Billed: ₱28,450.00.
3. **RA0003975** (Status: `PARTS_PENDING`) — Juan Dela Cruz / Ford Ranger (Aircon General Cleaning, Evaporator Replacement, Freon Charge). Billed: ₱18,200.00.
4. **RA0003976** (Status: `APPROVED`) — Maria Santos / Fortuner (4-Wheel Brake Cleaning, Rotor Disc Refacing, Fluid Flush). Billed: ₱12,500.00.
5. **RA0003977** (Status: `COMPLETED`) — Pampanga Express / Commuter (Engine Overheating Repair, Radiator Replacement, Coolant Flush). Billed: ₱24,800.00.
6. **RA0003978** (Status: `CLOSED` / Fully Paid) — Engr. Robert Tan / D-Max (Suspension Overhaul, Shock Absorbers, Bushings). Billed: ₱34,100.00.
7. **RA0003979** (Status: `DRAFT`) — Accustandard Medical / Isuzu Traviz (Initial Inspection, Battery Replacement Estimate).
8. **RA0003980** (Status: `BILLED` / Partial AR) — Angeles Logistics / Hino 300 (Heavy PMS, Fuel Filter, Differential Oil). Billed: ₱42,000.00 (Paid: ₱20,000, AR: ₱22,000).

### 2.3 Purchasing & Supplier Invoices (Minimum 5 POs & Vendors)
- **Vendors**:
  1. Tri-Star Auto Parts Angeles (Pampanga)
  2. Pampanga Automotive & Hardware Supply
  3. Central Luzon Diesel Parts & Hydraulics
- **Supplier Invoices & Multi-JO Allocations**:
  - Invoice `INV-TS-9910` (₱45,000.00 from Tri-Star) allocated across `RA0003974` (L300 Clutch Parts: ₱20,000) and `RA0003975` (Ranger Evaporator: ₱15,000) with ₱10,000 shop stock.

### 2.4 OPEX Requests & DCS Disbursements (Minimum 6 Records)
- **OPEX Budget Requests**:
  - `OPEX-GJOB-JULY/2026-007` (Shop Acetylene Gas Tank Refill: ₱4,500.00 — `DISBURSED`)
  - `OPEX-GJOB-AUG/2026-001` (Technician Pneumatic Wrench Tool Upgrade: ₱12,800.00 — `APPROVED`)
  - `OPEX-GJOB-AUG/2026-002` (Facility Electric Utility Bill: ₱28,900.00 — `PENDING_APPROVAL`)
- **DCS Payment Releases**:
  - Cheque release records with Bank Names (BDO, BPI, Metrobank), Cheque Numbers (e.g. `BDO-0089201`), and B2 attachment references.

---

## 3. UI/UX Workflow Enhancements by Module

### 3.1 Sales Quotations (`/quotations`)
- **Interactive Component**: Replace text area with `<SalesQuoteBuilder />` client component.
- **Features**:
  - Dynamic Customer/Vehicle cascading dropdowns.
  - Interactive table rows: `[Type Select] [Description Input] [Qty] [Unit Price] [Discount] [Row Total] [Delete Icon]`.
  - `+ Add Labor Item` and `+ Add Part Item` quick buttons.
  - Live summary card: Labor Subtotal, Parts Subtotal, Discounts, Net Total.

### 3.2 Job Orders (`/job-orders/[id]`)
- **Visual Status Workflow Stepper**: Render interactive status timeline:
  `DRAFT` → `APPROVED` → `IN_PROGRESS` → `PARTS_PENDING` → `COMPLETED` → `BILLED` → `CLOSED`.
- **Technician & Progress Panel**: Technician assignment pills, start/pause work timers, and inspection photo gallery with lightbox viewer.
- **One-Click Actions**: "Print Repair Order (`RA`)" and "Generate Service Invoice".

### 3.3 Purchasing & Supplier Allocation (`/purchasing`)
- **Visual Allocation Modal**: When recording a Supplier Invoice, render an interactive allocation grid allowing the user to search active JOs and allocate specific invoice amounts to each JO, showing remaining unallocated balance.

### 3.4 DCS Payment Execution (`/dcs`)
- **Dual Queue Tabs**:
  - Tab 1: **Pending Disbursement Release** (Shows GM-Approved POs and OPEX requests with "Record Release" button).
  - Tab 2: **Disbursement History & Proofs** (Shows completed payments with Cheque details and proof attachment download links).

### 3.5 Customer Billing & AR (`/invoices`)
- **Invoice Overview**: Filterable AR aging table (Current, 30 Days, 60 Days, Overdue).
- **Payment Modal**: Record Partial or Full Customer Payment (Cash, Cheque, GCash, Bank Transfer) with instant balance recalculation.
- **Printable Service Invoice**: Server-rendered print template matching official client layout `photo_2026-08-03_00-36-09.jpg` (with 12% VAT breakdown and required legal notice).

---

## 4. Prompt to Copy-Paste for the Executing LLM Agent

When delegating implementation to the coding agent, provide the following exact prompt:

```markdown
You are assigned to implement the UX & Demo Data Overhaul for the Le Mans Operations System (`lemans-bridge-dashboard`) according to `docs/UX-AND-DEMO-DATA-OVERHAUL-SPEC.md`.

### Execution Objectives:
1. **Eliminate Raw Pipe-String Input (`src/app/quotations/page.tsx`)**:
   - Build a client component `<SalesQuoteBuilder />` to replace the raw pipe-separated `<textarea>`.
   - Provide interactive row fields: Type (Labor/Parts/Misc), Description, Qty, Unit Price, Discount, and Row Subtotal.
   - Include `+ Add Line Item` and `Delete` row buttons with real-time total calculation.

2. **Cascading Dropdowns & Quick Add**:
   - Implement cascading Customer -> Vehicle selection on Quote and Job Order creation forms.
   - Disable Vehicle dropdown until a Customer is selected.

3. **Expand Realistic Demo Database (`prisma/seed.ts`)**:
   - Expand seed data to include 6+ realistic corporate/individual customers, 10+ vehicles, 8+ Job Orders across all statuses (RA0003973–RA0003980), 5+ supplier POs/invoices, 6+ OPEX requests, and DCS disbursement records.
   - Run `npx prisma db seed` via rootless Podman to populate the local demo environment.

4. **Module UX Steppers & Print Templates**:
   - Add a visual status stepper to `/job-orders/[id]`.
   - Ensure "Print Service Invoice" and "Print Repair Order" templates match official client layouts (`photo_2026-08-03_00-36-09.jpg` & `photo_2026-08-03_00-36-12.jpg`).

5. **Verification**:
   - Run `./scripts/verify-vertical-slice.sh` inside rootless Podman to verify format, lint, type-check, tests, database seed, and HTTP health checks pass.
```
