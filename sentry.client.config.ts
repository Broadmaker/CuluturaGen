import * as Sentry from "@sentry/nextjs";

// Client-side error monitoring — inert without SENTRY_DSN (see
// src/lib/monitoring.ts). Only the DSN (public) is exposed NEXT_PUBLIC_.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}
