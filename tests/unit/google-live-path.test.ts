import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleProvider } from "@/lib/ai/providers/google";
import { GoogleEmbeddingProvider } from "@/lib/embeddings/providers/google";
import { GoogleVisionProvider } from "@/lib/vision/providers/google";
import { toGeminiSchema } from "@/lib/ai/providers/gemini-schema";
import { DESIGN_SPEC_JSON_SCHEMA } from "@/lib/ai/spec-schema";
import { VISION_ESTIMATE_JSON_SCHEMA } from "@/lib/vision/estimate-schema";
import { EMBEDDING_DIMENSIONS } from "@/lib/embeddings/dimensions";
import {
  getProvider,
  resetProvider,
} from "@/lib/ai/provider";
import { getEmbeddingProvider, resetEmbeddingProvider } from "@/lib/embeddings/provider";
import { getVisionProvider, resetVisionProvider } from "@/lib/vision/provider";

// Live Google (Gemini) provider contract without spending a cent: fetch is
// stubbed, so these prove request shaping, response parsing, usage extraction,
// schema conversion, and failure propagation.
const KEY = "test-key";

function withKey() {
  process.env.GOOGLE_API_KEY = KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.AI_API_KEY;
  delete process.env.IMAGE_API_KEY;
  delete process.env.VISION_API_KEY;
  delete process.env.EMBEDDING_API_KEY;
}

const MIN_SPEC = {
  designName: "Test Concept",
  silhouette: { type: "A-line", description: "" },
  garmentComponents: [{ name: "Upper", description: "" }],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function geminiText(text: string, usage?: Record<string, number>): Response {
  return jsonResponse({
    candidates: [{ content: { parts: [{ text }] } }],
    usageMetadata: usage,
  });
}

describe("GoogleProvider (stubbed fetch)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GOOGLE_API_KEY;
  });

  it("fails loudly without a key", () => {
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.AI_API_KEY;
    expect(() => new GoogleProvider()).toThrow(/GOOGLE_API_KEY/);
  });

  it("parses a valid spec + usage and sends the Gemini request shape", async () => {
    withKey();
    const fetchSpy = vi.fn(async () =>
      geminiText(JSON.stringify(MIN_SPEC), { promptTokenCount: 100, candidatesTokenCount: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const p = new GoogleProvider();
    const result = await p.generateSpec({} as never, {} as never, { system: "s", user: "u" });
    expect(result.spec.designName).toBe("Test Concept");
    expect(result.usage).toEqual({ inputTokens: 100, outputTokens: 200 });
    expect(p.models).toEqual({ spec: "gemini-2.5-flash", image: "gemini-2.5-flash-image" });

    const [url, opts] = fetchSpy.mock.calls[0] as unknown as [string, { headers: Record<string, string>; body: string }];
    expect(url).toContain("gemini-2.5-flash:generateContent");
    expect(opts.headers["x-goog-api-key"]).toBe(KEY);
    const body = JSON.parse(opts.body);
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema.type).toBe("object");
    expect(body.systemInstruction.parts[0].text).toBe("s");
  });

  it("rejects invalid spec JSON instead of persisting garbage", async () => {
    withKey();
    vi.stubGlobal("fetch", vi.fn(async () => geminiText(JSON.stringify({ designName: "" }))));
    const p = new GoogleProvider();
    await expect(p.generateSpec({} as never, {} as never, { system: "s", user: "u" })).rejects.toThrow(
      /invalid spec JSON/,
    );
  });

  it("propagates provider errors with status (e.g. 400)", async () => {
    withKey();
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ error: { message: "API key not valid" } }), { status: 400 }),
    ));
    const p = new GoogleProvider();
    await expect(p.generateSpec({} as never, {} as never, { system: "s", user: "u" })).rejects.toThrow(
      /\(400\)/,
    );
  });

  it("decodes inline image bytes + counts the render", async () => {
    withKey();
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64");
    vi.stubGlobal("fetch", vi.fn(async () =>
      jsonResponse({
        candidates: [{ content: { parts: [{ text: "" }, { inlineData: { mimeType: "image/png", data: png } }] } }],
      }),
    ));
    const p = new GoogleProvider();
    const img = await p.generateImage("prompt", {} as never);
    expect(img.ext).toBe("png");
    expect(img.bytes).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    expect(img.usage).toEqual({ images: 1 });
  });

  it("rejects image responses with no inline data", async () => {
    withKey();
    vi.stubGlobal("fetch", vi.fn(async () =>
      jsonResponse({ candidates: [{ content: { parts: [{ text: "no image" }] } }] }),
    ));
    const p = new GoogleProvider();
    await expect(p.generateImage("prompt", {} as never)).rejects.toThrow(/no image data/);
  });
});

describe("GoogleEmbeddingProvider (stubbed fetch)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GOOGLE_API_KEY;
  });

  it("fails loudly without a key", () => {
    delete process.env.GOOGLE_API_KEY;
    delete process.env.EMBEDDING_API_KEY;
    delete process.env.AI_API_KEY;
    expect(() => new GoogleEmbeddingProvider()).toThrow(/GOOGLE_API_KEY/);
  });

  it("returns L2-normalized 1536-dim vectors and requests the right width", async () => {
    withKey();
    const fetchSpy = vi.fn(async () =>
      jsonResponse({ embeddings: [{ values: new Array(EMBEDDING_DIMENSIONS).fill(0.5) }] }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const p = new GoogleEmbeddingProvider();
    expect(p.dimensions).toBe(EMBEDDING_DIMENSIONS);
    const [vec] = await p.embed(["hello"]);
    expect(vec).toHaveLength(EMBEDDING_DIMENSIONS);
    const norm = Math.sqrt(vec.reduce((n, v) => n + v * v, 0));
    expect(norm).toBeCloseTo(1, 6);

    const [url, opts] = fetchSpy.mock.calls[0] as unknown as [string, { body: string; headers: Record<string, string> }];
    expect(url).toContain("gemini-embedding-001:batchEmbedContents");
    expect(opts.headers["x-goog-api-key"]).toBe(KEY);
    expect(JSON.parse(opts.body).requests[0].outputDimensionality).toBe(EMBEDDING_DIMENSIONS);
  });

  it("rejects a wrong-width vector rather than storing it", async () => {
    withKey();
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ embeddings: [{ values: [0.1, 0.2] }] })));
    const p = new GoogleEmbeddingProvider();
    await expect(p.embed(["hello"])).rejects.toThrow(/expected 1536/);
  });
});

describe("GoogleVisionProvider (stubbed fetch)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GOOGLE_API_KEY;
  });

  it("fails loudly without a key", () => {
    delete process.env.GOOGLE_API_KEY;
    delete process.env.VISION_API_KEY;
    delete process.env.AI_API_KEY;
    expect(() => new GoogleVisionProvider()).toThrow(/GOOGLE_API_KEY/);
  });

  it("parses + sanitizes the estimate (drops weight and out-of-range values)", async () => {
    withKey();
    vi.stubGlobal("fetch", vi.fn(async () =>
      geminiText(
        JSON.stringify({
          measurements: { heightCm: 170, weightKg: 70, waistCm: 5 },
          confidence: 0.8,
          landmarks: 12,
        }),
      ),
    ));
    const p = new GoogleVisionProvider();
    const estimate = await p.analyze(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    expect(estimate.measurements.heightCm).toBe(170);
    expect(estimate.measurements).not.toHaveProperty("weightKg");
    expect(estimate.measurements).not.toHaveProperty("waistCm");
    expect(estimate.confidence).toBe(0.8);
    expect(estimate.landmarks).toBe(12);
  });
});

describe("Gemini schema conversion", () => {
  it("strips OpenAI-only keys and adds propertyOrdering", () => {
    const g = toGeminiSchema(DESIGN_SPEC_JSON_SCHEMA);
    expect(g).not.toHaveProperty("additionalProperties");
    expect(g).not.toHaveProperty("strict");
    expect(g.type).toBe("object");
    expect(g.propertyOrdering).toEqual(Object.keys(g.properties as object));
    const silhouette = (g.properties as Record<string, Record<string, unknown>>).silhouette;
    expect(silhouette.type).toBe("object");
    expect(silhouette.propertyOrdering).toEqual(["type", "description"]);
  });

  it("converts OpenAI nullable type-arrays into Gemini nullable fields", () => {
    const g = toGeminiSchema(VISION_ESTIMATE_JSON_SCHEMA);
    const measurements = (g.properties as Record<string, Record<string, unknown>>).measurements;
    const props = measurements.properties as Record<string, Record<string, unknown>>;
    expect(props.heightCm.type).toBe("number");
    expect(props.heightCm.nullable).toBe(true);
  });
});

describe("provider factories accept google", () => {
  afterEach(() => {
    resetProvider();
    resetEmbeddingProvider();
    resetVisionProvider();
    delete process.env.GOOGLE_API_KEY;
    delete process.env.AI_PROVIDER;
    delete process.env.EMBEDDING_PROVIDER;
    delete process.env.VISION_PROVIDER;
  });

  it("selects the Google providers from env flags", () => {
    withKey();
    process.env.AI_PROVIDER = "google";
    process.env.EMBEDDING_PROVIDER = "google";
    process.env.VISION_PROVIDER = "google";
    expect(getProvider().name).toBe("google");
    expect(getEmbeddingProvider().name).toBe("google");
    expect(getVisionProvider().name).toBe("google");
  });
});
