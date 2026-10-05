import { promises as fs } from "node:fs";
import path from "node:path";

// Local file storage for generated images (MVP 4). Served read-only via
// GET /api/files/[...path]. S3-compatible backend arrives with reports.
function storageRoot(): string {
  return process.env.STORAGE_DIR || path.join(process.cwd(), "storage");
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
  await fs.mkdir(safeJoin(...dir), { recursive: true });
  const file = `v${versionNumber}.${ext}`;
  await fs.writeFile(safeJoin(...dir, file), bytes);
  const relativePath = [...dir, file].join("/");
  return { relativePath, url: `/api/files/${relativePath}` };
}

export async function saveReportFile(
  projectId: string,
  fileName: string,
  bytes: Buffer,
): Promise<{ relativePath: string; url: string }> {
  const dir = ["projects", "reports", projectId];
  await fs.mkdir(safeJoin(...dir), { recursive: true });
  await fs.writeFile(safeJoin(...dir, fileName), bytes);
  const relativePath = [...dir, fileName].join("/");
  return { relativePath, url: `/api/files/${relativePath}` };
}

export async function saveBodyReferenceImage(
  projectId: string,
  bytes: Buffer,
  ext: "jpg" | "png" | "webp",
): Promise<{ relativePath: string; url: string }> {
  const dir = ["projects", "uploads", projectId];
  await fs.mkdir(safeJoin(...dir), { recursive: true });
  const file = `body-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await fs.writeFile(safeJoin(...dir, file), bytes);
  const relativePath = [...dir, file].join("/");
  return { relativePath, url: `/api/files/${relativePath}` };
}

export async function deleteStorageFile(relativePath: string): Promise<void> {
  try {
    await fs.unlink(safeJoin(relativePath));
  } catch {
    // Best-effort: the DB row is the source of truth; a missing file is fine.
  }
}

export async function readStorageFile(relativePath: string): Promise<{ bytes: Buffer; ext: string } | null> {
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

// Health probe (production readiness): verifies the storage root is writable.
// Throws on failure; the health endpoint converts it to a degraded check.
export async function probeStorage(): Promise<void> {
  const name = `.health-${Date.now().toString(36)}`;
  const full = safeJoin(name);
  await fs.writeFile(full, "ok");
  await fs.unlink(full);
}
