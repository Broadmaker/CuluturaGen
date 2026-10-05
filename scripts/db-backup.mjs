// Production backup: database dump (pg_dump custom format) + storage tree copy.
// Run: node scripts/db-backup.mjs
// Restore DB: pg_restore -d "$DATABASE_URL" --clean backups/<file>.dump
// Env: BACKUP_DIR (default ./backups), BACKUP_KEEP (default 7 per kind),
// BACKUP_INCLUDE_STORAGE (default 1), DATABASE_URL (required).
import dotenv from "dotenv";
dotenv.config();

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const backupDir = process.env.BACKUP_DIR || path.join(root, "backups");
const keep = Math.max(1, Number(process.env.BACKUP_KEEP ?? 7) || 7);
const includeStorage = (process.env.BACKUP_INCLUDE_STORAGE ?? "1") !== "0";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
mkdirSync(backupDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const dbFile = path.join(backupDir, `db-${stamp}.dump`);

// pg_dump (libpq) rejects Prisma-style query params such as ?schema=public
// that node-postgres tolerates — strip them; a backup dumps all schemas.
function dumpUrl(raw) {
  try {
    const u = new URL(raw);
    u.searchParams.delete("schema");
    return u.toString();
  } catch {
    return raw;
  }
}

const dump = spawnSync(
  "pg_dump",
  ["--format=custom", "--compress=9", `--dbname=${dumpUrl(process.env.DATABASE_URL)}`, `--file=${dbFile}`],
  { stdio: "inherit" },
);
if (dump.error) {
  console.error(`pg_dump failed to start: ${dump.error.message}`);
  process.exit(1);
}
if (dump.status !== 0) {
  console.error(`pg_dump exited with status ${dump.status}.`);
  process.exit(1);
}
const dbSize = statSync(dbFile).size;
if (dbSize === 0) {
  console.error("pg_dump produced an empty file — treating as failure.");
  rmSync(dbFile);
  process.exit(1);
}
console.log(`database → ${path.basename(dbFile)} (${dbSize} bytes)`);

let storageNote = "skipped (BACKUP_INCLUDE_STORAGE=0)";
if (includeStorage) {
  const storageDir = process.env.STORAGE_DIR || path.join(root, "storage");
  const dest = path.join(backupDir, `storage-${stamp}`);
  if (existsSync(storageDir)) {
    cpSync(storageDir, dest, { recursive: true });
    console.log(`storage → ${path.basename(dest)}/`);
    storageNote = path.basename(dest);
  } else {
    storageNote = "storage dir missing — nothing copied";
    console.log(storageNote);
  }
}

function prune(prefix, ext) {
  const entries = readdirSync(backupDir)
    .filter((f) => f.startsWith(prefix) && (ext ? f.endsWith(ext) : !f.includes(".")))
    .map((f) => ({ f, m: statSync(path.join(backupDir, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  for (const old of entries.slice(keep)) {
    rmSync(path.join(backupDir, old.f), { recursive: true, force: true });
    console.log(`pruned ${old.f}`);
  }
}
prune("db-", ".dump");
prune("storage-", "");

console.log(`done. restore: pg_restore -d "$DATABASE_URL" --clean ${dbFile} | storage: ${storageNote}`);
