import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import * as relations from "./relations";

function connectionString(): string {
  const s = process.env.DATABASE_URL;
  if (!s) throw new Error("DATABASE_URL is not set");
  return s;
}

const globalForDb = globalThis as unknown as {
  pgPool?: Pool;
  db?: ReturnType<typeof createDb>;
};

function createDb() {
  const pool = globalForDb.pgPool ?? new Pool({ connectionString: connectionString() });
  if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool;
  return drizzle(pool, { schema: { ...schema, ...relations } });
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

export type Database = typeof db;
