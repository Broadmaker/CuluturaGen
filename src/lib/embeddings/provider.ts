import { EMBEDDING_DIMENSIONS } from "./dimensions";
import { MockEmbeddingProvider } from "./providers/mock";
import { OpenAIEmbeddingProvider } from "./providers/openai";
import { GoogleEmbeddingProvider } from "./providers/google";

// Embedding provider abstraction for semantic cultural retrieval
// (md/04 §72–74, md/10 §142). The application only talks to this interface;
// mock vs live is an env flag — the same mock-first pattern as the AI and
// vision providers (md/10 §68–72: real core + controlled mocks).

export interface EmbeddingProvider {
  readonly name: string;
  readonly dimensions: number;
  embed(texts: string[]): Promise<number[][]>;
}

// Selected once per process from env. Mock is the safe default ($0,
// offline, deterministic). EMBEDDING_PROVIDER=openai selects live
// text-embedding-3-small ("live" accepted as an alias); no call-site
// changes — both implement this interface at EMBEDDING_DIMENSIONS width.
let cached: EmbeddingProvider | null = null;

export function getEmbeddingProvider(): EmbeddingProvider {
  if (cached) return cached;
  const which = (process.env.EMBEDDING_PROVIDER || "mock").toLowerCase();
  if (which === "openai" || which === "live") {
    cached = new OpenAIEmbeddingProvider();
  } else if (which === "google" || which === "gemini") {
    cached = new GoogleEmbeddingProvider();
  } else {
    cached = new MockEmbeddingProvider();
  }
  if (cached.dimensions !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding provider width ${cached.dimensions} != schema width ${EMBEDDING_DIMENSIONS}.`,
    );
  }
  return cached;
}

// Test-only escape hatch.
export function resetEmbeddingProvider(): void {
  cached = null;
}
