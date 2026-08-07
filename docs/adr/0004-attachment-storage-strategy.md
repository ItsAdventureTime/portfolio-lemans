# ADR 0004: Attachment Storage Strategy

- **Status**: Approved
- **Deciders**: Lead Agent, Project Architect
- **Date**: 2026-08-07

## Context

The system must store file attachments for:

- Inspection / repair photos on Job Orders.
- Proof-of-payment receipts and cheques uploaded by DCS.
- Supporting documents on Supplier Invoices and OPEX Requests.

Attachments must be durable, accessible to authorized users only, and must not require mounting broad host directories into containers (per AGENTS.md sandbox restrictions).

## Decision

We use **Backblaze B2 Cloud Storage via its S3-Compatible API** as the object store for all file attachments.

1. **SDK**: AWS SDK for JavaScript v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`).
   - Backblaze B2 exposes an S3-compatible endpoint per bucket/region.
2. **Access Model**: Server-side uploads with presigned GET URLs.
   - Files are uploaded by Next.js Server Actions using the S3 `PutObjectCommand`.
   - Downloads are served via short-lived presigned `GetObjectCommand` URLs generated on demand.
   - No direct browser upload path is used, keeping S3 credentials on the server.
3. **Object Keys**: `attachments/<entity>/<entityId>/<uuid>-<filename>`.
   - Examples: `attachments/job-order/RA0003973/<uuid>-engine-photo.jpg`, `attachments/dcs-payment/<id>/<uuid>-receipt.jpg`.
4. **Metadata**: File records are stored in PostgreSQL via a new `Attachment` table.
   - Columns: `id`, `entityType`, `entityId`, `fileName`, `contentType`, `size`, `storageKey`, `uploadedById`, `createdAt`.
5. **Environment Variables** (injected via Podman container env, never committed):
   - `B2_ENDPOINT`
   - `B2_REGION`
   - `B2_ACCESS_KEY_ID`
   - `B2_SECRET_ACCESS_KEY`
   - `B2_BUCKET_NAME`
6. **Security & Lifecycle**:
   - Bucket is private; presigned URLs expire in 15 minutes.
   - Object keys are non-guessable UUID-based.
   - File access is gated by role/ownership checks in the Server Action that generates the presigned URL.
   - Lifecycle/versioning rules are managed in Backblaze; application code records references only.

## Consequences

- **Positive**: No host filesystem mounts required; durable off-host storage; scales with backup needs; S3-compatible tooling available.
- **Negative**: Adds external service dependency; requires B2 application key management; presigned URL expiry must be handled in UI.

## Compliance

- Avoids broad container bind mounts (`$HOME`, `/`, etc.).
- Keeps credentials out of the image and source control via container environment injection.
- No remote deployment or Backblaze account provisioning is performed by the agent.
