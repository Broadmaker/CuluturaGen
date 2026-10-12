// Production migration runner (no drizzle-kit needed in the image).
// Applies drizzle/*.sql in journal order, splitting drizzle-kit
// statement-breakpoints. Safe to re-run: migrations are additive and the
// trigger/index statements are CREATE IF NOT EXISTS / idempotent DDL.
// Supabase Phase B (md/10 §7):
// - URL: DIRECT_URL wins (session-mode direct connection, port 5432).
//   Migrations must NOT run on the transaction-mode pooler (port 6543) —
//   DDL via prepared statements fails under PgBouncer transaction pooling.
// - Prisma-style ?schema= is stripped (libpq rejects unknown params).
// - TLS is forced for *.supabase.co (public CA verifies cleanly).
// Env: DATABASE_URL (required), DIRECT_URL (preferred on Supabase),
// DATABASE_SSL=1 to force TLS elsewhere.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

function sanitizeDatabaseUrl(raw) {
  try {
    const u = new URL(raw);
    if (!u.searchParams.has("schema")) return raw;
    u.searchParams.delete("schema");
    return u.toString();
  } catch {
    return raw;
  }
}

function tlsMode(raw) {
  const flag = (process.env.DATABASE_SSL ?? "").trim().toLowerCase();
  if (flag === "strict" || flag === "verify-full" || flag === "verify-ca") return "verify-full";
  try {
    const u = new URL(raw);
    const sslmode = (u.searchParams.get("sslmode") ?? "").toLowerCase();
    if (sslmode === "verify-full" || sslmode === "verify-ca") return "verify-full";
    if (sslmode === "require" || sslmode === "prefer" || sslmode === "allow") return "require";
    const host = u.hostname.toLowerCase();
    if (host === "supabase.co" || host.endsWith(".supabase.co")) return "require";
    if (host === "supabase.com" || host.endsWith(".supabase.com")) return "require";
    if (flag === "1" || flag === "require") return "require";
    return "off";
  } catch {
    return flag === "1" || flag === "require" ? "require" : "off";
  }
}

const root = process.cwd();
const journalPath = path.join(root, "drizzle", "meta", "_journal.json");

const directRaw = process.env.DIRECT_URL?.trim();
const fallbackRaw = process.env.DATABASE_URL?.trim();
if (!directRaw && !fallbackRaw) {
  console.error("Neither DIRECT_URL nor DATABASE_URL is set.");
  process.exit(1);
}
const source = directRaw ? "DIRECT_URL" : "DATABASE_URL";
if (directRaw) {
  console.log("migrating via DIRECT_URL (direct or session-mode pooler :5432)");
} else {
  console.log(
    "migrating via DATABASE_URL (Supabase: use DIRECT_URL — direct :5432, session pooler :5432, or IPv6 network. Transaction pooler :6543 breaks DDL)",
  );
}
const connectionString = sanitizeDatabaseUrl(directRaw || fallbackRaw);
const mode = tlsMode(connectionString);
const ssl =
  mode === "off"
    ? undefined
    : mode === "verify-full"
      ? { rejectUnauthorized: true }
      : { rejectUnauthorized: false };
console.log(`tls    : ${mode}`);
void source;

const journal = JSON.parse(readFileSync(journalPath, "utf8"));

const client = new Client({ connectionString, ssl });
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
  // Phase B report: pgvector is built into Supabase Postgres; the 0004
  // migration enables it where the binaries exist and no-ops elsewhere.
  try {
    const ext = await client.query(
      `SELECT EXISTS (SELECT 1 FROM "pg_extension" WHERE "extname" = 'vector') AS "on"`,
    );
    console.log(ext.rows[0]?.on ? "pgvector: enabled" : "pgvector: not installed (native tsvector retrieval stays active)");
  } catch {
    console.log("pgvector: check skipped (query failed)");
  }
  console.log("migrations complete");
} finally {
  await client.end();
}
