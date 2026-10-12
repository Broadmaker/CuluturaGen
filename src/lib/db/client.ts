import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import * as relations from "./relations";
import {
  databaseUrlTlsMode,
  pgSslForMode,
  resolveAppDatabaseUrl,
  resolvePoolMax,
} from "./database-url";

const globalForDb = globalThis as unknown as {
  pgPool?: Pool;
  db?: ReturnType<typeof createDb>;
};

function createDb() {
  // Supabase Phase B (md/10 §7): sanitized URL (no ?schema=), TLS per
  // sslmode (encrypted by default on Supabase, verify-full via
  // DATABASE_SSL=strict), pooler-friendly pool size.
  const connectionString = resolveAppDatabaseUrl();
  const ssl = pgSslForMode(databaseUrlTlsMode(connectionString));
  const pool =
    globalForDb.pgPool ??
    new Pool({ connectionString, ssl, max: resolvePoolMax() });
  if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool;
  return drizzle(pool, { schema: { ...schema, ...relations } });
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

export type Database = typeof db;
