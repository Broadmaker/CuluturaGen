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
    <main className="mx-auto max-w-xl p-6 text-center">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Your work is saved. Try again, or go back to the dashboard.
        {error.digest ? ` (ref ${error.digest})` : ""}
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <button onClick={reset} className="rounded bg-black px-4 py-2 text-sm text-white">
          Try again
        </button>
        <a href="/dashboard" className="rounded border px-4 py-2 text-sm">
          Dashboard
        </a>
      </div>
    </main>
  );
}
