// Next.js instrumentation hook (requires instrumentationHook in
// next.config.mjs). Registers the server config on boot; without
// SENTRY_DSN the import is a no-op (see sentry.server.config.ts).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
}
