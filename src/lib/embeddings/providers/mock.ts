import { createHash } from "node:crypto";
import { EMBEDDING_DIMENSIONS } from "../dimensions";
import type { EmbeddingProvider } from "../provider";

// Deterministic offline embedding provider ($0, no network). Derives a
// unit-norm pseudo-vector from a hash of the input text: the same text
// always yields the same vector, so the full pipeline (backfill → vector
// search → fused ranking with `via: ["vector"]` evidence) is genuinely
// exercised. Semantic quality is nil by construction — mock vectors encode
// hash similarity, not meaning — so mock-backed rankings must never be
// presented as semantic evidence. Flip to the live provider for that.

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mockEmbedOne(text: string): number[] {
  const digest = createHash("sha256").update(text, "utf8").digest();
  const rand = mulberry32(digest.readUInt32BE(0) ^ digest.readUInt32BE(4));
  const vec = Array.from({ length: EMBEDDING_DIMENSIONS }, () => rand() * 2 - 1);
  const norm = Math.sqrt(vec.reduce((n, v) => n + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly name = "mock";
  readonly dimensions = EMBEDDING_DIMENSIONS;

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((t) => mockEmbedOne(t));
  }
}
