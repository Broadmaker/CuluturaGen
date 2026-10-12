import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { serverLog } from "@/lib/api/log";
import { probeStorage } from "@/lib/storage";
import { getStorageBackend } from "@/lib/storage-config";
import { getProvider } from "@/lib/ai/provider";
import { getVisionProvider } from "@/lib/vision/provider";
import { isPgVectorAvailable } from "@/lib/retrieval/pgvector";

// Liveness + dependency checks for load balancers and monitors (md/10 §153).
// Unauthenticated by design; exposes provider NAMES only — never keys,
// counts, or connection strings.
export async function GET() {
  const started = Date.now();
  let dbMs: number | null = null;
  let dbOk = false;
  let pgvector = false;
  try {
    await db.execute("select 1");
    dbMs = Date.now() - started;
    dbOk = true;
    pgvector = await isPgVectorAvailable();
  } catch (err) {
    serverLog("error", "health_db_failed", { error: err instanceof Error ? err.message : "unknown" });
  }

  let storageOk = false;
  let storageBackend = "unknown";
  try {
    storageBackend = getStorageBackend();
    await probeStorage();
    storageOk = true;
  } catch (err) {
    serverLog("error", "health_storage_failed", { error: err instanceof Error ? err.message : "unknown" });
  }

  let aiProvider = "unknown";
  let visionProvider = "unknown";
  try {
    aiProvider = getProvider().name;
  } catch {
    aiProvider = "misconfigured";
  }
  try {
    visionProvider = getVisionProvider().name;
  } catch {
    visionProvider = "misconfigured";
  }

  const healthy = dbOk && storageOk;
  const body = {
    ok: healthy,
    status: healthy ? "healthy" : "degraded",
    checks: {
      database: dbOk ? { ok: true, latencyMs: dbMs, pgvector } : { ok: false, pgvector },
      storage: { ok: storageOk, backend: storageBackend },
      providers: { ai: aiProvider, vision: visionProvider, mode: "mock-first" },
    },
    uptimeSec: Math.floor(process.uptime()),
  };
  return NextResponse.json(body, { status: healthy ? 200 : 503 });
}
