import { describe, expect, it } from "vitest";
import { EMBEDDING_DIMENSIONS } from "@/lib/embeddings/dimensions";
import {
  getEmbeddingProvider,
  resetEmbeddingProvider,
} from "@/lib/embeddings/provider";
import { MockEmbeddingProvider, mockEmbedOne } from "@/lib/embeddings/providers/mock";
import { OpenAIEmbeddingProvider } from "@/lib/embeddings/providers/openai";
import { elementEmbedText } from "@/lib/embeddings/text";

// Dense retrieval inputs (md/04 §72–74): text composition is pure,
// mock vectors are deterministic unit-norm at schema width, live provider
// fails loudly without a key. No network in these tests.

describe("elementEmbedText", () => {
  it("leads with name, then alternatives/category, then notes", () => {
    const text = elementEmbedText({
      name: "  Barong  ",
      alternativeNames: ["Barong Tagalog", "  "],
      category: "GARMENT",
      description: "Embroidered formal shirt.",
      symbolism: null,
      historicalContext: undefined,
      traditionalUsage: "Weddings.",
      modernUsage: "",
    });
    expect(text).toBe(
      ["Barong", "Also known as: Barong Tagalog", "Category: GARMENT", "Embroidered formal shirt.", "Weddings."].join("\n"),
    );
  });

  it("never yields an empty string for a bare name", () => {
    expect(elementEmbedText({ name: "X", category: "" }).trim().length).toBeGreaterThan(0);
  });
});

describe("mockEmbedOne", () => {
  it("is deterministic, schema-width, and unit-norm", () => {
    const a = mockEmbedOne("woven textile");
    const b = mockEmbedOne("woven textile");
    expect(a).toEqual(b);
    expect(a).toHaveLength(EMBEDDING_DIMENSIONS);
    const norm = Math.sqrt(a.reduce((n, v) => n + v * v, 0));
    expect(norm).toBeCloseTo(1, 6);
  });

  it("separates different texts", () => {
    const a = mockEmbedOne("woven textile");
    const b = mockEmbedOne("brass jewelry");
    const dot = a.reduce((n, v, i) => n + v * b[i], 0);
    expect(Math.abs(dot)).toBeLessThan(0.5);
  });
});

describe("MockEmbeddingProvider", () => {
  it("batches in order at schema width", async () => {
    const p = new MockEmbeddingProvider();
    expect(p.name).toBe("mock");
    expect(p.dimensions).toBe(EMBEDDING_DIMENSIONS);
    const [a, b] = await p.embed(["one", "two"]);
    expect(a).toEqual(mockEmbedOne("one"));
    expect(b).toEqual(mockEmbedOne("two"));
  });
});

describe("getEmbeddingProvider", () => {
  it("defaults to mock", () => {
    delete process.env.EMBEDDING_PROVIDER;
    resetEmbeddingProvider();
    expect(getEmbeddingProvider().name).toBe("mock");
    resetEmbeddingProvider();
  });

  it("selects openai (or live alias) when asked", () => {
    process.env.EMBEDDING_PROVIDER = "live";
    process.env.EMBEDDING_API_KEY = "test-key";
    resetEmbeddingProvider();
    const p = getEmbeddingProvider();
    expect(p.name).toBe("openai");
    expect(p.dimensions).toBe(EMBEDDING_DIMENSIONS);
    delete process.env.EMBEDDING_PROVIDER;
    delete process.env.EMBEDDING_API_KEY;
    resetEmbeddingProvider();
  });
});

describe("OpenAIEmbeddingProvider", () => {
  it("fails loudly without a key", () => {
    delete process.env.EMBEDDING_API_KEY;
    delete process.env.AI_API_KEY;
    resetEmbeddingProvider();
    expect(() => new OpenAIEmbeddingProvider()).toThrow(/EMBEDDING_API_KEY/);
  });

  it("falls back to AI_API_KEY", () => {
    delete process.env.EMBEDDING_API_KEY;
    process.env.AI_API_KEY = "fallback-key";
    expect(() => new OpenAIEmbeddingProvider()).not.toThrow();
    delete process.env.AI_API_KEY;
  });
});
