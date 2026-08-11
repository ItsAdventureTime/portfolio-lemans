# Technology stack

- Frontend: Next.js 16.3 App Router, React 19.2, TypeScript strict mode, Tailwind.
- Backend: Go 1.26, chi router, pgx/pgxpool, Goose migrations, sqlc-generated PostgreSQL queries, `log/slog`.
- Containers: `node:lts-alpine` web image; `golang:alpine` build + `alpine:latest` API runtime; `postgres:alpine` database; all rootless Podman.
- Attachments: Backblaze B2 through AWS SDK for Go v2 S3-compatible presigned URLs.
- Tests: Go unit tests; Playwright Chromium desktop, iPhone-sized Chromium touch emulation, and reduced-motion profiles.
- Accounting exports: Go generates deterministic, formula-safe Excel-compatible CSV and JSON interchange data; Next route handler proxies downloads. Files are not direct QuickBooks-import schemas.