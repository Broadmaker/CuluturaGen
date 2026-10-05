// Production migration runner (no drizzle-kit needed in the image).
// Applies drizzle/*.sql in journal order, splitting drizzle-kit
// statement-breakpoints. Safe to re-run: migrations are additive and the
// trigger/index statements are CREATE IF NOT EXISTS / idempotent DDL.
// Env: DATABASE_URL (required).
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

const root = process.cwd();
const journalPath = path.join(root, "drizzle", "meta", "_journal.json");
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const journal = JSON.parse(readFileSync(journalPath, "utf8"));

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(
    `CREATE TABLE IF NOT EXISTS "__prod_migrations" ("tag" text PRIMARY KEY, "applied_at" timestamptz DEFAULT now())`,
  );
  const applied = new Set(
    (await client.query(`SELECT "tag" FROM "__prod_migrations"`)).rows.map((r) => r.tag),
  );
  // Adopt drizzle-kit's own history: it tracks hashes in
  // drizzle.__drizzle_migrations, not tags. Both lists are chronological, so a
  // DB migrated by drizzle-kit skips that many leading journal entries.
  // (Fresh prod databases have neither table and apply everything in order.)
  let kitApplied = 0;
  try {
    kitApplied =
      (await client.query(`SELECT COUNT(*)::int AS n FROM drizzle.__drizzle_migrations`)).rows[0].n ?? 0;
  } catch {
    kitApplied = 0;
  }
  const tags = journal.entries.map((e) => e.tag).slice(kitApplied);
  if (kitApplied > 0) console.log(`adopted ${kitApplied} drizzle-kit migration(s)`);
  for (const tag of tags) {
    if (applied.has(tag)) {
      console.log(`skip ${tag} (already applied)`);
      continue;
    }
    const file = path.join(root, "drizzle", `${tag}.sql`);
    if (!existsSync(file)) {
      console.log(`skip ${tag} (no sql file)`);
      continue;
    }
    const statements = readFileSync(file, "utf8")
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      await client.query(stmt);
    }
    await client.query(`INSERT INTO "__prod_migrations" ("tag") VALUES ($1)`, [tag]);
    console.log(`applied ${tag} (${statements.length} statements)`);
  }
  console.log("migrations complete");
} finally {
  await client.end();
}
