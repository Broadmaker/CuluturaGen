import { createHash } from "node:crypto";

// Upload validation for body reference images (md/09 §80, md/02 §33).
// Pure function so it can be unit-tested without a server or database.
// Magic bytes are sniffed — the client-supplied MIME type alone is not trusted.

export const BODY_IMAGE_MIME_ALLOWLIST = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type BodyImageValidationError = {
  code:
    | "FILE_EMPTY"
    | "FILE_TOO_LARGE"
    | "INVALID_TYPE"
    | "INVALID_SIGNATURE";
  message: string;
};

export type BodyImageValidationResult =
  | { ok: true; ext: "jpg" | "png" | "webp"; mime: string }
  | { ok: false; error: BodyImageValidationError };

function sniffed(bytes: Buffer): "jpg" | "png" | "webp" | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "jpg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export function maxBodyImageBytes(): number {
  const raw = Number(process.env.BODY_IMAGE_MAX_BYTES ?? 8 * 1024 * 1024);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 8 * 1024 * 1024;
}

export function validateBodyImage(
  bytes: Buffer,
  declaredMime: string | null,
  maxBytes: number = maxBodyImageBytes(),
): BodyImageValidationResult {
  if (!bytes || bytes.length === 0) {
    return {
      ok: false,
      error: { code: "FILE_EMPTY", message: "No image data was received." },
    };
  }
  if (bytes.length > maxBytes) {
    return {
      ok: false,
      error: {
        code: "FILE_TOO_LARGE",
        message: `Image exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB limit.`,
      },
    };
  }
  if (
    declaredMime &&
    !(BODY_IMAGE_MIME_ALLOWLIST as readonly string[]).includes(declaredMime)
  ) {
    return {
      ok: false,
      error: {
        code: "INVALID_TYPE",
        message: "Only JPEG, PNG, or WebP reference photos are accepted.",
      },
    };
  }
  const ext = sniffed(bytes);
  if (!ext) {
    return {
      ok: false,
      error: {
        code: "INVALID_SIGNATURE",
        message: "File content is not a recognized JPEG, PNG, or WebP image.",
      },
    };
  }
  const mime =
    ext === "jpg" ? "image/jpeg" : ext === "png" ? "image/png" : "image/webp";
  return { ok: true, ext, mime };
}

export function sha256Hex(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}
