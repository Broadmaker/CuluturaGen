import { afterEach, describe, expect, it, vi } from "vitest";
import { isSentryEnabled, reportError } from "@/lib/monitoring";

// Error monitoring is strictly opt-in: without SENTRY_DSN nothing loads,
// nothing sends, nothing throws.
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn(() => "id") }));

describe("isSentryEnabled", () => {
  it("is off without a DSN, on with one", () => {
    delete process.env.SENTRY_DSN;
    expect(isSentryEnabled()).toBe(false);
    process.env.SENTRY_DSN = "https://example@o1.ingest.sentry.io/1";
    expect(isSentryEnabled()).toBe(true);
    delete process.env.SENTRY_DSN;
  });

  it("treats blank DSNs as off", () => {
    process.env.SENTRY_DSN = "   ";
    expect(isSentryEnabled()).toBe(false);
    delete process.env.SENTRY_DSN;
  });
});

describe("reportError", () => {
  afterEach(() => vi.clearAllMocks());

  it("no-ops without a DSN (SDK never touched)", async () => {
    delete process.env.SENTRY_DSN;
    expect(() => reportError(new Error("boom"), { event: "x" })).not.toThrow();
    const sentry = await import("@sentry/nextjs");
    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  it("captures via the SDK when enabled", async () => {
    process.env.SENTRY_DSN = "https://example@o1.ingest.sentry.io/1";
    reportError(new Error("boom"), { event: "health_db_failed" });
    await new Promise((r) => setTimeout(r, 50));
    const sentry = await import("@sentry/nextjs");
    expect(sentry.captureException).toHaveBeenCalledTimes(1);
    const [err, opts] = (sentry.captureException as ReturnType<typeof vi.fn>).mock.calls[0] as [
      Error,
      { extra: Record<string, unknown> },
    ];
    expect(err.message).toBe("boom");
    expect(opts.extra).toMatchObject({ event: "health_db_failed" });
    delete process.env.SENTRY_DSN;
  });
});
