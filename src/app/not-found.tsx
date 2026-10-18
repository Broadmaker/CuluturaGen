import Link from "next/link";

// Global 404 (md/08 §77: error states guide the user back to the workflow).
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center p-6 text-center">
      <span className="font-display text-5xl font-bold text-brand-500">404</span>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink-950">Page not found</h1>
      <p className="mt-2 text-sm text-ink-500">
        The link may be wrong, or the item was archived. Your projects are safe.
      </p>
      <div className="mt-6 flex justify-center gap-2 text-sm">
        <Link
          href="/dashboard"
          className="rounded-xl bg-brand-500 px-4 py-2 font-semibold text-white shadow-sm shadow-brand-500/25 transition-colors hover:bg-brand-600"
        >
          Dashboard
        </Link>
        <Link
          href="/projects"
          className="rounded-xl border border-stone-200 bg-white px-4 py-2 font-medium text-ink-700 shadow-sm transition-colors hover:border-brand-200 hover:text-brand-700"
        >
          Projects
        </Link>
      </div>
    </main>
  );
}
