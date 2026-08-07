# Phase 3 Implementation Plan — Le Mans Operations & Job Cost Management System

- **Status**: Approved
- **Date**: 2026-08-07
- **Depends on**: ADR-0003 (Better Auth), ADR-0004 (Backblaze B2)

## 1. Objective

Expand the Phase 2 vertical slice into the complete core operations suite while preserving the approved architecture (Next.js 14 App Router + Prisma + PostgreSQL + rootless Podman) and satisfying all Phase 3 functional requirements.

## 2. Requirement-to-Task Mapping

| Requirement ID | Requirement Summary | Task / Deliverable | Affected Files |
|---|---|---|---|
| REQ-CUST-001..003 | Customer & vehicle records, service history | Extend Prisma models; add `src/lib/dal.ts`; data-bind customer/vehicle pages | `prisma/schema.prisma`, `src/lib/db.ts`, `src/lib/dal.ts`, `src/app/customers/page.tsx` |
| REQ-QUOT-001..003 | Sales quotations + convert to JO | Real data-backed quote list, server action `convertQuoteToJobOrder` | `src/app/quotations/page.tsx`, `src/lib/actions/quotations.ts`, `prisma/schema.prisma` |
| REQ-JOB-001..004 | Job Order lifecycle, technician assignment, attachments | Extend JO model with `technician`, `status`, `events`; server actions for status/assignment/attachments | `prisma/schema.prisma`, `src/lib/actions/job-orders.ts`, `src/app/job-orders/[id]/page.tsx` |
| REQ-PURCH-001..003 | PR, PO, supplier invoice, multi-JO allocation | New `purchasing` schema; server actions for PR → PO → invoice → allocation | `prisma/schema.prisma`, `src/lib/actions/purchasing.ts`, `src/app/purchasing/**/*` |
| REQ-EXP-001..002 | OPEX / Budget Requests + GM approval | New `OpexRequest` schema; printable OPEX form; GM approval queue | `prisma/schema.prisma`, `src/lib/actions/expenses.ts`, `src/app/expenses/**/*` |
| REQ-DCS-001..003 | Disbursement execution + proof-of-payment upload | DCS disbursement list, payment record, Backblaze B2 upload | `prisma/schema.prisma`, `src/lib/actions/dcs.ts`, `src/lib/b2.ts`, `src/app/dcs/**/*` |
| REQ-BILL-001..003 | Service invoice generation + customer payments | Invoice generation from completed JO, VAT 12%, payment recording | `prisma/schema.prisma`, `src/lib/actions/billing.ts`, `src/app/invoices/**/*` |
| REQ-COST-001..002 | Job Cost Sheet + timeline | Dynamic cost sheet using DB allocations, event timeline | `src/app/job-costing/[id]/page.tsx`, `src/lib/costing.ts`, `src/__tests__/job-order.test.ts` |
| REQ-QBO-001 / REQ-ACCT-001 | QBO export readiness + Admin-only accounting | (Phase 4) CSV/Excel export scaffold; admin route guard (AC-ACCT-001) | `src/app/accounting/page.tsx`, `src/middleware.ts`, `src/lib/auth.ts` |
| AC-DCS-001 / AC-GM-001 | DCS cannot approve; disbursements require GM approval | RBAC enforcement in every relevant Server Action; tests | `src/lib/auth.ts`, `src/__tests__/rbac.test.ts` |
| AC-BILL-001 | VAT 12% + mandatory footer | Invoice math + print template footer | `src/app/invoices/[id]/page.tsx`, `src/__tests__/billing.test.ts` |
| AC-ACCT-001 | Admin-only `/accounting` | Middleware + Server Component redirect | `src/middleware.ts`, `src/app/accounting/page.tsx` |

## 3. Implementation Sequence

### Phase 3A — Foundation (must complete first)
1. Install dependencies: `better-auth`, `@auth/prisma-adapter` (or official better-auth prisma plugin), `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `uuid` types.
2. Create `src/lib/db.ts` Prisma singleton (`server-only` import).
3. Create `src/lib/auth.ts` Better Auth configuration, `src/lib/auth-client.ts`, `src/middleware.ts`.
4. Extend Prisma schema with auth tables (via Better Auth generator) plus project domain tables.
5. Add `src/lib/roles.ts` permission matrix and `src/lib/b2.ts` S3 client wrapper.
6. Update `prisma/seed.ts` with demo users per role and demo PR/PO/invoice/OPEX/DCS records.
7. Add tests: `src/__tests__/rbac.test.ts`.

### Phase 3B — Customer, Vehicle, Quotation, Job Order
8. Data-bind `src/app/customers/page.tsx`, `src/app/quotations/page.tsx`, `src/app/job-orders/page.tsx`.
9. Implement `convertQuoteToJobOrder` Server Action (AC-JOB-001).
10. Extend `src/app/job-orders/[id]/page.tsx` with technician assignment, status transitions, and event timeline.
11. Add attachment upload flow for inspection/repair photos (Backblaze B2).

### Phase 3C — Purchasing
12. Implement PR creation from JO parts estimates.
13. Implement GM approve PR → create PO.
14. Implement Supplier Invoice creation and multi-JO line allocation (AC-PURCH-001).
15. Add UI under `src/app/purchasing/**/*`.
16. Add tests: `src/__tests__/purchasing.test.ts`.

### Phase 3D — Expenses, DCS, Billing
17. Implement OPEX request form matching client template and GM approval queue.
18. Implement DCS disbursement list, payment record, proof-of-payment upload.
19. Enforce AC-DCS-001 and AC-GM-001 in every action.
20. Implement customer invoice generation from completed JO, VAT math, footer (AC-BILL-001).
21. Implement customer payment recording.
22. Add UI under `src/app/expenses/**/*`, `src/app/dcs/**/*`, `src/app/invoices/**/*`.
23. Add tests: `src/__tests__/dcs.test.ts`, `src/__tests__/billing.test.ts`.

### Phase 3E — Job Cost Sheet & Admin Guard
24. Refactor `src/app/job-costing/[id]/page.tsx` to calculate actuals from DB allocations.
25. Add `/accounting` page protected by admin role (AC-ACCT-001).
26. Extend `src/__tests__/job-order.test.ts` for allocation math.

### Phase 3F — Verification & Remote Assets
27. Extend `scripts/verify-vertical-slice.sh` to run typecheck, tests, migrations, seed, HTTP checks on `127.0.0.1:3000` and `127.0.0.1:3001`.
28. Build and verify local-demo and immutable local-prodlike containers.
29. Create Quadlet assets under `quadlet/remote-demo/` and `quadlet/remote-prod/`.
30. Create `scripts/build-multiarch.sh` and `docs/REMOTE-OPERATIONS.md`.

## 4. Architecture Conflicts Identified

None remaining after ADR-0003 and ADR-0004. Earlier conflict:
- Authentication mechanism was undefined; resolved by Better Auth with database sessions.
- Attachment storage was undefined; resolved by Backblaze B2 S3-compatible API.

## 5. Major Risks

| Risk | Mitigation |
|---|---|
| Better Auth schema integration complexity | Use official Prisma adapter; generate migration; validate with `npx prisma db push` inside container. |
| Multi-JO invoice allocation math / consistency | Wrap allocation in Prisma `$transaction`; unit test allocation proportions and rounding. |
| Float precision in VAT/costing | Store amounts as integer cents when possible, or use `decimal.js` / exact comparison thresholds in tests. |
| Next.js cache staleness after mutations | Call `revalidatePath`/`revalidateTag` in every mutating Server Action. |
| Backblaze B2 credential rotation | Read credentials from container env only; document rotation in `docs/REMOTE-OPERATIONS.md`. |
| Role/permission drift | Centralize matrix in `src/lib/roles.ts`; test every enforcement point. |

## 6. Verification Strategy

### Automated
- `scripts/verify-vertical-slice.sh` executes:
  - `npx tsc --noEmit`
  - `npx ts-node` test runner for all `src/__tests__/*.test.ts`
  - `npx prisma db push` + seed
  - HTTP `HEAD` checks on `127.0.0.1:3000` and `127.0.0.1:3001` for:
    - `/`, `/customers`, `/quotations`, `/job-orders/RA0003973`, `/job-costing/RA0003973`
    - new routes: `/purchasing`, `/expenses`, `/dcs`, `/invoices`
  - Container port inspection to confirm DB port 5432 is not published.

### Security Tests
- `src/__tests__/rbac.test.ts`:
  - DCS token invoking GM action returns `403`.
  - Non-admin accessing `/accounting` redirect.
  - Disbursement blocked until GM-approved.

### Manual / Browser
- Login as GM → approve PR/OPEX → logout.
- Login as DCS → view approved disbursements → record payment + upload receipt.
- Login as Sales/Admin → create invoice from completed JO → verify VAT 12% and footer.

### Local-Prodlike Immutability
- Build with `docker-compose.prodlike.yml` (no bind mounts).
- Run HTTP checks on `127.0.0.1:3001`.
- Confirm app runs as `nextjs` user and DB port is unexposed.

## 7. Expected Remote Deployment Assets

| Asset | Path | Purpose |
|---|---|---|
| Remote demo Quadlet container | `quadlet/remote-demo/lemans-demo.container` | Defines `lemans-remote-demo-app` |
| Remote demo Quadlet network | `quadlet/remote-demo/lemans-demo.network` | Isolated `lemans-remote-demo-net` |
| Remote demo Quadlet volume | `quadlet/remote-demo/lemans-demo.volume` | `lemans-remote-demo-db-data` |
| Remote prod Quadlet container | `quadlet/remote-prod/lemans.container` | Defines `lemans-remote-prod-app` |
| Remote prod Quadlet network | `quadlet/remote-prod/lemans.network` | Isolated `lemans-remote-prod-net` |
| Remote prod Quadlet volume | `quadlet/remote-prod/lemans.volume` | `lemans-remote-prod-db-data` |
| Multi-arch build script | `scripts/build-multiarch.sh` | Build/push `latest-alpine` and `lts-alpine` images |
| Remote operations guide | `docs/REMOTE-OPERATIONS.md` | Quadlet install, env setup, backup, restore |

No remote SSH push or deployment is performed unless explicitly instructed.

## 8. Build Readiness

**Ready for Build** once this plan and ADR-0003 / ADR-0004 are approved. The remaining undefined architectural questions (auth, attachments) are now resolved and do not require further ADRs before coding begins.
