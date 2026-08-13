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

We use **Backblaze B2 Cloud Storage via its S3-Compatible API** as the object store for all file attachments.

1. **SDK**: AWS SDK for Go v2 in the Go API (`backend/internal/b2`).
   - Backblaze B2 exposes an S3-compatible endpoint per bucket/region.
2. **Access Model**: The Go API creates presigned upload and download URLs.
   - The frontend uploads directly to B2 with a short-lived presigned PUT URL;
     B2 credentials remain only in the Go API container.
   - The Go API registers attachment metadata after upload and returns
     short-lived presigned GET URLs for downloads.
3. **Object Keys**: one shared private bucket, `bridge-ph`, with profile prefixes
   `lemans/demo` for demo and `lemans` for production, followed by
   `attachments/<entity>/<entityId>/<uuid>-<filename>`.

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
   - Lifecycle/versioning rules are managed in Backblaze; application code records references only.

## Consequences

- **Positive**: No host filesystem mounts required; durable off-host storage; scales with backup needs; S3-compatible tooling available.
- **Negative**: Adds external service dependency; requires B2 application key management; presigned URL expiry must be handled in UI.

## Compliance

- Avoids broad container bind mounts (`$HOME`, `/`, etc.).
- Keeps credentials out of the image and source control via container environment injection.
- No remote deployment or Backblaze account provisioning is performed by the agent.
