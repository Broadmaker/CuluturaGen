export type StorageBackend = "local" | "s3";

export interface S3StorageConfig {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

// Backend selection for binary storage (md/10 §8, md/09 §81). Local disk is
// the safe default ($0, offline); "s3" selects any S3-compatible backend —
// in production Supabase Storage via its S3 protocol endpoint — with no
// call-site changes. Unknown values throw fail-fast so a typo can never
// silently store files somewhere unintended.
export function getStorageBackend(): StorageBackend {
  const raw = (process.env.STORAGE_BACKEND || "local").toLowerCase().trim();
  if (raw === "local") return "local";
  if (raw === "s3") return "s3";
  throw new Error(
    `STORAGE_BACKEND=${JSON.stringify(raw)} is not supported (expected "local" or "s3").`,
  );
}

// S3 keys mirror the local relative paths (projects/generated/…), so the DB
// metadata (file_assets.storageUrl) and the /api/files URL scheme are
// identical on both backends. Rejects traversal/absolute keys — S3 has no
// directory sandbox, so this is the only guardrail.
export function sanitizeStorageKey(key: string): string {
  const normalized = key.replace(/\\/g, "/").trim();
  if (!normalized || normalized.startsWith("/") || /(^|\/)\.\.(\/|$)/.test(normalized)) {
    throw new Error("Unsafe storage key.");
  }
  return normalized;
}

// Reads + validates the S3 backend config. Throws naming the missing variable
// (never prints values) so a misconfigured deploy fails loudly at first use,
// not with an opaque SDK error mid-request.
export function resolveS3Config(): S3StorageConfig {
  const missing: string[] = [];
  const endpoint = process.env.STORAGE_URL?.trim();
  const bucket = process.env.STORAGE_BUCKET?.trim();
  const region = process.env.STORAGE_REGION?.trim() || "local";
  const accessKeyId = process.env.STORAGE_ACCESS_KEY?.trim();
  const secretAccessKey = process.env.STORAGE_SECRET_KEY?.trim();
  if (!endpoint) missing.push("STORAGE_URL");
  if (!bucket) missing.push("STORAGE_BUCKET");
  if (!accessKeyId) missing.push("STORAGE_ACCESS_KEY");
  if (!secretAccessKey) missing.push("STORAGE_SECRET_KEY");
  if (missing.length > 0) {
    throw new Error(
      `STORAGE_BACKEND=s3 is missing ${missing.join(", ")} — see .env.example (Supabase: Storage → S3 configuration page).`,
    );
  }
  return { endpoint: endpoint!, bucket: bucket!, region, accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! };
}
