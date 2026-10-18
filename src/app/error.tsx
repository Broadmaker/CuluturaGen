"use client";

import { useEffect } from "react";

// Route-level fallback (production readiness): a friendly message instead of
// a blank page or stack trace. Details stay in server logs, never on screen.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("route error", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center p-6 text-center">
      <h1 className="font-display text-xl font-bold text-ink-950">Something went wrong</h1>
      <p className="mt-2 text-sm text-ink-500">
        Your work is saved. Try again, or go back to the dashboard.
        {error.digest ? ` (ref ${error.digest})` : ""}
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <button
          onClick={reset}
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition-colors hover:bg-brand-600"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-sm transition-colors hover:border-brand-200 hover:text-brand-700"
        >
          Dashboard
        </a>
      </div>
    </main>
  );
}
