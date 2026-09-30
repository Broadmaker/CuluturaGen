// md/09 §116–117 + md/10 §119: per-operation rate limits on the expensive
// and abuse-prone endpoints (auth, AI generation). In-memory sliding window;
// values are env-configurable, never hard-coded. For a multi-instance deploy
// this moves to Redis — the check() signature stays the same.

const hits = new Map<string, number[]>();

export function rateLimitDefaults() {
  return {
    // Normal mutation class (§116: 30/minute).
    authPerMin: Number(process.env.RATE_LIMIT_AUTH_PER_MIN ?? 30),
    // AI generation (§116: 10/hour/user) and refinement (20/hour/user).
    aiGeneratePerHour: Number(process.env.RATE_LIMIT_AI_GENERATE_PER_HOUR ?? 10),
    aiRefinePerHour: Number(process.env.RATE_LIMIT_AI_REFINE_PER_HOUR ?? 20),
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
}
