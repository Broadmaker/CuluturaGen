// Pure-ish helpers for scripts/db-backup.mjs (Supabase Phase B + hardening).
// Kept importable (no top-level side effects) so vitest can cover them:
// db-backup.mjs itself executes on import and must NOT be imported by tests.
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";

// Prisma-style ?schema= breaks libpq tools — strip it; a backup dumps all
// schemas anyway.
export function sanitizeDbUrl(raw) {
  try {
    const u = new URL(raw);
    u.searchParams.delete("schema");
    return u.toString();
  } catch {
    return raw;
  }
}

// pg_dump needs a session-mode connection: DIRECT_URL wins (direct :5432 or
// session pooler :5432); the transaction pooler (:6543) breaks pg_dump with
// prepared-statement errors under PgBouncer.
/**
 * @param {Record<string, string | undefined>} [env]
 * @returns {{ url: string, source: "DIRECT_URL" | "DATABASE_URL" }}
 */
export function resolveDumpUrl(env = process.env) {
  const direct = env.DIRECT_URL?.trim();
  if (direct) return { url: sanitizeDbUrl(direct), source: "DIRECT_URL" };
  const fallback = env.DATABASE_URL?.trim();
  if (!fallback) throw new Error("Neither DIRECT_URL nor DATABASE_URL is set");
  return { url: sanitizeDbUrl(fallback), source: "DATABASE_URL" };
}

/**
 * @param {Record<string, string | undefined>} [env]
 * @returns {"local" | "s3"}
 */
export function storageBackend(env = process.env) {
  const raw = (env.STORAGE_BACKEND || "local").toLowerCase().trim();
  if (raw === "local" || raw === "s3") return raw;
  throw new Error(`STORAGE_BACKEND=${JSON.stringify(raw)} is not supported.`);
}

/**
 * @param {Record<string, string | undefined>} [env]
 */
export function createS3ClientFromEnv(env = process.env) {
  const missing = [];
  const endpoint = env.STORAGE_URL?.trim();
  const bucket = env.STORAGE_BUCKET?.trim();
  const region = env.STORAGE_REGION?.trim() || "local";
  const accessKeyId = env.STORAGE_ACCESS_KEY?.trim();
  const secretAccessKey = env.STORAGE_SECRET_KEY?.trim();
  if (!endpoint) missing.push("STORAGE_URL");
  if (!bucket) missing.push("STORAGE_BUCKET");
  if (!accessKeyId) missing.push("STORAGE_ACCESS_KEY");
  if (!secretAccessKey) missing.push("STORAGE_SECRET_KEY");
  if (missing.length > 0) throw new Error(`S3 backup needs ${missing.join(", ")}`);
  const client = new S3Client({
    forcePathStyle: true,
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
  return { client, bucket };
}

// Full bucket listing for the backup manifest (paginated). Bytes stay in
// the versioned Supabase bucket — the manifest proves WHAT existed; the
// pg_dump proves the DB side. Restoring bytes = Supabase point-in-time.
/**
 * @param {{ send: (cmd: unknown) => Promise<any> }} client
 * @param {string} bucket
 */
export async function listS3Manifest(client, bucket) {
  const entries = [];
  let token;
  do {
    const out = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token, MaxKeys: 1000 }),
    );
    for (const o of out.Contents ?? []) {
      entries.push({
        key: o.Key,
        size: o.Size ?? 0,
        etag: (o.ETag ?? "").replace(/"/g, ""),
        lastModified: o.LastModified ? o.LastModified.toISOString() : null,
      });
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return entries;
}
