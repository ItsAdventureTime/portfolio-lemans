# Go API architecture

## Overview

The Go API in `backend/` owns persistence, business rules, migrations, and
presigned object-storage URLs. The Next.js 16 frontend in `src/` presents the
data and calls the API over the internal Podman network.

## Project layout

```text
backend/
├── cmd/api/main.go              # application bootstrap
├── go.mod                       # Go latest dependencies
├── internal/
│   ├── actor/                   # demo actor / X-Demo-Role parsing
│   ├── api/                     # Chi router, HTTP handlers, routes
│   ├── b2/                      # Backblaze B2 presigned URL helpers
│   ├── config/                  # env-based configuration
│   ├── db/                      # goose migrations (embed)
│   ├── logger/                  # slog JSON setup
│   ├── mathx/                   # money helpers (int64 cents)
│   ├── policy/                  # role-based action permissions
│   └── repository/              # sqlc-generated PostgreSQL repository
```

## Technology stack

- **Language**: Go 1.26 (`golang:alpine`)
- **Router**: `github.com/go-chi/chi/v5` + `github.com/go-chi/cors`
- **Database driver**: `github.com/jackc/pgx/v5` + `pgxpool`
- **Migrations**: `github.com/pressly/goose/v3` with embedded migration files
- **Repository**: sqlc (`sqlc.yaml`) generating type-safe queries
- **Object storage**: AWS SDK for Go v2 (`github.com/aws/aws-sdk-go-v2/service/s3`)
- **Logging**: `log/slog` JSON output

## Data model

All money is stored as integer cents (`bigint`) in PostgreSQL. The Go API uses
`int64` and the frontend formats values with `₱` helpers (`src/lib/money.ts`).

Key tables:

- `users`, `roles`, `customers`, `vehicles`
- `quotes`, `quote_items`
- `job_orders`, `job_order_labors`, `job_order_parts`
- `purchase_requests`, `purchase_request_items`, `purchase_orders`
- `expense_requests`, `expense_payments`
- `dcs_payments`
- `supplier_invoices`, `supplier_invoice_allocations`
- `customer_invoices`, `customer_invoice_items`, `customer_invoice_allocations`
- `attachments`
- `accounting_summary`

## Demo role simulation

The Go API reads the `X-Demo-Role` header on mutating requests. The header value
is validated by the `actor` package and matched against `policy` permissions.
Invalid or missing roles resolve to `ADMIN`.

## Key routes

- `GET /health` – service readiness
- `POST /admin/seed` (DEMO_MODE only) – seed database
- `/api/customers/*`, `/api/quotations/*`, `/api/job-orders/*`, `/api/purchase-requests/*`, `/api/opex-requests/*`,
  `/api/supplier-invoices/*`, `/api/disbursements/*`, `/api/invoices/*`,
  `/api/accounting/*`, `/api/dashboard`
- `GET /api/accounting/exports/{csv|json}` – Admin-only deterministic export
  containing customers, derived vendors, bills, expenses, invoices,
  collections, and payments. The Next.js `/api/accounting/export/{format}`
  route proxies the browser download without exposing the internal Go API.

## Job-order lookup

`GET /api/job-orders/{idOrJoNo}` and its child routes accept either a UUID `id`
or the human-readable `jo_no` (e.g. `RA0003973`). The handler resolves the
parameter to a UUID internally.

## Financial and workflow integrity

- Persisted money uses `int64` cents; frontend decimal input is converted before
  it reaches the Go API.
- Quotation line data is validated server-side. Creating a quote and converting
  an approved quote to a job order are transactional, so a failed item or event
  write cannot leave partial records.
- Conversion claims the source quote only while it is `APPROVED`; concurrent or
  repeated conversion attempts receive a validation error instead of creating a
  second job order.
- Document identifiers use a time label plus a cryptographically random suffix,
  rather than a count-based sequence that can collide under concurrent requests.

## Attachment flow

### DCS proof of payment

1. The frontend requests a presigned upload URL from
   `GET /api/disbursements/{id}/proof-upload-url?fileName=...&contentType=...`.
2. The frontend uploads the file directly to Backblaze B2 using the returned
   URL.
3. The frontend registers the key with
   `POST /api/disbursements/{id}/attach-proof` using
   `{ "storageKey": "..." }`.
4. Authorized download requests use
   `GET /api/disbursements/{id}/proof-download-url` to receive a short-lived
   presigned `GetObject` URL, or `{ "url": null }` when no proof exists.

### Job-order attachment metadata

Job-order attachment records use `GET /api/job-orders/{id}/attachments` and
`POST /api/job-orders/{id}/attachments`. The POST body records `fileName`,
`contentType`, `size`, and `storageKey`. The current API does not expose a
separate job-order presign route; clients must not document or call the removed
`/attachments/presign-upload` or `/attachments/:id/url` paths.

## Build

```bash
./scripts/build.sh demo   # builds demo-web + demo-go
./scripts/build.sh prod   # builds prod-web + prod-go
```

See `AGENTS.md` and `docs/ENVIRONMENTS-AND-PATHS.md` for image-tagging and
container runtime rules.
