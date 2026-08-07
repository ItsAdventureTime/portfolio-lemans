# Le Mans Operations & Job Cost Management System - Product & Functional Specification

## 1. Document Control
- **Document Title**: Product and Requirements Specification
- **Client Name**: Le Mans Service Plus OPC
- **Project Name**: Le Mans Operations & Job Cost Management System (`lemans-bridge-dashboard`)
- **Version**: 1.1.0 (Updated with Integrated Complementary Specs)
- **Date**: 2026-08-07
- **Status**: Approved Base Scope & Workflow Pattern Integration

---

## 2. Project Purpose & Integrated Specification Basis
The Le Mans Operations & Job Cost Management System is a specialized enterprise operational and financial management platform for **Le Mans Service Plus OPC**, an auto service center located in Angeles City, Pampanga. 

### Integrated Specification Foundation
This product specification synthesizes two mutually compensating handoff documents:
1. **Primary Operational SRS (`LeMans_SRS_Developer_Handoff_v1.md`)**: Defines the auto service domain, roles, job order operational lifecycle, DCS disbursement, billing, and admin/accounting boundary.
2. **Complementary Workflow Specification (`Construction-ERP-Lite-Developer-Handoff-v1.md`)**: Compensates the primary SRS by supplying robust enterprise workflow patterns, including:
   - QBO (QuickBooks Online) export-ready data structures (Customers, Vendors, Bills, Expenses, Invoices, Collections, Payments);
   - General Manager approval matrix and DCS payment stages;
   - Progress billing calculations and retention/variation order tracking primitives;
   - Complete audit trail logging, file attachments, and full database backup/restore mechanisms.

### Governing Core Principle
> **One Job Order (`JO` / `RA`) is the single operational source of truth.** All estimations, parts procurement, labor tracking, supplier invoice allocations, out-of-pocket expenses, customer billings, QBO exports, and profitability calculations bind directly to the Job Order.

---

## 3. Printable Document Templates (Client Basis)

The platform includes server-side rendering for official printable receipts and operational forms based directly on client reference materials:

1. **OPEX Budget Request Template (`photo_2026-08-03_00-36-03.jpg`)**:
   - Header: LeMans Service Plus badge, `BUDGET REQUEST OPEX`.
   - Identification: `OPEX- GJOB [MONTH] / [YEAR]-[ID]` (e.g. `OPEX- GJOB JULY / 2026-007`).
   - Line Columns: `PERIOD COVERED`, `PAYMENT TERMS`, `CHARGE INVOICE NO.`, `PAYEE`, `DUE DATE`, `AMOUNT`.
   - Summary & Sign-offs: `GRAND TOTAL: [AMOUNT]`, `PREPARED BY: [NAME] (AP)`, `REQUEST BY: [NAME] (OPERATION MANAGER)`.
2. **Service Invoice Print Template (`photo_2026-08-03_00-36-09.jpg`)**:
   - Header: Le Mans Service Plus OPC, Highway Pampang, Angeles City, Pampanga, Email/Tel, `SERVICE INVOICE`.
   - Fields: RO No. (RA0003973), Customer No., Customer Name & Address, TIN, Advisor, Year/Make/Model, Plate, Chassis/VIN, Engine, Date.
   - Line Items: Itemized Labor and Parts categorized by service task, Quantity, Unit Price, Discount, Net Amount, Subtotal, 12% VAT, Grand Total.
   - Required Footer Notice: *"THIS IS NOT AN OFFICIAL RECEIPT. NOT VALID FOR CLAIMING INPUT TAX"*.
3. **Repair Order / Job Order Print Template (`photo_2026-08-03_00-36-12.jpg`)**:
   - Header: `REPAIR ORDER`, Control No. (RA0003973), Cube Topper No., Mode of Payment, Insurer, LOA No., Promised Date/Time.
   - Task Breakdown: Categorized Labor & Parts, Advisor's Recommendation, Cost Breakdown Summary Box (Labor total, Parts total, Others total, Grand Total).
   - Signatures: Service Advisor (`Prepared/Date`), Warranty Processor (`Checked/Date`), Service Head (`Approved/Date`), Customer (`Acknowledged & Conformed/Date`).

---

## 4. User Roles & Permission Matrix

| Role Code | Role Name | System Access & Primary Responsibilities |
|---|---|---|
| `ROLE-SALES` | Sales | Customer check-in, vehicle intake, drafting Labor & Parts Estimates, creating Sales Quotations (`SQ`), sending quotes for customer approval. |
| `ROLE-SVC` | Service Delivery | Managing active Job Orders (`JO`), technician assignment, work progress tracking, recording service completion, attaching inspection photos. |
| `ROLE-PURCH` | Purchasing | Converting JO parts estimates into Purchase Requests (`PR`), issuing Purchase Orders (`PO`) after GM approval, receiving Supplier Invoices, and allocating invoice line items across single or multiple JOs. |
| `ROLE-GM` | General Manager | Approving Purchase Requests (`PR`), approving Other Expenses / OPEX Requests, approving final Customer Billing drafts, viewing enterprise profitability reports. |
| `ROLE-DCS` | DCS (Disbursement & Cashier Services) | Executing disbursements only for GM-approved PRs/Expenses, uploading proof of payment receipts/cheques, recording customer payments. **Cannot approve requests.** |
| `ROLE-ADMIN` | System Administrator | Full system management: User management, role assignment, permission matrix configuration, audit log inspection, system backup/restore, feature management, and **Accounting Module access**. |

---

## 5. Functional Requirements (With Stable IDs)

### Module 1: Customer & Vehicle Management
- **REQ-CUST-001**: System shall maintain complete records for individual and corporate customers, storing TIN, contact persons, phone numbers, and billing addresses.
- **REQ-CUST-002**: System shall maintain vehicle profiles linked to customer records, storing Plate Number (e.g., CBE7864), VIN/Chassis Number, Engine Number, Year/Make/Model (e.g., 2023 Toyota LiteAce), Color, Transmission, and Odometer readings.
- **REQ-CUST-003**: System shall provide full service history lookup per vehicle and per customer.

### Module 2: Sales Quotation (SQ)
- **REQ-QUOT-001**: System shall support creating Sales Quotations (`SQ`) composed of itemized Service Labor and Parts/Materials.
- **REQ-QUOT-002**: Each quote item shall support unit price, quantity, discount percentage/amount, and line net total.
- **REQ-QUOT-003**: System shall allow converting an approved Sales Quotation into a formal Job Order (`JO`) with one click, transferring all estimated labor and parts.

### Module 3: Job Order (JO) Management
- **REQ-JOB-001**: Job Order shall act as the single source of truth (`RA` / `JO` Number auto-generated, e.g., RA0003973).
- **REQ-JOB-002**: JO shall record Service Advisor, Cube Topper Number, Promised Date/Time, Payment Mode, Insurer details, and LOA details.
- **REQ-JOB-003**: System shall track status: `DRAFT`, `APPROVED`, `IN_PROGRESS`, `PARTS_PENDING`, `COMPLETED`, `BILLED`, `CLOSED`.
- **REQ-JOB-004**: System shall support technician assignment and image attachments (inspection photos, repair photos).

### Module 4: Purchasing & Supplier Invoice Allocation
- **REQ-PURCH-001**: System shall generate Purchase Requests (`PR`) directly from JO parts requirements or general shop inventory replenishment.
- **REQ-PURCH-002**: All PRs require GM Approval before conversion to a Purchase Order (`PO`).
- **REQ-PURCH-003**: System shall record Supplier Invoices and support **multi-JO line item allocation** (allocating specific invoice line items across one or more active JOs).

### Module 5: Other Expenses & OPEX Requests
- **REQ-EXP-001**: System shall support creating OPEX / Budget Requests matching the OPEX Request Budget template (`photo_2026-08-03_00-36-03.jpg`).
- **REQ-EXP-002**: All OPEX and shop expense requests MUST receive GM Approval prior to being released to DCS for disbursement.

### Module 6: DCS (Disbursement & Cashier Services)
- **REQ-DCS-001**: DCS role shall view only GM-approved disbursements (Approved PO Invoices and Approved OPEX Requests).
- **REQ-DCS-002**: DCS shall record payment release details (Payment Mode, Cheque Number, Bank, Transaction Date) and upload proof-of-payment receipts/cheques.
- **REQ-DCS-003**: DCS role is strictly barred from approving any purchase or expense request (`AC-DCS-001`).

### Module 7: Customer Billing & Collections
- **REQ-BILL-001**: System shall generate official Service Invoices matching `photo_2026-08-03_00-36-09.jpg` upon repair completion.
- **REQ-BILL-002**: Invoice shall format Labor, Parts, and Miscellaneous subtotals, applying VAT (12% where applicable) and compute Grand Total.
- **REQ-BILL-003**: System shall record customer payments against generated invoices and track accounts receivable (AR).

### Module 8: Job Cost Sheet & Profitability Analysis
- **REQ-COST-001**: System shall automatically aggregate Estimated vs Actual Labor Costs, Parts Costs, Allocated Direct Expenses, and compute Net Job Profitability ($ / %).
- **REQ-COST-002**: System shall display a visual timeline of all JO events.

### Module 9: QBO Export Readiness & Accounting Integration
- **REQ-QBO-001**: System shall provide export-ready data files (CSV/Excel/JSON) for QBO ingestion covering Customers, Vendors, Bills, Expenses, Invoices, Collections, and Payments.
- **REQ-ACCT-001**: Admin-only General Ledger (`GL`) overview, Accounts Payable (`AP`) ledger, Journal Entries (`JE`), and financial summaries.

---

## 6. Stable Acceptance Criteria (AC IDs)

- **AC-JOB-001**: When a Sales Quotation is converted to a Job Order, all line items must clone to the new JO without data loss, retaining reference to the original SQ ID.
- **AC-PURCH-001**: A Supplier Invoice line item allocated across multiple Job Orders must update the actual parts cost on all corresponding Job Cost Sheets in proportion to allocated amounts.
- **AC-DCS-001**: Users logged in under `ROLE-DCS` must not see "Approve" buttons on PRs or OPEX requests. API calls to approve via DCS token must return `403 Forbidden`.
- **AC-GM-001**: Disbursements cannot be released by DCS unless the associated PR or Expense record has status `APPROVED_BY_GM`.
- **AC-BILL-001**: Generated Service Invoices must compute VAT at 12% on taxable lines and display required footer notice: *"THIS IS NOT AN OFFICIAL RECEIPT. NOT VALID FOR CLAIMING INPUT TAX"*.
- **AC-ACCT-001**: Non-admin user roles accessing `/accounting` routes must be redirected to `/dashboard` with an authorization warning.
