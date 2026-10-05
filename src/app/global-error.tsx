"use client";

// Root fallback for errors in the root layout itself. Must define its own
// <html>/<body> (Next.js requirement). No internals on screen, ever.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <main style={{ margin: "0 auto", maxWidth: 480, padding: 24, textAlign: "center" }}>
          <h1>Something went wrong</h1>
          <p>Reload the page. If it persists, contact the administrator.</p>
          <button onClick={reset}>Try again</button>
        </main>
      </body>
    </html>
  );
}
