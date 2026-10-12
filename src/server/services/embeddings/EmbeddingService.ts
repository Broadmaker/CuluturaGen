import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { culturalElements } from "@/lib/db/schema";
import { EMBEDDING_DIMENSIONS } from "@/lib/embeddings/dimensions";
import { getEmbeddingProvider } from "@/lib/embeddings/provider";
import { elementEmbedText } from "@/lib/embeddings/text";
import { isPgVectorAvailable } from "@/lib/retrieval/pgvector";

// Dense-embedding lifecycle for cultural elements (md/04 §72–74).
// Backfill is explicit and admin-gated (POST /api/admin/embeddings/backfill),
// never a hidden side effect of search: search degrades to text-only when no
// embeddings exist. All failures carry { status, code } like the other
// services (routes translate them to JSON envelopes).

export interface EmbeddingStatus {
  available: boolean;
  reason?: string;
  provider: string;
  dimensions: number;
  total: number;
  embedded: number;
}

export interface BackfillResult {
  embedded: number;
  failed: number;
  considered: number;
  provider: string;
  dimensions: number;
}

function coded(status: number, code: string, message: string): Error {
  return Object.assign(new Error(message), { status, code });
}

export class EmbeddingService {
  static async ensureAvailable(): Promise<{ available: boolean; reason?: string }> {
    if (!(await isPgVectorAvailable())) {
      return { available: false, reason: "pgvector extension is not enabled (migration 0005)" };
    }
    try {
      const col = (await db.execute(sql`
        SELECT 1 FROM "information_schema"."columns"
        WHERE "table_name" = 'cultural_elements' AND "column_name" = 'embedding'
      `)) as unknown as { rows: unknown[] };
      if ((col.rows ?? []).length === 0) {
        return { available: false, reason: "cultural_elements.embedding column is missing (migration 0005)" };
      }
    } catch {
      return { available: false, reason: "embedding column check failed" };
    }
    return { available: true };
  }

  static async status(): Promise<EmbeddingStatus> {
    const provider = getEmbeddingProvider();
    const gate = await this.ensureAvailable();
    let total = 0;
    let embedded = 0;
    if (gate.available) {
      const counts = (await db.execute(sql`
        SELECT COUNT(*)::int AS "total",
               COUNT("embedding")::int AS "embedded"
        FROM "cultural_elements"
      `)) as unknown as { rows: { total: number; embedded: number }[] };
      total = counts.rows?.[0]?.total ?? 0;
      embedded = counts.rows?.[0]?.embedded ?? 0;
    }
    return {
      available: gate.available,
      reason: gate.reason,
      provider: provider.name,
      dimensions: EMBEDDING_DIMENSIONS,
      total,
      embedded,
    };
  }

  static async backfill(opts: { limit?: number; batchSize?: number } = {}): Promise<BackfillResult> {
    const gate = await this.ensureAvailable();
    if (!gate.available) throw coded(503, "EMBEDDINGS_UNAVAILABLE", gate.reason ?? "embeddings unavailable");
    const limit = Math.min(500, Math.max(1, Math.floor(opts.limit ?? 100)));
    const batchSize = Math.min(100, Math.max(1, Math.floor(opts.batchSize ?? 20)));

    const rows = await db
      .select({
        id: culturalElements.id,
        name: culturalElements.name,
        alternativeNames: culturalElements.alternativeNames,
        category: culturalElements.category,
        description: culturalElements.description,
        symbolism: culturalElements.symbolism,
        historicalContext: culturalElements.historicalContext,
        traditionalUsage: culturalElements.traditionalUsage,
        modernUsage: culturalElements.modernUsage,
      })
      .from(culturalElements)
      // Raw predicate: the embedding column is migration-0005 raw SQL, not a
      // drizzle column (it must not exist on extension-less Postgres).
      .where(sql`"cultural_elements"."embedding" IS NULL`)
      .limit(limit);

    const provider = getEmbeddingProvider();
    let embedded = 0;
    let failed = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      let vectors: number[][];
      try {
        vectors = await provider.embed(batch.map(elementEmbedText));
      } catch {
        failed += batch.length;
        continue;
      }
      for (let j = 0; j < batch.length; j += 1) {
        const vec = vectors[j];
        if (!Array.isArray(vec) || vec.length !== EMBEDDING_DIMENSIONS) {
          failed += 1;
          continue;
        }
        try {
          await db.execute(sql`
            UPDATE "cultural_elements"
            SET "embedding" = ${`[${vec.join(",")}]`}::vector
            WHERE "id" = ${batch[j].id}
          `);
          embedded += 1;
        } catch {
          failed += 1;
        }
      }
    }
    return { embedded, failed, considered: rows.length, provider: provider.name, dimensions: EMBEDDING_DIMENSIONS };
  }
}
