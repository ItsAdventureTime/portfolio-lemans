# ADR 0004: Attachment Storage Strategy

- **Status**: Approved
- **Deciders**: Lead Agent, Project Architect
- **Date**: 2026-08-12

## Context

The system must store file attachments for:

- Inspection / repair photos on Job Orders.
- Proof-of-payment receipts and cheques uploaded by DCS.
- Supporting documents on Supplier Invoices and OPEX Requests.

Attachments must be durable, accessible to authorized users only, and must not require mounting broad host directories into containers (per AGENTS.md sandbox restrictions).

## Decision

Use the AWS S3 API abstraction in the Go service for object attachments. Existing
script-run and VPS profiles use Backblaze B2. The planned Mac mini Compose demo
uses Cloudflare R2 through the same presigner; this target's account, bucket,
and deployment are not yet verified.

1. **SDK**: AWS SDK for Go v2 in the Go API (`backend/internal/b2`).
   - Each profile supplies its own S3-compatible endpoint and region.
2. **Access Model**: The Go API creates presigned upload and download URLs.
   - The DCS server action sends proof files to the short-lived presigned PUT
     URL. Storage credentials remain only in the Go API container.
   - The Go API registers attachment metadata after upload and returns
     short-lived presigned GET URLs for downloads.
3. **Object Keys**: Existing profiles use private bucket `bridge-ph`, with
   prefixes `lemans/demo` for demo and `lemans` for production. The planned
   Compose demo uses private bucket `portfolio-lemans` and prefix `lemans/demo`.
   Keys end with `attachments/<entity>/<entityId>/<uuid>-<filename>`.

- Examples: `lemans/demo/attachments/job-order/RA0003973/<uuid>-engine-photo.jpg`,
  `lemans/attachments/dcs-payment/<id>/<uuid>-receipt.jpg`.

4. **Metadata**: File records are stored in PostgreSQL via the `attachments`
   table, including `id`, `entity_type`, `entity_id`, `file_name`,
   `content_type`, `size_bytes`, `storage_key`, `created_by_role`, and
   `created_at`.
5. **Environment Variables** (injected via Podman container env, never committed):
   - `B2_ENDPOINT`
   - `B2_REGION`
   - `B2_ACCESS_KEY_ID`
   - `B2_SECRET_ACCESS_KEY`

- `B2_BUCKET_NAME`
- `B2_KEY_PREFIX` (`lemans/demo` for demo; `lemans` for production)

6. **Security & Lifecycle**:
   - Bucket is private; presigned URLs expire in 15 minutes.
   - Object keys are non-guessable UUID-based.
   - File access is gated by the Go API's centralized demo actor and policy
     checks before it creates presigned URLs.
   - Existing B2 lifecycle/versioning remains operator-managed. For the
     portfolio R2 bucket, configure a lifecycle expiration rule scoped to
     `lemans/demo/` at 30 days; application code records references only. R2
     may take 24 hours or longer to delete an expired object. See the
     [Cloudflare R2 object lifecycle guide](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)
     (checked 2026-09-24).

## Consequences

- **Positive**: No host filesystem mounts required; durable off-host storage; scales with backup needs; S3-compatible tooling available.
- **Negative**: Adds an external service dependency. Each provider needs scoped
  key management and operator-managed retention; presigned URL expiry must be
  handled in UI.

## Compliance

- Avoids broad container bind mounts (`$HOME`, `/`, etc.).
- Keeps credentials out of the image and source control; the portfolio Compose
  target mounts external R2 secret files only into the Go API.
- No remote deployment, B2 or R2 account provisioning, or lifecycle rule is
  performed by the agent.
