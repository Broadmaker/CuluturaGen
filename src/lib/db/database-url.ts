// Supabase Phase B connection-string handling (md/10 §7).
//
// Shared by the app pool (db/client.ts), migrate-prod.mjs, and db-backup.mjs
// so all three agree on one URL policy:
//
// - Prisma-style `?schema=public` is stripped: node-postgres tolerates it,
//   but libpq tools (pg_dump / pg_restore / pg_isready) reject unknown
//   query params, and Supabase pooler URLs must stay clean.
// - Supabase mandates TLS. Any host under *.supabase.co (direct db.* or
//   pooler *.pooler.supabase.com) forces ssl; otherwise DATABASE_SSL=1 or
//   ?sslmode=require opts in (local docker / localhost stay plaintext).
// - Migrations must run on the DIRECT (session-mode, port 5432) URL. The
//   Supabase pooler (port 6543, transaction mode via PgBouncer) breaks DDL
//   with prepared statements, so DIRECT_URL — when set — wins for migrate.

export interface MigrationUrl {
  url: string;
  /** Which variable supplied the URL (for log lines, never the value). */
  source: "DIRECT_URL" | "DATABASE_URL";
}

// Pure: drop only the `schema` query param, keep everything else byte-equal.
export function sanitizeDatabaseUrl(raw: string): string {
  try {
    const u = new URL(raw);
    if (!u.searchParams.has("schema")) return raw;
    u.searchParams.delete("schema");
    return u.toString();
  } catch {
    return raw;
  }
}

// TLS policy, mirroring libpq `sslmode` semantics (md/10 §7):
// - `?sslmode=require` (or `prefer`): TLS-encrypt, no CA verification.
//   This is the Supabase pooler default — Supavisor's chain plus
//   TLS-inspecting middleboxes (common on managed/ISP networks) break
//   strict verification, while password auth still gates access.
// - `?sslmode=verify-full` / `verify-ca` (or DATABASE_SSL=strict): full CA
//   verification via `rejectUnauthorized: true`.
// - No param: Supabase hosts default to `require` (encrypted); DATABASE_SSL=1
//   forces `require` elsewhere; otherwise plaintext (local docker/loopback).
export type TlsMode = "off" | "require" | "verify-full";

export function databaseUrlTlsMode(
  rawUrl: string,
  env: Record<string, string | undefined> = process.env,
): TlsMode {
  const flag = (env.DATABASE_SSL ?? "").trim().toLowerCase();
  if (flag === "strict" || flag === "verify-full" || flag === "verify-ca") return "verify-full";
  try {
    const u = new URL(rawUrl);
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

// Back-compat: does this connection require TLS at all?
export function databaseUrlRequiresSSL(
  rawUrl: string,
  env: Record<string, string | undefined> = process.env,
): boolean {
  return databaseUrlTlsMode(rawUrl, env) !== "off";
}

// pg `ssl` option for a TLS mode: `true` would verify with defaults; we pass
// explicit objects so the posture is visible at the call site.
export function pgSslForMode(mode: TlsMode): { rejectUnauthorized: boolean } | undefined {
  if (mode === "off") return undefined;
  if (mode === "verify-full") return { rejectUnauthorized: true };
  return { rejectUnauthorized: false };
}

// Runtime URL for the app pool: DATABASE_URL, sanitized. Throws naming the
// variable (never the value) so a misconfigured deploy fails loudly.
export function resolveAppDatabaseUrl(env: Record<string, string | undefined> = process.env): string {
  const raw = env.DATABASE_URL?.trim();
  if (!raw) throw new Error("DATABASE_URL is not set");
  return sanitizeDatabaseUrl(raw);
}

// Migration URL: DIRECT_URL wins (Supabase session-mode direct connection),
// otherwise DATABASE_URL. Both sanitized.
export function resolveMigrationDatabaseUrl(
  env: Record<string, string | undefined> = process.env,
): MigrationUrl {
  const direct = env.DIRECT_URL?.trim();
  if (direct) return { url: sanitizeDatabaseUrl(direct), source: "DIRECT_URL" };
  const fallback = env.DATABASE_URL?.trim();
  if (!fallback) throw new Error("Neither DIRECT_URL nor DATABASE_URL is set");
  return { url: sanitizeDatabaseUrl(fallback), source: "DATABASE_URL" };
}

// Pool size: Supabase free-tier poolers cap connections, so this stays
// env-configurable (md/10 §155). Defaults to 10, clamped to 1–50.
export function resolvePoolMax(env: Record<string, string | undefined> = process.env): number {
  const raw = Number(env.DATABASE_POOL_MAX ?? 10);
  if (!Number.isFinite(raw)) return 10;
  return Math.min(50, Math.max(1, Math.floor(raw)));
}
