import { db } from "@/lib/db/client";

// Supabase Phase B (md/10 §7, md/04 §72–74): pgvector availability probe.
//
// Supabase Postgres ships pgvector built in; migration 0004 enables the
// extension where the binaries exist and no-ops elsewhere (local Postgres
// without the extension keeps the native tsvector path). Dense-embedding
// columns stay a future additive upgrade — hybridSearch() already fuses an
// optional per-hit vector score, so this flag is the only gate new code
// needs to consult.
export async function isPgVectorAvailable(): Promise<boolean> {
  try {
    const res = (await db.execute(
      `SELECT EXISTS (SELECT 1 FROM "pg_extension" WHERE "extname" = 'vector') AS "on"`,
    )) as unknown as { rows: { on: boolean }[] };
    return res.rows?.[0]?.on === true;
  } catch {
    return false;
  }
}
