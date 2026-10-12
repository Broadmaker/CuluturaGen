// Supabase Phase B verifier — run AFTER creating the Supabase project.
// Checks the DIRECT/prod DB end to end WITHOUT writing app data:
// connection + TLS + migrations applied + pgvector + full-text trigger.
// Storage (s3) is verified via GET /api/health once the app boots with
// STORAGE_BACKEND=s3 (see steps printed at the end).
//
// Usage (bash / Git Bash — keeps secrets out of chat and out of git):
//   export DIRECT_URL="postgresql://postgres:PWD@db.REF.supabase.co:5432/postgres"
//   export DATABASE_URL="postgresql://postgres.REF:PWD@aws-0-REGION.pooler.supabase.com:6543/postgres"
//   node scripts/verify-supabase.mjs
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

function sanitize(raw) {
  try {
    const u = new URL(raw);
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
    const h = u.hostname.toLowerCase();
    if (h === "supabase.co" || h.endsWith(".supabase.co")) return "require";
    if (h === "supabase.com" || h.endsWith(".supabase.com")) return "require";
    if (flag === "1" || flag === "require") return "require";
    return "off";
  } catch {
    return flag === "1" || flag === "require" ? "require" : "off";
  }
}

function mask(raw) {
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.hostname}:${u.port || "5432"}${u.pathname}`;
  } catch {
    return "(unparseable)";
  }
}

const directRaw = process.env.DIRECT_URL?.trim();
const poolerRaw = process.env.DATABASE_URL?.trim();
if (!directRaw) {
  console.error("DIRECT_URL is not set — copy the Direct connection string (port 5432).");
  process.exit(1);
}

console.log(`direct : ${mask(directRaw)}`);
if (poolerRaw) console.log(`pooler : ${mask(poolerRaw)}`);
const mode = tlsMode(directRaw);
console.log(`tls    : ${mode}${mode === "require" ? " (encrypted, CA not verified — strict via DATABASE_SSL=strict)" : ""}`);

const client = new Client({
  connectionString: sanitize(directRaw),
  ssl:
    mode === "off"
      ? undefined
      : mode === "verify-full"
        ? { rejectUnauthorized: true }
        : { rejectUnauthorized: false },
});

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
};

try {
  await client.connect();
  check("connect (direct, TLS)", true);

  const tables = await client.query(
    `SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
  );
  const n = tables.rows[0]?.n ?? 0;
  check("tables present", n >= 35, `${n} tables (expect >= 35)`);

  const vec = await client.query(
    `SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS on,
            EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') AS avail`,
  );
  check("pgvector installed", vec.rows[0]?.on === true, vec.rows[0]?.on ? "enabled" : "extension missing — re-run migrate-prod.mjs (0004)");
  if (vec.rows[0]?.on !== true && vec.rows[0]?.avail === true) {
    console.log("      hint: binaries exist but extension not enabled — migrate-prod.mjs applies 0004");
  }

  const trig = await client.query(
    `SELECT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'cultural_elements_search_trigger') AS on`,
  );
  check("full-text trigger (0003)", trig.rows[0]?.on === true);

  try {
    const mig = await client.query(`SELECT tag FROM __prod_migrations ORDER BY tag`);
    const tags = mig.rows.map((r) => r.tag);
    check("prod migration tracking", tags.length >= 5, `${tags.length} tracked (${tags[tags.length - 1] ?? "none"})`);
  } catch {
    const kit = await client.query(
      `SELECT COUNT(*)::int AS n FROM drizzle.__drizzle_migrations`,
    ).catch(() => ({ rows: [{ n: 0 }] }));
    check("prod migration tracking", false, `no __prod_migrations table (drizzle-kit history: ${kit.rows[0]?.n ?? 0}) — run migrate-prod.mjs`);
  }
} catch (e) {
  check("connect (direct, TLS)", false, e.message);
} finally {
  try { await client.end(); } catch { /* ignore */ }
}

console.log("");
if (failures > 0) {
  console.log(`${failures} check(s) failed — fix above, then re-run.`);
  process.exit(1);
}
console.log("DB checks green. Next:");
console.log("  1. node scripts/migrate-prod.mjs  (if anything above was missing)");
console.log('  2. DATABASE_URL="<pooler>" pnpm run db:seed  (roles + admin login, idempotent)');
console.log("  3. Boot with STORAGE_BACKEND=s3 + S3 vars, open /api/health");
console.log('     expect database.ok:true pgvector:true, storage.backend:"s3"');
