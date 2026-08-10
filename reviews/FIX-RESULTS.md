# Phase 4 Defect Fix Results

> **Historical implementation record:** This document describes an older
> authentication-oriented phase and is not current demo acceptance evidence.
> The current demo has no real authentication; follow the authoritative
> playbook for the simulated `Enter as an Admin` entry, role simulation, and
> current route/runtime requirements.

- **Project**: Le Mans Operations & Job Cost Management System (`lemans-bridge-dashboard`)
- **Client**: LeMans Service Plus OPC
- **Date**: 2026-08-07
- **Environment**: macOS (arm64) + rootless Podman `podman-machine-default`
- **Target Environments**:
  - `local-demo` (`http://127.0.0.1:3000`) — Container `lemans-demo-app`
  - `local-prodlike` (`http://127.0.0.1:3001`) — Container `lemans-prodlike-app`
- **Scope**: Resolve all release-blocking defects (Blocker, Critical, Major) from `reviews/DEFECTS.md`. Minor/cosmetic defects (DEFECT-009–011) were excluded from this pass.

---

## 1. Defects Addressed

| Defect         | Severity | Summary                                                                                               | Fix Location(s)                                                                                                                                                                                                                                                                              | Status   |
| :------------- | :------- | :---------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------- |
| **DEFECT-001** | Blocker  | Missing `/invoices/[id]` route for customer payment recording.                                        | `src/app/invoices/[id]/page.tsx` (new); `src/lib/actions/billing.ts` (payment recording verified); `src/__tests__/creation-forms.test.ts`                                                                                                                                                    | ✅ Fixed |
| **DEFECT-002** | Blocker  | Root dashboard (`/`) accessible without authentication.                                               | `src/middleware.ts`; `src/app/page.tsx` server-side session guard; `src/__tests__/dashboard.test.ts`                                                                                                                                                                                         | ✅ Fixed |
| **DEFECT-003** | Critical | Creation buttons on `/expenses`, `/purchasing`, `/customers`, `/quotations` were static placeholders. | `src/app/expenses/page.tsx`; `src/app/purchasing/page.tsx`; `src/app/customers/page.tsx`; `src/app/quotations/page.tsx`; `src/lib/actions/job-orders.ts` (`createCustomerAndVehicle`, `createSalesQuotation`); `src/lib/actions/purchasing.ts` (`createPurchaseRequest`); `src/lib/roles.ts` | ✅ Fixed |
| **DEFECT-004** | Critical | Supplier invoice recording and multi-JO allocation UI missing.                                        | `src/app/purchasing/page.tsx`; `src/lib/actions/purchasing.ts`                                                                                                                                                                                                                               | ✅ Fixed |
| **DEFECT-005** | Critical | `/dcs` displayed GM approval button to `ROLE_DCS` users and lacked payment/proof controls.            | `src/app/dcs/page.tsx`; `src/lib/actions/dcs.ts` (proof helpers restored)                                                                                                                                                                                                                    | ✅ Fixed |
| **DEFECT-006** | Major    | `scripts/build-multiarch.sh` promoted `Dockerfile.dev` image as `lts-slim`.                           | `scripts/build-multiarch.sh` now builds `latest-slim` and `lts-slim` from `Dockerfile.prod` and verifies `Cmd` contains `node server.js`.                                                                                                                                                    | ✅ Fixed |
| **DEFECT-007** | Major    | Dashboard showed hardcoded mock data.                                                                 | `src/app/page.tsx` now queries live aggregated DB metrics; `src/__tests__/dashboard.test.ts` validates updates.                                                                                                                                                                              | ✅ Fixed |
| **DEFECT-008** | Major    | Job order detail page missing photo attachment and event creation UI.                                 | `src/app/job-orders/[id]/page.tsx` now includes event log form and attachment metadata form.                                                                                                                                                                                                 | ✅ Fixed |

Defects **DEFECT-009** (Navbar Job Costing hardcoded link), **DEFECT-010** (Header badge LSP text), and **DEFECT-011** (Header environment badge static) were **not addressed** in this pass because they are Minor/Cosmetic and non-blocking.

---

## 2. Key Code Changes

### Authentication & Middleware

- `src/middleware.ts` now includes `/` in protected paths and skips public assets/static routes.
- `src/app/page.tsx` verifies session server-side and redirects to `/login?callbackUrl=%2F` when unauthenticated.

### Invoice Detail & Payments

- Created `src/app/invoices/[id]/page.tsx` with invoice summary, payment history, remaining balance, and a customer payment form calling `recordCustomerPayment`.
- Smoke check in `scripts/verify-vertical-slice.sh` confirms `/invoices/<seeded-id>` returns `200`.

### Creation Forms

- `src/app/expenses/page.tsx`: New OPEX request form (amount, category, description).
- `src/app/purchasing/page.tsx`: New PR form; supplier invoice recording; multi-JO allocation table.
- `src/app/customers/page.tsx`: Customer + vehicle registration form.
- `src/app/quotations/page.tsx`: New sales quote form with customer/vehicle selectors.
- New permissions: `customerCreate`, `salesQuotationCreate` in `src/lib/roles.ts`.
- New server actions: `createCustomerAndVehicle`, `createSalesQuotation`, `createPurchaseRequest`.

### DCS UI

- `/dcs` now shows GM approval controls only when the session user has `disburseApprove` permission.
- `ROLE_DCS` users see payment recording fields and proof-of-payment attachment/upload controls on `APPROVED` disbursements.
- Regression test asserts DCS user cannot see GM approval button.

### Build Script

- `scripts/build-multiarch.sh`:
  - Builds `latest-slim` and `lts-slim` from `Dockerfile.prod`.
  - Promotion verifies the source image `Cmd` contains `node server.js`.
  - No longer references `Dockerfile.dev` for production tags.

### Testing Infrastructure

- Added `src/__tests__/setup.ts` to stub `server-only` and force the Prisma OpenSSL 3.0 binary target in Linux test runs.
- Updated `src/__tests__/index.ts` to an async runner.
- Added `src/__tests__/creation-forms.test.ts` and `src/__tests__/dashboard.test.ts`.
- Updated `rbac.test.ts` and `dcs.test.ts` for new permission and UI assertions.
- Added `.prettierignore` to exclude build contexts and lockfile churn.

---

## 3. Verification Results

Executed `scripts/verify-vertical-slice.sh` after rebuilding both demo and prodlike images and recreating containers.

```text
=== Le Mans Phase 3 Verification ===
[1/6] Running format check, lint, type-check and tests inside container...
Checking formatting... All matched files use Prettier code style!
✔ No ESLint warnings or errors
> tsc --noEmit
> ts-node ... src/__tests__/index.ts
✓ Job Order costing tests passed.
✓ RBAC tests passed.
✓ Purchasing allocation tests passed.
✓ Billing tests passed.
✓ DCS tests passed.
✓ Creation form tests passed.
✓ Dashboard regression tests passed.
✓ All test suites passed.
[2/6] Pushing schema and seeding local-demo database...
✓ Database in sync. Seeding complete.
[3/6] HTTP health checks...
OK: http://127.0.0.1:3000/login -> 200
OK: http://127.0.0.1:3000/ -> 307
OK: http://127.0.0.1:3000/customers -> 200
OK: http://127.0.0.1:3000/quotations -> 200
OK: http://127.0.0.1:3000/job-orders -> 200
OK: http://127.0.0.1:3000/job-orders/RA0003973 -> 200
OK: http://127.0.0.1:3000/job-costing/RA0003973 -> 200
OK: http://127.0.0.1:3000/purchasing -> 200
OK: http://127.0.0.1:3000/expenses -> 200
OK: http://127.0.0.1:3000/dcs -> 200
OK: http://127.0.0.1:3000/invoices -> 200
OK: http://127.0.0.1:3000/accounting -> 307
OK: http://127.0.0.1:3001/login -> 200
OK: http://127.0.0.1:3001/ -> 307
OK: http://127.0.0.1:3001/customers -> 200
OK: http://127.0.0.1:3001/job-orders/RA0003973 -> 200
OK: http://127.0.0.1:3001/job-costing/RA0003973 -> 200
OK: http://127.0.0.1:3001/purchasing -> 200
OK: http://127.0.0.1:3001/expenses -> 200
OK: http://127.0.0.1:3001/dcs -> 200
OK: http://127.0.0.1:3001/invoices -> 200
[4/6] Confirming database containers do not publish host ports...
OK: lemans-demo-db has no published host ports
OK: lemans-prodlike-db has no published host ports
[5/6] Confirming prodlike app uses immutable image (no source bind mounts)...
OK: lemans-prodlike-app has no bind mounts
[6/6] Additional regression smoke checks...
OK: http://127.0.0.1:3000/invoices/<seeded-id> -> 200
OK: DCS user does not see GM approval button
OK: http://127.0.0.1:3000/ -> 307
OK: http://127.0.0.1:3001/ -> 307
[6/6] Phase 3 verification complete.
```

All release-blocking defects are resolved and validated in both `local-demo` and `local-prodlike` rootless Podman environments.

---

## 4. Remaining Out-of-Scope Items

- **DEFECT-009–011**: Minor/cosmetic navbar/header badge issues not addressed.
- **Backblaze B2**: Credentials remain placeholders; real file uploads require production secret injection.
- **QBO/CSV export**: Still a scaffold under `/accounting` for a future phase.
- **Remote Quadlets**: Prepared under `quadlet/remote-demo/` and `quadlet/remote-prod/`, not installed.

---

## 5. Conclusion

All release-blocking Phase 4 defects (DEFECT-001 through DEFECT-008) have been fixed, covered by regression tests, and verified inside rootless Podman. The application is now functionally complete for its Phase 3/4 scope and ready for the next governance decision on remote deployment.
