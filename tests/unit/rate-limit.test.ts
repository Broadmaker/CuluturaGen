// md/09 §116–117: rate limits are enforced and configurable.
import { describe, expect, it } from "vitest";
import {
  checkRateLimit,
  clientIp,
  rateLimitDefaults,
  resetRateLimits,
} from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows up to the limit, then 429s with Retry-After", () => {
    resetRateLimits();
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit("k1", 3, 60_000).allowed).toBe(true);
    }
    const blocked = checkRateLimit("k1", 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("scopes keys independently", () => {
    resetRateLimits();
    expect(checkRateLimit("a", 1, 60_000).allowed).toBe(true);
    expect(checkRateLimit("a", 1, 60_000).allowed).toBe(false);
    expect(checkRateLimit("b", 1, 60_000).allowed).toBe(true);
  });

  it("defaults match §116 (30/min auth, 10/h gen, 20/h refine, 20/h vision)", () => {
    delete process.env.RATE_LIMIT_AUTH_PER_MIN;
    delete process.env.RATE_LIMIT_AI_GENERATE_PER_HOUR;
    delete process.env.RATE_LIMIT_AI_REFINE_PER_HOUR;
    delete process.env.RATE_LIMIT_VISION_PER_HOUR;
    expect(rateLimitDefaults()).toEqual({
      authPerMin: 30,
      aiGeneratePerHour: 10,
      aiRefinePerHour: 20,
      visionAnalyzePerHour: 20,
    });
  });

  it("reads env overrides", () => {
    process.env.RATE_LIMIT_AUTH_PER_MIN = "5";
    expect(rateLimitDefaults().authPerMin).toBe(5);
    delete process.env.RATE_LIMIT_AUTH_PER_MIN;
  });
});

describe("clientIp", () => {
  const req = (headers: Record<string, string>) =>
    new Request("http://x/", { headers }) as Request;

  it("prefers X-Forwarded-For, falls back cleanly", () => {
    expect(clientIp(req({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
    expect(clientIp(req({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
    expect(clientIp(req({}))).toBe("unknown");
  });
});
