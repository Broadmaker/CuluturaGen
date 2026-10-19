import { EMBEDDING_DIMENSIONS } from "../dimensions";
import type { EmbeddingProvider } from "../provider";

// Live Google Gemini embedding provider — DORMANT until
// EMBEDDING_PROVIDER=google with GOOGLE_API_KEY set. gemini-embedding-001 is
// natively 3072-dim; we request EMBEDDING_DIMENSIONS (1536) to match the
// pgvector column and the other providers — no schema change. Per Google's
// docs only the 3072-dim output is pre-normalized, so every vector is
// L2-normalized here before it is stored. Plain fetch, no SDK.
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const BATCH_LIMIT = 100;

interface BatchResponse {
  embeddings?: { values?: unknown }[];
}

export class GoogleEmbeddingProvider implements EmbeddingProvider {
  readonly name = "google";
  readonly dimensions = EMBEDDING_DIMENSIONS;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor() {
    const key =
      process.env.EMBEDDING_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.AI_API_KEY;
    if (!key) {
      throw new Error("GOOGLE_API_KEY is not set (EMBEDDING_PROVIDER=google).");
    }
    this.apiKey = key;
    this.model = process.env.GOOGLE_EMBEDDING_MODEL || "gemini-embedding-001";
    const raw = Number(process.env.EMBEDDING_TIMEOUT_MS ?? 60_000);
    this.timeoutMs = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 60_000;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += BATCH_LIMIT) {
      const chunk = texts.slice(i, i + BATCH_LIMIT);
      out.push(...(await this.embedBatch(chunk)));
    }
    return out;
  }

  private async embedBatch(texts: string[]): Promise<number[][]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${API_BASE}/${this.model}:batchEmbedContents`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "x-goog-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: texts.map((text) => ({
            model: `models/${this.model}`,
            content: { parts: [{ text }] },
            outputDimensionality: EMBEDDING_DIMENSIONS,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.text().catch(() => "");
        throw new Error(`Google AI embeddings failed (${res.status}): ${err.slice(0, 500)}`);
      }
      const data = (await res.json()) as BatchResponse;
      const rows = data.embeddings;
      if (!Array.isArray(rows) || rows.length !== texts.length) {
        throw new Error("Google AI embeddings response had an unexpected shape.");
      }
      return rows.map((row, i) => normalize(row.values, i));
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        throw new Error(`Google AI embeddings timed out after ${this.timeoutMs} ms.`);
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }
}

function normalize(values: unknown, index: number): number[] {
  if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding ${index} has ${Array.isArray(values) ? values.length : "non-array"} dims, expected ${EMBEDDING_DIMENSIONS}.`,
    );
  }
  if (!values.every((v) => typeof v === "number" && Number.isFinite(v))) {
    throw new Error(`Embedding ${index} contains non-finite values.`);
  }
  const vec = values as number[];
  const norm = Math.sqrt(vec.reduce((n, v) => n + v * v, 0));
  return norm > 0 ? vec.map((v) => v / norm) : vec;
}
