import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAIProvider } from "@/lib/ai/providers/openai";

// Live-provider contract without spending a cent: fetch is stubbed, so these
// prove request shaping, response parsing, usage extraction, and failure
// propagation. Real spec quality / real image bytes still need a funded key.
const KEY = "test-key";

function withKey() {
  process.env.AI_API_KEY = KEY;
  delete process.env.IMAGE_API_KEY;
}

const MIN_SPEC = {
  designName: "Test Concept",
  silhouette: { type: "A-line", description: "" },
  garmentComponents: [{ name: "Upper", description: "" }],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("OpenAIProvider (stubbed fetch)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.AI_API_KEY;
  });

  it("fails loudly without a key", () => {
    delete process.env.AI_API_KEY;
    delete process.env.IMAGE_API_KEY;
    expect(() => new OpenAIProvider()).toThrow(/AI_API_KEY/);
  });

  it("parses a valid spec + usage from the Responses API shape", async () => {
    withKey();
    const fetchSpy = vi.fn(async () =>
      jsonResponse({
        output: [{ content: [{ type: "output_text", text: JSON.stringify(MIN_SPEC) }] }],
        usage: { input_tokens: 100, output_tokens: 200 },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const p = new OpenAIProvider();
    const result = await p.generateSpec({} as never, {} as never, { system: "s", user: "u" });
    expect(result.spec.designName).toBe("Test Concept");
    expect(result.usage).toEqual({ inputTokens: 100, outputTokens: 200 });
    expect(p.models).toEqual({ spec: "gpt-4o-mini", image: "gpt-image-1" });
    const [, opts] = fetchSpy.mock.calls[0] as unknown as [string, { body: string }];
    expect(JSON.parse(opts.body)).toMatchObject({ model: "gpt-4o-mini" });
  });

  it("rejects invalid spec JSON instead of persisting garbage", async () => {
    withKey();
    vi.stubGlobal("fetch", vi.fn(async () =>
      jsonResponse({ output_text: JSON.stringify({ designName: "" }) }),
    ));
    const p = new OpenAIProvider();
    await expect(p.generateSpec({} as never, {} as never, { system: "s", user: "u" })).rejects.toThrow(
      /invalid spec JSON/,
    );
  });

  it("propagates provider errors with status (e.g. unfunded 401)", async () => {
    withKey();
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ error: { message: "billing required" } }), { status: 401 }),
    ));
    const p = new OpenAIProvider();
    await expect(p.generateSpec({} as never, {} as never, { system: "s", user: "u" })).rejects.toThrow(
      /\(401\)/,
    );
  });

  it("decodes image bytes + counts the render", async () => {
    withKey();
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64");
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: [{ b64_json: png }] })));
    const p = new OpenAIProvider();
    const img = await p.generateImage("prompt", {} as never);
    expect(img.ext).toBe("png");
    expect(img.bytes).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    expect(img.usage).toEqual({ images: 1 });
  });

  it("rejects image responses with no data", async () => {
    withKey();
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: [] })));
    const p = new OpenAIProvider();
    await expect(p.generateImage("prompt", {} as never)).rejects.toThrow(/no image data/);
  });
});
