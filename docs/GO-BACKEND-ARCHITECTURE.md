# Go Backend Architecture

## Overview

The Le Mans system uses a Go API backend (`backend/`) as the single source of
truth for persistence, business logic, migrations, and object-storage presigned
URLs. The Next.js 16 frontend (`src/`) is a thin presentation layer that calls
the Go API over an internal Podman bridge network.

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

- **Language**: Go latest (`golang:alpine`)
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
  `/api/accounting/*`, `/api/dashboard`, `/attachments/*`
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

1. Frontend requests a presigned upload URL from `GET /attachments/presign-upload?objectName=...`
2. Frontend uploads the file directly to Backblaze B2 using the URL.
3. Frontend posts metadata to `POST /attachments`.
4. Downloads use `GET /attachments/:id/url` to receive a short-lived presigned `GetObject` URL.

## Build

```bash
./scripts/build.sh demo   # builds demo-web + demo-go
./scripts/build.sh prod   # builds prod-web + prod-go
```

See `AGENTS.md` and `docs/ENVIRONMENTS-AND-PATHS.md` for image-tagging and
container runtime rules.
