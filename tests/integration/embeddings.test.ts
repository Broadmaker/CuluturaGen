// Embedding lifecycle against the real DB. Degrades gracefully: local
// Postgres has no pgvector, so ensureAvailable() is false and backfill()
// rejects with a coded 503 — both asserted. Against a pgvector database
// (Supabase) the same calls go live; see scripts/verify-embeddings.ts.
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import { EmbeddingService } from "@/server/services/embeddings/EmbeddingService";

let reachable = false;

beforeAll(async () => {
  try {
    await db.execute("select 1");
    reachable = true;
  } catch {
    reachable = false;
  }
});

describe("EmbeddingService availability gate", () => {
  it("reports availability honestly, backfills or 503s accordingly", async () => {
    if (!reachable) return;
    const status = await EmbeddingService.status();
    expect(typeof status.available).toBe("boolean");
    expect(status.dimensions).toBe(1536);
    if (!status.available) {
      expect(status.reason).toMatch(/pgvector|embedding column/);
      await expect(EmbeddingService.backfill({ limit: 1 })).rejects.toMatchObject({
        code: "EMBEDDINGS_UNAVAILABLE",
      });
    } else {
      const result = await EmbeddingService.backfill({ limit: 1 });
      expect(result.considered).toBeLessThanOrEqual(1);
      expect(result.embedded + result.failed).toBe(result.considered);
    }
  });
});
