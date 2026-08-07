Attachments: Backblaze B2 S3-compatible API

See docs/adr/0004-attachment-storage-strategy.md.

- SDK: AWS SDK for JavaScript v3 (@aws-sdk/client-s3, @aws-sdk/s3-request-presigner).
- Server-side uploads via PutObjectCommand; downloads via presigned GetObjectCommand.
- Object key pattern: attachments/<entity>/<entityId>/<uuid>-<filename>.
- Attachment metadata stored in PostgreSQL `Attachment` table.
- Presigned download URLs expire in 15 minutes.
- Bucket is private; no direct browser upload; credentials never reach client.

Environment variables

- B2_ENDPOINT, B2_REGION, B2_ACCESS_KEY_ID, B2_SECRET_ACCESS_KEY, B2_BUCKET_NAME
