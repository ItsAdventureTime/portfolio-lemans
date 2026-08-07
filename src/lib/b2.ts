import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const client = new S3Client({
  endpoint: process.env.B2_ENDPOINT,
  region: process.env.B2_REGION ?? 'us-west-004',
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.B2_SECRET_ACCESS_KEY ?? '',
  },
  forcePathStyle: true,
});

const bucket = process.env.B2_BUCKET_NAME ?? '';

export async function generateUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: 900 });
}

export async function generateDownloadUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn: 900 });
}
