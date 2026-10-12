// Dense-embeddings verifier (md/04 §72–74) — run with tsx:
//   DATABASE_URL="<pooler :6543>" pnpm exec tsx scripts/verify-embeddings.ts [query]
//
// Checks migration-0005 status, backfills missing vectors with the
// configured provider (mock default, $0), then runs one hybrid query and
// prints ranked hits with their `via` evidence (look for "vector").
// Read-only except the backfill it exists to exercise.
import "dotenv/config";
import { db } from "../src/lib/db/client";
import { hybridSearch } from "../src/lib/retrieval/hybrid";
import { EmbeddingService } from "../src/server/services/embeddings/EmbeddingService";

async function main() {
  const status = await EmbeddingService.status();
  console.log(
    `embeddings: available=${status.available} provider=${status.provider} ` +
      `embedded=${status.embedded}/${status.total}${status.reason ? ` (${status.reason})` : ""}`,
  );
  if (!status.available) {
    console.error("Embedding store unavailable — run migrate-prod.mjs (0005) first.");
    process.exit(1);
  }
  if (status.embedded < status.total) {
    const result = await EmbeddingService.backfill({ limit: 500 });
    console.log(
      `backfill: embedded=${result.embedded} failed=${result.failed} considered=${result.considered}`,
    );
  } else {
    console.log("backfill: skipped (all rows embedded)");
  }
  const q = process.argv[2] ?? "ceremonial textile";
  const hits = await hybridSearch(q, {}, 5);
  console.log(`query: ${JSON.stringify(q)}`);
  for (const h of hits) {
    console.log(
      `  - ${h.element.name} [${h.element.validationStatus}] score=${h.score.toFixed(3)} via=${h.via.join("+")}`,
    );
  }
  await db.$client.end().catch(() => {});
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
