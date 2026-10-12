// md/09 §116–117 + md/10 §119: per-operation rate limits on the expensive
// and abuse-prone endpoints (auth, AI generation). Values are
// env-configurable, never hard-coded.
//
// Two stores behind one signature (md/10 §153 multi-instance):
// - memory (default, $0, single instance): sync sliding-window log.
// - redis (REDIS_URL set): fixed-window INCR+EXPIRE via one atomic Lua
//   script, so any instance count shares the same quota.
// Redis failure fails OPEN (availability over strictness — a down Redis must
// never 500 logins) with a throttled warn log; the memory limiter covers the
// local instance in the meantime. Route handlers use checkRateLimitAsync();
// the sync checkRateLimit stays as the memory core + unit-test surface.
import { Redis } from "ioredis";
import { serverLog } from "./api/log";

const hits = new Map<string, number[]>();

export function rateLimitDefaults() {
  return {
    // Normal mutation class (§116: 30/minute).
    authPerMin: Number(process.env.RATE_LIMIT_AUTH_PER_MIN ?? 30),
    // AI generation (§116: 10/hour/user) and refinement (20/hour/user).
    aiGeneratePerHour: Number(process.env.RATE_LIMIT_AI_GENERATE_PER_HOUR ?? 10),
    aiRefinePerHour: Number(process.env.RATE_LIMIT_AI_REFINE_PER_HOUR ?? 20),
    // Body vision analysis is an expensive external call like generation.
    visionAnalyzePerHour: Number(process.env.RATE_LIMIT_VISION_PER_HOUR ?? 20),
  };
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const seen = (hits.get(key) ?? []).filter((t) => t > cutoff);
  if (seen.length >= limit) {
    const oldest = seen[0] ?? now;
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
  }
  seen.push(now);
  // Cap stored entries so a hot key cannot grow the map unboundedly.
  hits.set(key, seen.slice(-Math.max(limit, 1)));
  return { allowed: true, retryAfterSec: 0 };
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

// Test-only escape hatch: vitest calls this between cases.
export function resetRateLimits(): void {
  hits.clear();
  // Best-effort Redis flush of our own keys; fire-and-forget so sync
  // callers (unit tests) never hang on a down Redis.
  const client = sharedClient();
  if (client) {
    void (async () => {
      try {
        let cursor = "0";
        do {
          const [next, keys] = await client.scan(cursor, "MATCH", "rl:*", "COUNT", 200);
          cursor = next;
          if (keys.length > 0) await client.del(...keys);
        } while (cursor !== "0");
      } catch {
        // Redis down — memory was already cleared; nothing else to do.
      }
    })().catch(() => {});
  }
}

export type RateLimitStore = "memory" | "redis";

// Store selection is env-driven: REDIS_URL set → redis, else memory.
// (A configured-but-unreachable Redis still reports "redis" here — the
// async check fails open to memory per call and health shows store only.)
export function getRateLimitStore(): RateLimitStore {
  return (process.env.REDIS_URL ?? "").trim() ? "redis" : "memory";
}

let redis: Redis | null = null;
let redisFailedAt = 0;

function sharedClient(): Redis | null {
  const url = (process.env.REDIS_URL ?? "").trim();
  if (!url) return null;
  if (!redis) {
    redis = new Redis(url, {
      lazyConnect: true,
      enableReadyCheck: true,
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // single attempt per command; fallback covers the rest
    });
    redis.on("error", () => {
      // Swallowed: every command path already fails open with a warn log.
    });
  }
  return redis;
}

// Test-only escape hatch.
export function resetRateLimitClient(): void {
  if (redis) {
    try {
      redis.disconnect();
    } catch {
      // Already disconnected.
    }
    redis = null;
  }
  redisFailedAt = 0;
}

function noteRedisFallback(err: unknown): void {
  // Throttle the warn: one log line per minute max during an outage.
  const now = Date.now();
  if (now - redisFailedAt < 60_000) return;
  redisFailedAt = now;
  serverLog("warn", "rate_limit_redis_fallback", {
    error: err instanceof Error ? err.message : "unknown",
  });
}

// Atomic fixed-window increment: returns [count, ttlMs]. One round trip,
// no race between INCR and EXPIRE across instances.
const WINDOW_LUA = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return {count, redis.call('PTTL', KEYS[1])}
`;

export async function checkRateLimitAsync(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const client = sharedClient();
  if (!client) return checkRateLimit(key, limit, windowMs);
  const bucket = Math.floor(Date.now() / Math.max(1, windowMs));
  try {
    const [count, ttlMs] = (await client.eval(
      WINDOW_LUA,
      1,
      `rl:${key}:${bucket}`,
      String(Math.max(1, windowMs)),
    )) as [number, number];
    if (count > limit) {
      return { allowed: false, retryAfterSec: Math.max(1, Math.ceil(ttlMs / 1000)) };
    }
    return { allowed: true, retryAfterSec: 0 };
  } catch (err) {
    noteRedisFallback(err);
    return checkRateLimit(key, limit, windowMs);
  }
}
