import Link from "next/link";

// Global 404 (md/08 §77: error states guide the user back to the workflow).
export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl p-6 text-center">
      <p className="text-sm uppercase tracking-widest text-neutral-400">404</p>
      <h1 className="mt-1 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-neutral-600">
        The link may be wrong, or the item was archived. Your projects are safe.
      </p>
      <div className="mt-4 flex justify-center gap-2 text-sm">
        <Link href="/dashboard" className="rounded bg-black px-4 py-2 text-white">
          Dashboard
        </Link>
        <Link href="/projects" className="rounded border bg-white px-4 py-2">
          Projects
        </Link>
        <Link href="/culture" className="rounded border bg-white px-4 py-2">
          Cultural Knowledge
        </Link>
      </div>
    </main>
  );
}
