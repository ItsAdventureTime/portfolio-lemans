# Technology stack

- Frontend: Next.js 16.3 App Router, React 19.2, TypeScript strict mode, Tailwind.
- Backend: Go 1.26, chi router, pgx/pgxpool, Goose migrations, sqlc-generated PostgreSQL queries, `log/slog`.
- Local execution: initialized Docker Sandbox with Docker; no local Podman machine.
- Images: `node:lts-alpine` web image; `golang:alpine` native build stage with target-aware Go cross-compilation; `alpine:latest` API runtime; `postgres:alpine` database.
- Remote runtime: rootless Podman Quadlets on the VPS; deployment imports the local image bundle with `podman load`.
- Deployment target: current VPS `linux/amd64`; `TARGET_PLATFORM` is an explicit override only after verifying a different target.
- Attachments: Backblaze B2 through AWS SDK for Go v2 S3-compatible presigned URLs.
- Tests: Go unit tests; Playwright Chromium desktop, iPhone-sized Chromium touch emulation, and reduced-motion profiles.
- Accounting exports: Go generates deterministic, formula-safe Excel-compatible CSV and JSON interchange data; Next route handler proxies downloads. Files are not direct QuickBooks-import schemas.