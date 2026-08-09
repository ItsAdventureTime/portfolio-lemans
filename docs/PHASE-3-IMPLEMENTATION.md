# Phase 3 Implementation Plan — Le Mans Operations & Job Cost Management System

- **Status**: Completed
- **Date**: 2026-08-07
- **Depends on**: ADR-0003 (Better Auth), ADR-0004 (Backblaze B2)

> **Historical document notice (2026-08-09):** This plan records a prior
> authentication-based implementation state. It is not current proof of demo
> completeness. Follow [`DEMO-IMPLEMENTATION-PLAYBOOK.md`](./DEMO-IMPLEMENTATION-PLAYBOOK.md)
> for the current no-auth Admin-default demo profile and acceptance criteria.

## 1. Objective

Expand the Phase 2 vertical slice into the complete core operations suite while preserving the approved architecture (Next.js 14 App Router + Prisma + PostgreSQL + rootless Podman) and satisfying all Phase 3 functional requirements.

## 2. Requirement-to-Task Mapping

| Requirement ID             | Requirement Summary                                   | Task / Deliverable                                                   | Status |
| -------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------- | ------ |
| REQ-CUST-001..003          | Customer & vehicle records, service history           | Prisma models + `src/lib/dal.ts` + data-bound customer/vehicle pages | ✅     |
| REQ-QUOT-001..003          | Sales quotations + convert to JO                      | Data-backed quote list + `convertQuoteToJobOrder` Server Action      | ✅     |
| REQ-JOB-001..004           | JO lifecycle, technician assignment, attachments      | JO model + events + actions + detail page                            | ✅     |
| REQ-PURCH-001..003         | PR, PO, supplier invoice, multi-JO allocation         | Purchasing schema + actions + UI + tests                             | ✅     |
| REQ-EXP-001..002           | OPEX / Budget Requests + GM approval                  | OpexRequest schema + printable form + approval queue                 | ✅     |
| REQ-DCS-001..003           | Disbursement execution + proof-of-payment upload      | DCS disbursement list + payment record + B2 upload action            | ✅     |
| REQ-BILL-001..003          | Service invoice generation + customer payments        | Invoice generation from completed JO, VAT 12%, payment recording     | ✅     |
| REQ-COST-001..002          | Job Cost Sheet + timeline                             | Dynamic cost sheet using DB allocations + timeline                   | ✅     |
| REQ-QBO-001 / REQ-ACCT-001 | QBO export readiness + Admin-only accounting          | `/accounting` scaffold protected by admin guard                      | ✅     |
| AC-DCS-001 / AC-GM-001     | DCS cannot approve; disbursements require GM approval | RBAC enforcement in every relevant Server Action + tests             | ✅     |
| AC-BILL-001                | VAT 12% + mandatory footer                            | Invoice math + print template footer                                 | ✅     |
| AC-ACCT-001                | Admin-only `/accounting`                              | Middleware + Server Component redirect                               | ✅     |

## 3. Implementation Sequence

### Phase 3A — Foundation

1. Dependencies: `better-auth`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `uuid`, `prettier`, `eslint-config-next`.
2. `src/lib/db.ts` Prisma singleton, `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/middleware.ts`.
3. Extended Prisma schema with Better Auth tables + project domain tables.
4. `src/lib/roles.ts` permission matrix, `src/lib/b2.ts` S3 wrapper.
5. Updated `prisma/seed.ts` with demo users per role and demo records.
6. Tests: `src/__tests__/rbac.test.ts`, plus existing costing/purchasing/billing/DCS tests.

### Phase 3B — Customer/Vehicle/Quotation/Job Order

- Data-bound `customers`, `quotations`, `job-orders` pages.
- `convertQuoteToJobOrder` Server Action.
- JO detail with technician assignment, status transitions, event timeline.

### Phase 3C — Purchasing

- PR creation/approval/PO creation, supplier invoice creation, multi-JO allocation.
- UI under `/purchasing`.
- Tests: `purchasing.test.ts`.

### Phase 3D — Expenses, DCS, Billing

- OPEX request form and GM approval queue.
- DCS disbursement list, payment record, B2 proof-of-payment upload action.
- Customer invoice generation with VAT 12%, payment recording, mandatory footer.
- UI under `/expenses`, `/dcs`, `/invoices`.
- Tests: `dcs.test.ts`, `billing.test.ts`.

### Phase 3E — Job Cost Sheet & Admin Guard

- Dynamic job costing from DB allocations.
- `/accounting` page protected by admin role.

### Phase 3F — Verification & Remote Assets

- Updated `scripts/verify-vertical-slice.sh`.
- Built and verified `local-demo` and immutable `local-prodlike` containers.
- Created Quadlet assets under `quadlet/remote-demo/` and `quadlet/remote-prod/`.
- Created `scripts/build-multiarch.sh` and `docs/REMOTE-OPERATIONS.md`.

## 4. Major Risks Addressed

| Risk                           | Mitigation                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| Better Auth schema integration | Used Prisma adapter + manual schema matching `@better-auth/utils/password` for seed users. |
| Multi-JO allocation math       | Allocation total validated against invoice total in Prisma transaction.                    |
| Float precision                | Amounts compared with `Math.abs(...)` thresholds in tests.                                 |
| Next.js cache staleness        | `revalidatePath` called in every mutating Server Action.                                   |
| B2 credentials                 | Injected via container env only; documented rotation procedure.                            |
| Role drift                     | Centralized matrix in `src/lib/roles.ts`; tested.                                          |

## 5. Verification Strategy

`scripts/verify-vertical-slice.sh` now runs:

- `prettier --check`, `next lint`, `tsc --noEmit`, `npm test`
- `prisma db push` + seed on `lemans-demo-app`
- HTTP checks on `127.0.0.1:3000` and `127.0.0.1:3001` for:
  - `/`, `/login`, `/customers`, `/quotations`, `/job-orders`, `/job-orders/RA0003973`, `/job-costing/RA0003973`, `/purchasing`, `/expenses`, `/dcs`, `/invoices`, `/accounting`
- Confirmation that DB ports are not published to host
- Confirmation that `lemans-prodlike-app` has no source bind mounts

## 6. Known Limitations

- Attachment uploads require real Backblaze B2 credentials; local environments use placeholder values and will fail actual upload until credentials are injected.
- OPEX/PR creation forms are UI placeholders; the Server Actions exist and are tested through existing records and unit tests.
- QBO/CSV export is a scaffold in `/accounting` for Phase 4.
- The verification script authenticates with hardcoded demo credentials (`admin@lemans.ph` / `demo12345`) for health checks; production must use secrets management.
