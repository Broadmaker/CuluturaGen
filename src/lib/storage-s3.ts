import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  resolveS3Config,
  sanitizeStorageKey,
  type S3StorageConfig,
} from "./storage-config";

// S3-compatible object backend (md/10 §8, md/09 §81). Production target is
// Supabase Storage via its S3 protocol endpoint (forcePathStyle per
// Supabase docs); any S3-compatible service works — the app only needs
// endpoint + bucket + keys. Server-side only: S3 access keys bypass bucket
// RLS by design, so they never leave the server (same posture as AI keys).
// Keys mirror the local relative paths, so file_assets rows and /api/files
// URLs are backend-independent. Reads stay proxied through the authed
// /api/files route — no signed-URL expiry, no access-control change.

let cachedClient: S3Client | null = null;
let cachedBucket: string | null = null;

function clientAndBucket(): { client: S3Client; bucket: string } {
  if (cachedClient && cachedBucket) return { client: cachedClient, bucket: cachedBucket };
  const cfg: S3StorageConfig = resolveS3Config();
  cachedClient = new S3Client({
    forcePathStyle: true,
    endpoint: cfg.endpoint,
    region: cfg.region,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
  cachedBucket = cfg.bucket;
  return { client: cachedClient, bucket: cachedBucket };
}

export async function s3Put(
  relativePath: string,
  bytes: Buffer,
  contentType: string,
): Promise<void> {
  const Key = sanitizeStorageKey(relativePath);
  const { client, bucket } = clientAndBucket();
  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key, Body: bytes, ContentType: contentType }),
  );
}

export async function s3Get(relativePath: string): Promise<{ bytes: Buffer; ext: string } | null> {
  const Key = sanitizeStorageKey(relativePath);
  const { client, bucket } = clientAndBucket();
  try {
    const out = await client.send(new GetObjectCommand({ Bucket: bucket, Key }));
    if (!out.Body) return null;
    const data = await (out.Body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
    const dot = Key.lastIndexOf(".");
    const ext = dot >= 0 ? Key.slice(dot).toLowerCase() : "";
    return { bytes: Buffer.from(data), ext };
  } catch (e) {
    if ((e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) {
      return null;
    }
    if ((e as { name?: string }).name === "NoSuchKey") return null;
    throw e;
  }
}

export async function s3Delete(relativePath: string): Promise<void> {
  const Key = sanitizeStorageKey(relativePath);
  const { client, bucket } = clientAndBucket();
  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key }));
  } catch {
    // Best-effort: the DB row is the source of truth; a missing object is fine.
  }
}

// Write probe (mirrors the local probe): verifies credentials + bucket
// writability end to end. Throws on failure; health converts to degraded.
export async function s3Probe(): Promise<void> {
  const { client, bucket } = clientAndBucket();
  await client.send(new HeadBucketCommand({ Bucket: bucket }));
  const Key = `.health-${Date.now().toString(36)}`;
  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key, Body: Buffer.from("ok"), ContentType: "text/plain" }),
  );
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key }));
}

// Test-only escape hatch.
export function resetS3Client(): void {
  cachedClient = null;
  cachedBucket = null;
}
