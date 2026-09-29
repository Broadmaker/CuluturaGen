import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
        Thesis Prototype — MVP 1
      </p>
      <h1 className="mt-2 text-4xl font-bold">
        Cultural Attire Design Platform
      </h1>
      <p className="mt-4 max-w-2xl text-neutral-600">
        Knowledge → Constraints → Generation → Evaluation → Human Review.
        Start from the dashboard, create a project, research culture, define
        requirements, generate, evaluate, and approve.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/dashboard"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/projects"
          className="rounded border px-4 py-2"
        >
          Projects
        </Link>
        <Link href="/culture" className="rounded border px-4 py-2">
          Cultural Knowledge
        </Link>
      </div>
    </main>
  );
}
