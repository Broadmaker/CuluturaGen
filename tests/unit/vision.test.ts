import { describe, expect, it, afterEach } from "vitest";
import { rateLimitDefaults } from "@/lib/rate-limit";
import { MockVisionProvider } from "@/lib/vision/providers/mock";
import { OpenAIVisionProvider } from "@/lib/vision/providers/openai";
import {
  getVisionProvider,
  resetVisionProvider,
} from "@/lib/vision/provider";
import {
  parseVisionOutput,
  sanitizeVisionMeasurements,
} from "@/lib/vision/estimate-schema";
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

describe("sanitizeVisionMeasurements", () => {
  it("keeps in-range values (rounded) and drops the rest by name", () => {
    const { measurements, dropped } = sanitizeVisionMeasurements({
      heightCm: 170.44,
      chestCm: 500,
      weightKg: 60,
      notaField: 1,
      waistCm: "wide",
      hipCm: null,
    });
    expect(measurements.heightCm).toBe(170.4);
    expect(measurements.chestCm).toBeUndefined();
    expect(measurements.weightKg).toBeUndefined();
    expect(dropped).toContain("chestCm");
    expect(dropped).toContain("weightKg");
    expect(dropped).toContain("notaField");
    expect(dropped).toContain("waistCm");
    // Null = "could not estimate", not a drop.
    expect(dropped).not.toContain("hipCm");
  });
});

describe("parseVisionOutput", () => {
  it("accepts a valid payload and clamps markers", () => {
    const out = parseVisionOutput({
      measurements: { heightCm: 170, waistCm: 80 },
      confidence: 2,
      landmarks: 17.9,
    });
    expect(out.measurements.heightCm).toBe(170);
    expect(out.confidence).toBe(1);
    expect(out.landmarks).toBe(17);
  });

  it("rejects a wrong-shaped payload", () => {
    expect(() => parseVisionOutput({ nope: true })).toThrow();
  });
});

describe("live vision provider wiring", () => {
  const saved: Record<string, string | undefined> = {};
  for (const k of [
    "VISION_PROVIDER",
    "VISION_API_KEY",
    "AI_API_KEY",
    "VISION_MODEL",
  ]) {
    saved[k] = process.env[k];
  }
  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    resetVisionProvider();
    // @ts-expect-error restore fetch stub
    if (globalThis.__stubbedFetch) delete globalThis.__stubbedFetch;
  });

  it("defaults to mock", () => {
    delete process.env.VISION_PROVIDER;
    expect(getVisionProvider().name).toBe("mock");
  });

  it("throws loudly for openai without a key", () => {
    process.env.VISION_PROVIDER = "openai";
    delete process.env.VISION_API_KEY;
    delete process.env.AI_API_KEY;
    expect(() => getVisionProvider()).toThrow(/VISION_API_KEY/);
  });

  it("analyzes via the Responses API and sanitizes the result", async () => {
    process.env.VISION_API_KEY = "test-key";
    const provider = new OpenAIVisionProvider();
    const realFetch = globalThis.fetch;
    // @ts-expect-error mark stubbed
    globalThis.__stubbedFetch = true;
    globalThis.fetch = (async () => ({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          measurements: { heightCm: 172.25, chestCm: 9999 },
          confidence: 0.8,
          landmarks: 33,
        }),
      }),
    })) as unknown as typeof fetch;
    try {
      const out = await provider.analyze(PNG_1X1);
      expect(out.measurements.heightCm).toBe(172.3);
      expect(out.measurements.chestCm).toBeUndefined();
      expect(out.confidence).toBe(0.8);
      expect(out.landmarks).toBe(33);
    } finally {
      globalThis.fetch = realFetch;
    }
  });

  it("surfaces provider HTTP failures with status", async () => {
    process.env.VISION_API_KEY = "test-key";
    const provider = new OpenAIVisionProvider();
    const realFetch = globalThis.fetch;
    // @ts-expect-error mark stubbed
    globalThis.__stubbedFetch = true;
    globalThis.fetch = (async () => ({
      ok: false,
      status: 401,
      text: async () => "bad key",
    })) as unknown as typeof fetch;
    try {
      await expect(provider.analyze(PNG_1X1)).rejects.toThrow(/401/);
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
