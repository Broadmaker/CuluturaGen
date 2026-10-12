import * as Sentry from "@sentry/nextjs";

// Edge-runtime error monitoring (middleware) — inert without SENTRY_DSN.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0,
  });
}
