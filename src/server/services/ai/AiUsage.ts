import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { aiUsage } from "@/lib/db/schema";
import { estimateCost } from "@/lib/ai/pricing";

// AI spend ledger + daily quotas (md/10 §158–159). Every provider call that
// can cost money lands one row: who, which project/job, what kind, what
// model, tokens/images, estimated USD. Quotas are a second layer above the
// hourly rate limits: per-user, per-kind, per calendar day, env-configurable
// with generous thesis-safe defaults (smokes + demo seeds never trip them).

export type UsageKind = "GENERATION" | "REFINEMENT" | "IMAGE";

export function quotaDefaults() {
  return {
    generatePerDay: Number(process.env.AI_QUOTA_GENERATE_PER_DAY ?? 50),
    refinePerDay: Number(process.env.AI_QUOTA_REFINE_PER_DAY ?? 100),
    imagePerDay: Number(process.env.AI_QUOTA_IMAGE_PER_DAY ?? 50),
  };
}

function quotaFor(kind: UsageKind): number {
  const q = quotaDefaults();
  return kind === "GENERATION" ? q.generatePerDay : kind === "REFINEMENT" ? q.refinePerDay : q.imagePerDay;
}

export async function recordUsage(opts: {
  jobId: string;
  userId: string | null;
  projectId: string | null;
  kind: UsageKind;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  images: number;
}): Promise<{ usd: number; unpriced: boolean }> {
  const cost = estimateCost({
    provider: opts.provider,
    model: opts.model,
    inputTokens: opts.inputTokens,
    outputTokens: opts.outputTokens,
    images: opts.images,
  });
  await db.insert(aiUsage).values({
    jobId: opts.jobId,
    userId: opts.userId,
    projectId: opts.projectId,
    kind: opts.kind,
    provider: opts.provider,
    model: opts.model,
    inputTokens: Math.max(0, Math.floor(opts.inputTokens)),
    outputTokens: Math.max(0, Math.floor(opts.outputTokens)),
    images: Math.max(0, Math.floor(opts.images)),
    estimatedCostUsd: String(cost.usd),
    unpriced: cost.unpriced,
  });
  return cost;
}

export async function todayUsageCount(userId: string, kind: UsageKind): Promise<number> {
  const rows = (await db.execute(sql`
    SELECT COUNT(*)::int AS "n" FROM "ai_usage"
    WHERE "user_id" = ${userId} AND "kind" = ${kind}
      AND "created_at" >= CURRENT_DATE
  `)) as unknown as { rows: { n: number }[] };
  return rows.rows?.[0]?.n ?? 0;
}

// Throws 429 AI_QUOTA_EXCEEDED (routes pass status through) when today's
// count for this user+kind has reached the configured daily quota.
export async function checkQuota(userId: string, kind: UsageKind): Promise<void> {
  const limit = quotaFor(kind);
  if (!Number.isFinite(limit) || limit < 0) return;
  const used = await todayUsageCount(userId, kind);
  if (used >= limit) {
    throw Object.assign(
      new Error(`${kind === "IMAGE" ? "Image" : kind.charAt(0) + kind.slice(1).toLowerCase()} quota reached for today (${used}/${limit}).`),
      { status: 429, code: "AI_QUOTA_EXCEEDED" },
    );
  }
}
