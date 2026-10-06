import { promises as fs } from "node:fs";
import path from "node:path";
import { getStorageBackend } from "./storage-config";
import { s3Delete, s3Get, s3Probe, s3Put } from "./storage-s3";

// Binary storage facade (md/10 §8, md/09 §81). Signatures are backend-stable:
// STORAGE_BACKEND=local (default, $0, disk under STORAGE_DIR) or
// STORAGE_BACKEND=s3 (Supabase Storage via its S3 protocol endpoint in prod).
// Keys (relative paths) are identical on both backends, so file_assets rows
// and /api/files URLs never change when the backend flips. Served read-only
// via GET /api/files/[...path] (session-guarded).
function storageRoot(): string {
  return process.env.STORAGE_DIR || path.join(process.cwd(), "storage");
}

function useS3(): boolean {
  return getStorageBackend() === "s3";
}

function safeJoin(...parts: string[]): string {
  const root = storageRoot();
  const resolved = path.normalize(path.join(root, ...parts));
  if (!resolved.startsWith(root)) throw new Error("Unsafe storage path.");
  return resolved;
}

export async function saveGeneratedImage(
  designId: string,
  versionNumber: number,
  bytes: Buffer,
  ext: "svg" | "png",
): Promise<{ relativePath: string; url: string }> {
  const dir = ["projects", "generated", designId];
  const file = `v${versionNumber}.${ext}`;
  const relativePath = [...dir, file].join("/");
  if (useS3()) {
    await s3Put(relativePath, bytes, mimeForExt(`.${ext}`));
  } else {
    await fs.mkdir(safeJoin(...dir), { recursive: true });
    await fs.writeFile(safeJoin(...dir, file), bytes);
  }
  return { relativePath, url: `/api/files/${relativePath}` };
}

export async function saveReportFile(
  projectId: string,
  fileName: string,
  bytes: Buffer,
): Promise<{ relativePath: string; url: string }> {
  const dir = ["projects", "reports", projectId];
  const relativePath = [...dir, fileName].join("/");
  if (useS3()) {
    await s3Put(relativePath, bytes, mimeForExt(path.extname(fileName).toLowerCase()));
  } else {
    await fs.mkdir(safeJoin(...dir), { recursive: true });
    await fs.writeFile(safeJoin(...dir, fileName), bytes);
  }
  return { relativePath, url: `/api/files/${relativePath}` };
}

export async function saveBodyReferenceImage(
  projectId: string,
  bytes: Buffer,
  ext: "jpg" | "png" | "webp",
): Promise<{ relativePath: string; url: string }> {
  const dir = ["projects", "uploads", projectId];
  const file = `body-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const relativePath = [...dir, file].join("/");
  if (useS3()) {
    await s3Put(relativePath, bytes, mimeForExt(`.${ext}`));
  } else {
    await fs.mkdir(safeJoin(...dir), { recursive: true });
    await fs.writeFile(safeJoin(...dir, file), bytes);
  }
  return { relativePath, url: `/api/files/${relativePath}` };
}

export async function deleteStorageFile(relativePath: string): Promise<void> {
  if (useS3()) {
    await s3Delete(relativePath);
    return;
  }
  try {
    await fs.unlink(safeJoin(relativePath));
  } catch {
    // Best-effort: the DB row is the source of truth; a missing file is fine.
  }
}

export async function readStorageFile(relativePath: string): Promise<{ bytes: Buffer; ext: string } | null> {
  if (useS3()) return s3Get(relativePath);
  try {
    const bytes = await fs.readFile(safeJoin(relativePath));
    return { bytes, ext: path.extname(relativePath).toLowerCase() };
  } catch {
    return null;
  }
}

const MIME: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

export function mimeForExt(ext: string): string {
  return MIME[ext] ?? "application/octet-stream";
}

// Health probe (production readiness): verifies the active backend is
// writable. Throws on failure; the health endpoint converts it to degraded.
export async function probeStorage(): Promise<void> {
  if (useS3()) {
    await s3Probe();
    return;
  }
  const name = `.health-${Date.now().toString(36)}`;
  const full = safeJoin(name);
  await fs.writeFile(full, "ok");
  await fs.unlink(full);
}
