// AI spend ledger + quotas against the real DB (md/10 §158–159).
// Self-cleaning: a probe ai_jobs row (+ its ai_usage rows via cascade)
// is created and deleted within the test. Skips gracefully without a DB.
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { aiJobs, aiUsage } from "@/lib/db/schema";
import {
  checkQuota,
  quotaDefaults,
  recordUsage,
  todayUsageCount,
} from "@/server/services/ai/AiUsage";

let reachable = false;

beforeAll(async () => {
  try {
    await db.execute("select 1");
    reachable = true;
  } catch {
    reachable = false;
  }
});

describe("ai spend ledger", () => {
  it("records mock usage at $0 and counts it toward quotas", async () => {
    if (!reachable) return;
    const [job] = await db
      .insert(aiJobs)
      .values({ jobType: "DESIGN_SPECIFICATION", provider: "mock", status: "COMPLETED" })
      .returning({ id: aiJobs.id });
    try {
      const cost = await recordUsage({
        jobId: job.id,
        userId: "00000000-0000-0000-0000-000000000001",
        projectId: null,
        kind: "GENERATION",
        provider: "mock",
        model: "mock",
        inputTokens: 0,
        outputTokens: 0,
        images: 1,
      });
      expect(cost).toEqual({ usd: 0, unpriced: false });
      const rows = await db.select().from(aiUsage).where(eq(aiUsage.jobId, job.id));
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ kind: "GENERATION", images: 1, unpriced: false });
      expect(Number(rows[0].estimatedCostUsd)).toBe(0);
      expect(await todayUsageCount("00000000-0000-0000-0000-000000000001", "GENERATION")).toBeGreaterThanOrEqual(1);
    } finally {
      await db.delete(aiJobs).where(eq(aiJobs.id, job.id));
    }
    expect(await db.select().from(aiUsage).where(eq(aiUsage.jobId, job.id))).toHaveLength(0);
  });

  it("blocks at the daily quota with a 429 code", async () => {
    if (!reachable) return;
    process.env.AI_QUOTA_GENERATE_PER_DAY = "0";
    try {
      await expect(checkQuota("00000000-0000-0000-0000-000000000003", "GENERATION")).rejects.toMatchObject({
        code: "AI_QUOTA_EXCEEDED",
        status: 429,
      });
    } finally {
      delete process.env.AI_QUOTA_GENERATE_PER_DAY;
    }
  });

  it("defaults are thesis-safe (smokes never trip them)", () => {
    delete process.env.AI_QUOTA_GENERATE_PER_DAY;
    delete process.env.AI_QUOTA_REFINE_PER_DAY;
    delete process.env.AI_QUOTA_IMAGE_PER_DAY;
    expect(quotaDefaults()).toEqual({ generatePerDay: 50, refinePerDay: 100, imagePerDay: 50 });
  });
});
