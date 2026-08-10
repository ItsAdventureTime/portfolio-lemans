# Reviewer / Evaluator Agent Handoff — Le Mans Demo Refactor & Hardening

> **Commit under review:** `33b4a6d` — `feat(demo): UX overhaul, shared UI components, and deployment hardening`
>
> **Repository:** `lemans-bridge-dashboard`  
> **Project:** Le Mans Operations & Job Cost Management System (LeMans Service Plus OPC)  
> **Handoff date:** 2026-08-10  
> **Authoring agent:** OpenCode / Lead Software Architect agent  

---

## 1. Purpose of this handoff

This document tells the **reviewer/evaluator agent** (or human reviewer) exactly what to inspect, how to reproduce the results, and what standards to apply. It synthesizes the latest community guidance for evaluating agent-generated code changes, adapted to this repository’s containerized, Podman-only workflow and demo-first architecture.

---

## 2. What changed (high-level)

| Area | Before | After |
|------|--------|-------|
| **Frontend pages** | Monolithic server pages with inline tables/forms (`page.tsx` files only) | Modular component split: `*Form.tsx` (client), `*List.tsx` (client), and thin `page.tsx` (server) for customers, quotations, job orders, invoices, expenses, purchasing |
| **Shared UI** | Ad-hoc raw inputs/buttons everywhere | New `src/components/ui/` library: `DataTable`, `FormField`, `StatusBadge`, `EmptyState`, `SectionCard`, `Skeleton` |
| **Money formatting** | Inline `₱${(cents/100).toFixed(2)}` duplicated | Centralized `src/lib/money.ts` using `Intl.NumberFormat('en-PH', { currency: 'PHP' })` |
| **Error boundaries** | Default Next.js fallbacks | Custom `error.tsx`, `global-error.tsx`, `loading.tsx`, `not-found.tsx`, and `AccessDenied.tsx` |
| **Backend API** | No `ListVehicles` endpoint; selector passed raw IDs | Added `/api/vehicles` + generated `ListVehicles` query; selectors now show plate/make-model labels |
| **Backend tests** | No unit tests | Added `actor_test.go`, `money_test.go`, `policy_test.go` |
| **Deployment scripts** | Basic image save/ssh + single env file | Hardened with release manifests, image digests, Podman secret creation, health checks, DB port-unexposure checks, role/actor checks, `--delete` rsync |
| **Remote Quadlet naming** | `lemans-remote-demo-*` / `lemans-remote-prod-*` | Simplified to `lemans-demo-*` / `lemans-prod-*`; internal networks renamed accordingly |
| **Base path** | Local demo served at `/` | Local demo aligned to `/lemans/demo`; `verify-vertical-slice.sh` updated |
| **Accessibility** | Animated loading skeletons only | Added `prefers-reduced-motion` media query in `globals.css` |

---

## 3. Empirical verification already performed

The authoring agent ran the following inside disposable rootless Podman containers on macOS (Apple Silicon). You **must** rerun at least the starred checks before approving.

| Check | Command | Result | Notes |
|-------|---------|--------|-------|
| **Containerized TypeScript check** | `export PATH="/opt/podman/bin:$PATH" && ./scripts/verify-local.sh` | ✅ Pass | format check + `tsc --noEmit`; Go build + `go test ./...` |
| **Containerized production build** | `export PATH="/opt/podman/bin:$PATH" && ./scripts/build.sh demo` | ✅ Pass | images `lemans-bridge-dashboard:demo-web` and `lemans-bridge-dashboard-go:demo-go` |
| **Vertical slice health** | `export PATH="/opt/podman/bin:$PATH" && ./scripts/verify-vertical-slice.sh` | ✅ Pass | HTTP 200 on `/lemans/demo`, `/customers`, `/quotations`, `/job-orders`, `/job-orders/RA0003973`, `/job-costing/RA0003973`, `/purchasing`, `/expenses`, `/dcs`, `/invoices`; Go `/health`; DB no published host ports |
| Live smoke test | `curl http://127.0.0.1:3000/lemans/demo` | ✅ 200 | Static assets load, role switcher visible, 404 on unknown route |

**Lint caveat:** `next lint` is currently disabled in `verify-local.sh` because Next.js 16.3.0/Turbopack’s CLI does not expose a working `lint` command in this environment (it resolves to a non-existent `/app/lint` directory when invoked inside the container). ESLint 9 flat-config + `eslint-config-next` also produce a circular JSON error when invoked directly. Type checking (`tsc --noEmit`) and the production build both pass and catch the same class of static issues. **If you know a working invocation, please add it; do not block approval solely because the disabled lint step is missing unless you can demonstrate a real lint rule violation.**

---

## 4. Files to review (grouped by concern)

### 4.1 Frontend UX / component refactor (most user-visible)
- `src/app/customers/CustomerForm.tsx`
- `src/app/customers/CustomerList.tsx`
- `src/app/customers/page.tsx`
- `src/app/quotations/QuotationForm.tsx`
- `src/app/quotations/QuotationList.tsx`
- `src/app/quotations/page.tsx`
- `src/app/job-orders/JobOrderList.tsx`
- `src/app/job-orders/page.tsx`
- `src/app/invoices/InvoiceForm.tsx`
- `src/app/invoices/InvoiceList.tsx`
- `src/app/invoices/page.tsx`
- `src/app/expenses/OpexForm.tsx`
- `src/app/expenses/OpexList.tsx`
- `src/app/expenses/page.tsx`
- `src/app/purchasing/PurchaseRequestForm.tsx`
- `src/app/purchasing/PurchaseList.tsx`
- `src/app/purchasing/SupplierInvoiceForm.tsx`
- `src/app/purchasing/SupplierInvoiceList.tsx`
- `src/app/purchasing/page.tsx`

### 4.2 Shared UI primitives
- `src/components/ui/DataTable.tsx`
- `src/components/ui/FormField.tsx`
- `src/components/ui/StatusBadge.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/ui/SectionCard.tsx`
- `src/components/ui/Skeleton.tsx`
- `src/components/ui/index.ts`
- `src/components/PageHeader.tsx`
- `src/components/AccessDenied.tsx`

### 4.3 Design system / formatting / boundaries
- `src/lib/money.ts`
- `src/lib/api.ts` (re-export `formatPeso` from `money`; add `listVehicles`)
- `src/app/error.tsx`
- `src/app/global-error.tsx`
- `src/app/loading.tsx`
- `src/app/not-found.tsx`
- `src/app/globals.css`
- `src/components/Navbar.tsx`
- `src/components/sales-quote-builder.tsx`
- `src/components/multi-jo-allocation-modal.tsx`
- `src/components/status-workflow-stepper.tsx`
- `src/components/cascading-customer-vehicle-selector.tsx`

### 4.4 Backend additions
- `backend/internal/api/handlers_customers.go` (new `handleListVehicles`)
- `backend/internal/api/routes.go` (`GET /api/vehicles`)
- `backend/queries.sql` (new `ListVehicles` query)
- `backend/internal/repository/queries.sql.go` (regenerated)
- `backend/internal/actor/actor_test.go`
- `backend/internal/mathx/money_test.go`
- `backend/internal/policy/policy_test.go`

### 4.5 Deployment / infrastructure hardening
- `scripts/build.sh`
- `scripts/run-local.sh`
- `scripts/verify-local.sh`
- `scripts/verify-vertical-slice.sh`
- `scripts/deploy-remote-demo.sh`
- `scripts/deploy-remote-prod.sh`
- `quadlet/remote-demo/*`
- `quadlet/remote-prod/*`

---

## 5. Review rubric for the evaluator agent

Apply the following checklist. Score each item **PASS / WARN / FAIL**. A single WARN is acceptable if justified; two or more WARNs on the same concern should be treated as a FAIL for that concern.

### 5.1 Correctness & behavior
- [ ] **C1.** All pages load without 500 errors in the local demo (`./scripts/verify-vertical-slice.sh` passes).
- [ ] **C2.** A known job-order detail route (e.g. `/lemans/demo/job-orders/RA0003973`) still renders.
- [ ] **C3.** Unknown routes return the custom 404 page (`src/app/not-found.tsx`), not a generic stack trace.
- [ ] **C4.** Role-restricted pages (e.g. `/lemans/demo/accounting` as non-admin) render `AccessDenied` instead of crashing or silently redirecting.
- [ ] **C5.** Money values are consistently formatted in PHP (₱) with two decimals across customers, quotations, job-costing, invoices, expenses, purchasing, and DCS.
- [ ] **C6.** Form submissions (customer create, quotation create, OPEX create, invoice create, PR create, SI create) refresh the list and preserve role context.

### 5.2 Code quality & maintainability
- [ ] **Q1.** No duplicated inline money formatting remains; `src/lib/money.ts` is the single source of truth.
- [ ] **Q2.** No duplicated table markup remains; `DataTable` is used consistently for list views.
- [ ] **Q3.** Form fields use the shared `FormField` component; raw `<input>` elements in business pages are gone.
- [ ] **Q4.** Status values render via `StatusBadge`; raw `{status}` strings are gone.
- [ ] **Q5.** New components are TypeScript-typed and do not contain `any` leakage in public props.
- [ ] **Q6.** Server actions in `page.tsx` files correctly use `'use server'` and revalidate paths after mutations.

### 5.3 Backend & data layer
- [ ] **B1.** `go test ./...` inside the Go container passes.
- [ ] **B2.** The new `ListVehicles` query is generated from `queries.sql` (do not hand-edit `queries.sql.go` without a corresponding SQL change).
- [ ] **B3.** `GET /api/vehicles` returns vehicles and is wired in `routes.go`.
- [ ] **B4.** No new backend code introduces SQL injection, unchecked `r.PathValue` conversions, or panics.

### 5.4 Security & sandbox compliance (non-negotiable)
- [ ] **S1.** No `--privileged` containers are introduced.
- [ ] **S2.** No `--net=host` usage is introduced.
- [ ] **S3.** Database containers do not publish host ports (`scripts/verify-vertical-slice.sh` confirms).
- [ ] **S4.** No broad host mounts (`$HOME`, `/`, `/etc`, `/usr`) are introduced.
- [ ] **S5.** `podman system prune -a`, `podman rm -fa`, `podman rmi -a`, and `podman machine reset` do **not** appear.
- [ ] **S6.** Deploy scripts only transfer images/Quadlets and do not perform unsanctioned remote SSH commands beyond the declared orchestration.

### 5.5 Deployment / operations
- [ ] **D1.** `./scripts/build.sh demo` and `./scripts/build.sh prod` still produce tagged images per `AGENTS.md`.
- [ ] **D2.** `./scripts/run-local.sh` starts the stack and reports `http://127.0.0.1:3000/lemans/demo/`.
- [ ] **D3.** `./scripts/verify-vertical-slice.sh` checks the `/lemans/demo/*` paths, not root paths.
- [ ] **D4.** Remote Quadlet names are internally consistent (no mixed `lemans-remote-demo-*` and `lemans-demo-*` references within the same environment).
- [ ] **D5.** Remote deploy scripts create/use a Podman secret for the DB password and chmod env files to 600.
- [ ] **D6.** Remote deploy scripts record release manifests (commit, time, digests) under the configured release directory.

### 5.6 Accessibility & design system
- [ ] **A1.** `prefers-reduced-motion` is present in `globals.css`.
- [ ] **A2.** Focus-visible rings are present on interactive elements (buttons, links, inputs).
- [ ] **A3.** Error boundaries include `role="alert"` and `aria-live` attributes.
- [ ] **A4.** Brand red (`#d32f2f` / `brand-primary`) is used as an accent, not as a global danger theme.

### 5.7 Demo fidelity
- [ ] **DF1.** Demo still requires **no authentication** and opens as Admin by default.
- [ ] **DF2.** Role switcher is visible and offers Admin, GM, Sales, Service, Purchasing, DCS.
- [ ] **DF3.** No `requireSession`, login redirect, or password prompt was added.

---

## 6. How to run the canonical checks

```bash
# 1. Ensure rootless Podman is available
export PATH="/opt/podman/bin:$PATH"
podman info | grep -i rootless

# 2. Build demo images
./scripts/build.sh demo

# 3. Static + Go test verification
./scripts/verify-local.sh

# 4. Start the local stack and seed
./scripts/run-local.sh

# 5. Vertical slice smoke test
./scripts/verify-vertical-slice.sh

# 6. Manual spot checks
open http://127.0.0.1:3000/lemans/demo
open http://127.0.0.1:3000/lemans/demo/customers
open http://127.0.0.1:3000/lemans/demo/job-orders/RA0003973

# 7. Clean up when done
./scripts/stop-local.sh
```

If `verify-local.sh` fails for you, capture the full raw output (do not truncate TypeScript or Go test failures) and attach it to the review.

---

## 7. Known issues / open questions for the reviewer

1. **Lint step disabled.** `verify-local.sh` no longer runs `next lint` because the Next.js 16.3.0 CLI inside the container resolves the command incorrectly. The production build and `tsc --noEmit` pass. If you can supply a working container invocation, the authoring agent recommends adding it back in a follow-up commit rather than expanding this one.
2. **Remote deployment not executed.** The deploy scripts were hardened but not run against a live VPS. A reviewer with authorized remote access may run `REMOTE_HOST=... ./scripts/deploy-remote-demo.sh` with `RESET=true` only if explicitly authorized by the user.
3. **Production not seeded.** The demo deploy can seed via `/admin/seed`; production deploy intentionally does not.

---

## 8. Suggested review agent workflow

Based on current best practices (ReviewBench/SWE-PRBench: use real PR context, score coverage + precision, avoid diff-only hallucination; Agentic Benchmark Checklist: validate task/outcome validity and reporting), the evaluator should:

1. **Read the diff in groups** — do not read all 70 files linearly. Use sections 4.1–4.5 above.
2. **Run the reproduction commands** in section 6 and record PASS/WARN/FAIL for each rubric item.
3. **Check for regression coverage** — ensure any removed inline form/table code is genuinely replaced by the shared component, not just deleted.
4. **Look beyond the diff lines** — for example, verify that `src/lib/api.ts` consumers still import `formatPeso` correctly after the move to `src/lib/money.ts`.
5. **Judge findings as CONFIRMED / PLAUSIBLE / FABRICATED** per SWE-PRBench framing:
   - **CONFIRMED:** a real regression or defect introduced by this change, same code path, same fix type.
   - **PLAUSIBLE:** a valid engineering concern that is not necessarily a regression (e.g., future improvement).
   - **FABRICATED:** claim not supported by the changed code (e.g., references files not modified here).
6. **Report with signal-to-noise in mind** — prefer a short list of high-confidence blockers over a long list of nits.

---

## 9. Decision template

Please conclude your review with one of:

- **APPROVED** — all checks pass, no blockers.
- **APPROVED WITH NITS** — minor non-blocking suggestions only (must be clearly labeled as such).
- **CHANGES REQUESTED** — at least one item in sections 5.1–5.6 is FAIL or two+ are WARN.

Include:
- Summary scorecard (PASS/WARN/FAIL per section).
- List of CONFIRMED issues, if any.
- Commands you ran and their outcomes.
- Any follow-up tasks you recommend.

---

**End of handoff.**
