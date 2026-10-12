// Production backup: database dump (pg_dump custom format) + storage backup.
// - Local backend: full storage tree copy (existing behavior).
// - s3 backend (Supabase): object manifest JSON (keys/sizes/etags); bytes
//   stay in the versioned bucket — restore via Supabase point-in-time.
// Run: node scripts/db-backup.mjs
// Restore DB: pg_restore -d "$DIRECT_URL" --clean backups/<file>.dump
// Env: BACKUP_DIR (default ./backups), BACKUP_KEEP (default 7 per kind),
// BACKUP_INCLUDE_STORAGE (default 1), DIRECT_URL (preferred for pg_dump;
// falls back to DATABASE_URL), STORAGE_* (for s3 manifests).
import dotenv from "dotenv";
dotenv.config();

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { listS3Manifest, createS3ClientFromEnv, resolveDumpUrl, storageBackend } from "./backup-lib.mjs";

const root = process.cwd();
const backupDir = process.env.BACKUP_DIR || path.join(root, "backups");
const keep = Math.max(1, Number(process.env.BACKUP_KEEP ?? 7) || 7);
const includeStorage = (process.env.BACKUP_INCLUDE_STORAGE ?? "1") !== "0";

if (!process.env.DIRECT_URL && !process.env.DATABASE_URL) {
  console.error("Neither DIRECT_URL nor DATABASE_URL is set.");
  process.exit(1);
}
mkdirSync(backupDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const dbFile = path.join(backupDir, `db-${stamp}.dump`);

// pg_dump needs session-mode: DIRECT_URL (direct :5432 / session pooler)
// wins; the transaction pooler breaks it under PgBouncer.
const { url: dumpConn, source: dumpSource } = resolveDumpUrl();
console.log(`dumping via ${dumpSource}`);

const dump = spawnSync(
  "pg_dump",
  ["--format=custom", "--compress=9", `--dbname=${dumpConn}`, `--file=${dbFile}`],
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
  const backend = storageBackend();
  if (backend === "s3") {
    // Bytes stay in the versioned bucket; the manifest records what existed.
    const { client, bucket } = createS3ClientFromEnv();
    const entries = await listS3Manifest(client, bucket);
    const manifestFile = path.join(backupDir, `s3-manifest-${stamp}.json`);
    writeFileSync(
      manifestFile,
      JSON.stringify(
        { backend: "s3", bucket, at: new Date().toISOString(), objects: entries },
        null,
        2,
      ),
    );
    const bytes = entries.reduce((n, e) => n + (e.size || 0), 0);
    console.log(`storage manifest → ${path.basename(manifestFile)} (${entries.length} objects, ${bytes} bytes; restore via bucket versioning)`);
    storageNote = path.basename(manifestFile);
    try {
      await client.destroy?.();
    } catch {
      // Best-effort cleanup.
    }
  } else {
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
prune("s3-manifest-", ".json");

console.log(`done. restore: pg_restore -d "$DATABASE_URL" --clean ${dbFile} | storage: ${storageNote}`);
