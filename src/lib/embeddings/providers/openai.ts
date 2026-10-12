import { EMBEDDING_DIMENSIONS } from "../dimensions";
import type { EmbeddingProvider } from "../provider";

// Live OpenAI embedding provider — DORMANT until EMBEDDING_PROVIDER=openai
// with a key set. text-embedding-3-small (1536 dims, ~$0.02/1M tokens: the
// whole 22-element seed library costs a fraction of a cent) via the plain
// embeddings endpoint. Plain fetch, no SDK. Fails loudly without a key;
// dimension mismatch fails loudly rather than silently truncating.
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly name = "openai";
  readonly dimensions = EMBEDDING_DIMENSIONS;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor() {
    const key = process.env.EMBEDDING_API_KEY || process.env.AI_API_KEY;
    if (!key) {
      throw new Error(
        "EMBEDDING_API_KEY (or AI_API_KEY) is not set (EMBEDDING_PROVIDER=openai).",
      );
    }
    this.apiKey = key;
    this.model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
    const raw = Number(process.env.EMBEDDING_TIMEOUT_MS ?? 60_000);
    this.timeoutMs = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 60_000;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: this.model, input: texts }),
      });
      if (!res.ok) {
        const err = await res.text().catch(() => "");
        throw new Error(
          `OpenAI embeddings failed (${res.status}): ${err.slice(0, 500)}`,
        );
      }
      const data = (await res.json()) as {
        data?: Array<{ embedding?: unknown; index?: number }>;
      };
      const rows = data.data;
      if (!Array.isArray(rows) || rows.length !== texts.length) {
        throw new Error("OpenAI embeddings response had an unexpected shape.");
      }
      return rows.map((row, i) => {
        if (!Array.isArray(row.embedding) || row.embedding.length !== EMBEDDING_DIMENSIONS) {
          throw new Error(
            `Embedding ${i} has ${Array.isArray(row.embedding) ? row.embedding.length : "non-array"} dims, expected ${EMBEDDING_DIMENSIONS}.`,
          );
        }
        if (!row.embedding.every((v) => typeof v === "number" && Number.isFinite(v))) {
          throw new Error(`Embedding ${i} contains non-finite values.`);
        }
        return row.embedding as number[];
      });
    } finally {
      clearTimeout(timer);
    }
  }
}
