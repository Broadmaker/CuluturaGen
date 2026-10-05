import { describe, expect, it } from "vitest";
import { rateLimitDefaults } from "@/lib/rate-limit";
import { MockVisionProvider } from "@/lib/vision/providers/mock";
import { maxBodyImageBytes, validateBodyImage } from "@/lib/vision/validate";

// md/01 §15, md/09 §30–32: vision estimates are labeled, validated, bounded.
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const JPG_MINIMAL = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]);

describe("body image validation", () => {
  it("accepts PNG/JPEG by magic bytes, not extension", () => {
    expect(validateBodyImage(PNG_1X1, "image/png").ok).toBe(true);
    const jpg = validateBodyImage(JPG_MINIMAL, "image/jpeg");
    expect(jpg.ok).toBe(true);
    if (jpg.ok) expect(jpg.ext).toBe("jpg");
  });

  it("rejects disallowed MIME types", () => {
    const r = validateBodyImage(PNG_1X1, "image/gif");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("INVALID_TYPE");
  });

  it("rejects content that is not an image despite a valid MIME claim", () => {
    const r = validateBodyImage(Buffer.from("not an image at all"), "image/png");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("INVALID_SIGNATURE");
  });

  it("rejects empty and oversized uploads", () => {
    const empty = validateBodyImage(Buffer.alloc(0), "image/png");
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.error.code).toBe("FILE_EMPTY");

    const big = validateBodyImage(PNG_1X1, "image/png", 10);
    expect(big.ok).toBe(false);
    if (!big.ok) expect(big.error.code).toBe("FILE_TOO_LARGE");
  });

  it("has a sane configured size cap", () => {
    expect(maxBodyImageBytes()).toBeGreaterThan(1024);
  });
});

describe("mock vision provider", () => {
  it("is deterministic per image", async () => {
    const p = new MockVisionProvider();
    const a = await p.analyze(PNG_1X1);
    const b = await p.analyze(PNG_1X1);
    expect(a).toEqual(b);
  });

  it("returns plausible in-range estimates, never weight", async () => {
    const p = new MockVisionProvider();
    const { measurements, confidence, landmarks } = await p.analyze(PNG_1X1);
    expect(measurements.weightKg).toBeUndefined();
    for (const v of Object.values(measurements)) {
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThanOrEqual(200);
    }
    expect(measurements.heightCm).toBeGreaterThanOrEqual(150);
    expect(measurements.heightCm).toBeLessThanOrEqual(188);
    expect(confidence).toBe(0.62);
    expect(landmarks).toBe(17);
  });
});

describe("vision rate limit", () => {
  it("exposes an env-configurable hourly vision budget", () => {
    const v = rateLimitDefaults().visionAnalyzePerHour;
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeGreaterThan(0);
  });
});
