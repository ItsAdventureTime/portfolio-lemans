# Le Mans Operations & Job Cost Management System - Delivery Plan

## 1. Project Delivery Roadmap

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: INTAKE & ARCHITECTURE CONTRACTS (COMPLETED & APPROVED)                       │
│ - Inventory raw files & map provenance into _intake/originals/ & references/           │
│ - Establish durable project contracts (AGENTS.md, SPEC, DESIGN, ARCH, ENVS)            │
│ - Ground architecture with web research (Podman Quadlet systemd, Next.js standalone)   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: THIN VERTICAL SLICE VALIDATION (COMPLETED & VERIFIED)                         │
│ - Verified rootless Podman environment via `podman machine start` & `podman info`      │
│ - Built & verified local-demo container stack (127.0.0.1:3000) with disposable `podman run --rm` │
│ - Built & verified local-prodlike standalone container stack (127.0.0.1:3001)           │
│ - Implemented End-to-End Flow: Customer/Vehicle -> Sales Quote -> JO RA0003973 -> Cost Sheet│
│ - Passed automated unit tests, type-checking, database migrations, and loopback HTTP   │
│ - Created docs/PHASE-2-RESULTS.md & docs/PHASE-3-HANDOFF.md                            │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: CORE OPERATIONS MODULES IMPLEMENTATION (NEXT PHASE)                           │
│ - Authentication & RBAC: Better Auth integration, role matrix, session DAL              │
│ - Service Delivery & Technician Progress Tracking                                      │
│ - Purchasing: Purchase Requests (PR), POs, Supplier Invoice Multi-JO Line Allocation   │
│ - Expenses: OPEX Request Budget Form & GM Approval Workflow                            │
│ - DCS Module: Payment Execution & Proof-of-Payment Upload via Backblaze B2            │
│ - Billing: Official Service Invoice Generation (RA0003973 format with 12% VAT)        │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: REPORTING, ADMIN, QBO EXPORT, & ACCOUNTING MODULES                            │
│ - Job Cost Sheet deep-dive timeline & profit calculation                               │
│ - Executive Reporting Suite (Sales, Purchases, Profitability, AR Aging)                │
│ - QBO Export Engine (Customers, Vendors, Bills, Expenses, Invoices, Payments)          │
│ - System Administration (RBAC, Audit Logs, Database Backup/Restore)                   │
│ - Admin-Only Accounting Module (General Ledger, AP, Journal Entries)                   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: QUADLET CONTAINERIZATION & DEPLOYMENT PREPARATION                             │
│ - Multi-architecture container image builds (arm64 & amd64 tags) using pure `podman build` │
│ - Generate Quadlet unit files (`.container`, `.volume`, `.network`, `.service`, `.timer`) │
│   - Demo: `/home/jk/.config/containers/systemd/bridge-ph/lemans-demo`                 │
│   - Prod: `/home/jk/.config/containers/systemd/bridge-ph/lemans`                      │
│ - Deploy via `scripts/deploy-remote-demo.sh` and `scripts/deploy-remote-prod.sh`        │
│ - Remote demo auto-reset every 30 minutes; production daily backup to Backblaze B2    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Phase 2 Completion Summary

- **Verification Summary**: Documented in [`docs/PHASE-2-RESULTS.md`](file:///Users/jk.deguzman/dev/lemans-bridge-dashboard/docs/PHASE-2-RESULTS.md).
- **Handoff Summary**: Documented in [`docs/PHASE-3-HANDOFF.md`](file:///Users/jk.deguzman/dev/lemans-bridge-dashboard/docs/PHASE-3-HANDOFF.md).
- **Architecture Readiness**: Verified & Approved for Phase 3.
- **Phase 3 Implementation Plan**: [`docs/PHASE-3-IMPLEMENTATION.md`](file:///Users/jk.deguzman/dev/lemans-bridge-dashboard/docs/PHASE-3-IMPLEMENTATION.md).
