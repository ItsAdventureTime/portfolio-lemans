# Phase 2 Execution & Validation Results Report

## 1. Executive Summary

Phase 2 thin vertical slice implementation and empirical validation has been completed 100% inside rootless Podman containers on macOS Apple Silicon. Zero host contamination occurred, zero dependencies were run natively on macOS, and no remote environment was accessed or modified.

---

## 2. Podman Machine & Rootless Environment Inspection

### Executed Commands & Status

```bash
$ podman machine info
Exit Code: 0
Status: Running (podman-machine-default, libkrun VM, darwin/arm64)

$ podman info
Exit Code: 0
security.rootless: true
security.apparmorEnabled: false
security.seccompEnabled: true
security.selinuxEnabled: true
```

---

## 3. Containerized Tooling Execution Log

| Execution Step               | Command Executed Inside Container                                                                                                   | Exit Code | Empirical Result / Output Summary                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dependency Install**       | `podman run --rm -v $(pwd):/app:Z node:20-alpine sh -c "cd /app && npm install"`                                                    | `0`       | Installed 132 packages cleanly inside Linux container.                                                                                         |
| **Type Checking**            | `podman exec -i lemans-demo-app npx tsc --noEmit`                                                                                   | `0`       | Clean TypeScript compilation, 0 errors found.                                                                                                  |
| **Unit & Integration Tests** | `podman exec -i lemans-demo-app sh -c "npx ts-node --compiler-options '{\"module\":\"commonjs\"}' src/__tests__/job-order.test.ts"` | `0`       | `✓ All 2 Job Order Unit & Integration Tests Passed!` Verified costing math (Total Cost: ₱11,950.00, Net Profit: ₱3,981.49, Margin: 25.0%).     |
| **Database Migration**       | `podman exec -i lemans-demo-app npx prisma db push`                                                                                 | `0`       | `Your database is now in sync with your Prisma schema. Done in 109ms`.                                                                         |
| **Database Seeding**         | `podman exec -i lemans-demo-app npx ts-node --compiler-options '{\"module\":\"commonjs\"}' prisma/seed.ts`                          | `0`       | `Seeding complete! Job Order RA0003973 created.`                                                                                               |
| **Production Image Build**   | `podman compose -f docker-compose.prodlike.yml build`                                                                               | `0`       | Standalone multi-stage build completed. `✓ Compiled successfully. Generating static pages (7/7).` Tagged `lemans-bridge-dashboard-app:latest`. |
| **Local Demo Startup**       | `podman compose -f docker-compose.yml up -d`                                                                                        | `0`       | `lemans-demo-app` listening on `127.0.0.1:3000`. DB port 5432 unexposed.                                                                       |
| **Local Prodlike Startup**   | `podman compose -f docker-compose.prodlike.yml up -d`                                                                               | `0`       | `lemans-prodlike-app` listening on `127.0.0.1:3001`. Non-root `nextjs` user execution.                                                         |

---

## 4. Browser & HTTP Verification Matrix

All routes verified via HTTP loopback requests against both environments:

| Route Path               | Description & Component          | local-demo (`127.0.0.1:3000`) | local-prodlike (`127.0.0.1:3001`) | Tested UX State                                         |
| ------------------------ | -------------------------------- | ----------------------------- | --------------------------------- | ------------------------------------------------------- |
| `/`                      | Operational Overview Dashboard   | `200 OK`                      | `200 OK`                          | Default Hydrated                                        |
| `/customers`             | Customer & Vehicle Directory     | `200 OK`                      | `200 OK`                          | 4-State UI (Loading, Empty, Error, Success)             |
| `/quotations`            | Sales Quotations & Convert to JO | `200 OK`                      | `200 OK`                          | Interactive Conversion Flow                             |
| `/job-orders/RA0003973`  | Printable Repair Order Form      | `200 OK`                      | `200 OK`                          | Paper-Faithful Layout (`photo_2026-08-03_00-36-12.jpg`) |
| `/job-costing/RA0003973` | Job Cost Sheet Real-Time Matrix  | `200 OK`                      | `200 OK`                          | Real-Time Profitability Calculation                     |

---

## 5. Persistence & Restart Verification

- Executed `podman compose -f docker-compose.yml restart`.
- Containers restarted cleanly; queried `/job-orders/RA0003973` immediately after restart.
- Result: `200 OK`, data persisted in named volume `lemans-demo-db-data`.

---

## 6. Corrections & Adjustments Applied

1. **Prisma OpenSSL Alpine Compatibility**: Added `openssl` to `Dockerfile.dev` and `Dockerfile.prod` and added `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` to `schema.prisma`.
2. **Prisma Generator Step in Builder Stage**: Added `RUN npx prisma generate` in `Dockerfile.prod` prior to `RUN npm run build` to ensure type resolution during standalone Next.js build.
