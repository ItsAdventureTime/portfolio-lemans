Language / runtime

- TypeScript 5.5.4
- Node.js 20 Alpine (demo image tag: latest-alpine; prod: lts-alpine)
- Next.js 14.2.8 App Router, `output: 'standalone'`
- React 18.3.1

Data & auth

- PostgreSQL 16 Alpine
- Prisma 5.19.0 + @prisma/client
- Better Auth (database sessions, official Prisma adapter) — see `mem:auth`

Storage

- Backblaze B2 via S3-compatible API
- AWS SDK for JavaScript v3: @aws-sdk/client-s3, @aws-sdk/s3-request-presigner

Styling

- Tailwind CSS 3.4.10
- lucide-react icons
- clsx + tailwind-merge for class utilities

Build / test

- npm scripts: dev, build, start, test, db:push, db:seed
- ts-node for test runner and seed
- Tests run inside rootless Podman containers only.
