import { describe, expect, it } from "vitest";
import { estimateCost } from "@/lib/ai/pricing";

// Spend estimates (md/10 §158): free-by-definition is priced $0, unknown
// models are flagged unpriced — costs are never invented. Pure, no DB.

describe("estimateCost", () => {
  it("prices mock at $0 (free, not unpriced)", () => {
    expect(estimateCost({ provider: "mock", model: "mock", inputTokens: 9999, outputTokens: 9999, images: 3 })).toEqual({
      usd: 0,
      unpriced: false,
    });
  });

  it("computes gpt-4o-mini token math", () => {
    // 1M in @ $0.15 + 1M out @ $0.60 = $0.75.
    expect(
      estimateCost({ provider: "openai", model: "gpt-4o-mini", inputTokens: 1_000_000, outputTokens: 1_000_000, images: 0 }),
    ).toEqual({ usd: 0.75, unpriced: false });
  });

  it("prices gpt-image-1 per render (documented estimate)", () => {
    expect(
      estimateCost({ provider: "openai", model: "gpt-image-1", inputTokens: 0, outputTokens: 0, images: 2 }),
    ).toEqual({ usd: 0.08, unpriced: false });
  });

  it("flags unknown models unpriced at $0 instead of guessing", () => {
    expect(
      estimateCost({ provider: "openai", model: "gpt-99-unknown", inputTokens: 100, outputTokens: 100, images: 0 }),
    ).toEqual({ usd: 0, unpriced: true });
    expect(
      estimateCost({ provider: "brand-new", model: "x", inputTokens: 0, outputTokens: 0, images: 0 }),
    ).toEqual({ usd: 0, unpriced: true });
  });

  it("clamps negative inputs to zero", () => {
    expect(
      estimateCost({ provider: "openai", model: "gpt-4o-mini", inputTokens: -5, outputTokens: -5, images: -1 }),
    ).toEqual({ usd: 0, unpriced: false });
  });
});
