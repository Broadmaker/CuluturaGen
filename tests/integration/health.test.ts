// Health endpoint against the real stack. Skips gracefully when unreachable.
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import { GET } from "@/app/api/health/route";

let reachable = false;

beforeAll(async () => {
  try {
    await db.execute("select 1");
    reachable = true;
  } catch {
    reachable = false;
  }
});

describe("health endpoint", () => {
  it("reports healthy with db/storage/provider checks, no secrets", async () => {
    if (!reachable) return;
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      status: string;
      checks: {
        database: { ok: boolean; latencyMs: number };
        storage: { ok: boolean; backend: string };
        providers: { ai: string; vision: string };
      };
    };
    expect(body.ok).toBe(true);
    expect(body.checks.database.ok).toBe(true);
    expect(body.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
    expect(body.checks.storage.ok).toBe(true);
    expect(body.checks.storage.backend).toBe("local");
    expect(body.checks.providers.ai).toBe("mock");
    expect(body.checks.providers.vision).toBe("mock");
    expect(JSON.stringify(body)).not.toMatch(/password|secret|key/i);
  });
});
