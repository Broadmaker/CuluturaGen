// Error monitoring (md/10 §153–154). Sentry is strictly opt-in: without
// SENTRY_DSN every function below is a no-op and the SDK never sends.
// With a DSN, server errors (via serverLog) and unhandled client errors
// land in Sentry with request IDs but never secrets (serverLog redacts).
export function isSentryEnabled(): boolean {
  return Boolean((process.env.SENTRY_DSN ?? "").trim());
}

// Fire-and-forget from serverLog's error path. Dynamic import keeps the
// Sentry SDK out of memory/bundle unless a DSN is configured AND an error
// actually occurs. Never throws into callers.
export function reportError(err: unknown, context: Record<string, unknown> = {}): void {
  if (!isSentryEnabled()) return;
  void (async () => {
    try {
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
        extra: context,
      });
    } catch {
      // Monitoring must never break the request it observes.
    }
  })();
}
