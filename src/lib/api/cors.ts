// Strict same-origin CORS policy for the API (md/09 §113, md/10 §119).
//
// The platform is a same-origin monolith: browsers calling the API from the
// app send no cross-origin request, so the default is DENY (no ACAO headers).
// Cross-origin browser access is granted only to origins in ALLOWED_ORIGINS
// (comma-separated env). Pure function — unit-tested, reused by middleware.

export function allowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

export function isOriginAllowed(
  requestOrigin: string,
  originHeader: string | null,
  allowlist: string[] = allowedOrigins(),
): boolean {
  if (!originHeader) return true; // non-browser caller (curl, LB probe)
  const norm = originHeader.trim().replace(/\/$/, "");
  if (norm === requestOrigin.replace(/\/$/, "")) return true; // same-origin
  return allowlist.includes(norm);
}

export function corsAllowHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-ID, Idempotency-Key",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}
