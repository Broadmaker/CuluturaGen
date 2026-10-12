// Structured server log (md/09 §132). Single JSON line per event to stdout —
// captured by the host / journald in production. Secrets are
// stripped recursively: passwords, tokens, keys, cookies, auth headers must
// NEVER reach logs (md/09 §132 "Never log").

const SENSITIVE = new Set([
  "password",
  "passwordhash",
  "currentpassword",
  "newpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "apikey",
  "api_key",
  "secret",
  "authsecret",
  "authorization",
  "cookie",
  "set-cookie",
  "session",
  "privatekey",
]);

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[depth]";
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE.has(k.toLowerCase().replace(/[_-]/g, "")) ? "[redacted]" : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

export function serverLog(
  level: "info" | "warn" | "error",
  event: string,
  fields: Record<string, unknown> = {},
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...(redact(fields) as Record<string, unknown>),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
  // Error monitoring (md/10 §153): Sentry capture on the error path only,
  // inert without SENTRY_DSN, never throws into the request. Context is the
  // already-redacted fields — raw error objects never leave this module.
  if (level === "error") {
    const context = redact(fields) as Record<string, unknown>;
    void import("@/lib/monitoring").then(
      (m) => m.reportError(new Error(event), { ...context, event }),
      () => {},
    );
  }
}
