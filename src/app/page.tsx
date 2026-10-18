import Link from "next/link";
import Button from "@/components/ui/Button";
import { NavIcons } from "@/components/layout/icons";

const NAV = [
  { href: "/culture", label: "Cultural Knowledge" },
  { href: "/projects", label: "Projects" },
  { href: "/materials", label: "Materials" },
  { href: "/design-studio", label: "Studio" },
];

const STEPS = [
  { n: 1, label: "Research culture", hint: "Verified elements, sources & restrictions" },
  { n: 2, label: "Brief & body", hint: "Requirements plus the client's body profile" },
  { n: 3, label: "Pick materials", hint: "Priced supplier library, append-only history" },
  { n: 4, label: "Generate", hint: "AI concept grounded in the cultural basket" },
  { n: 5, label: "Cost & evaluate", hint: "Deterministic costing, six evaluation domains" },
  { n: 6, label: "Review & report", hint: "Human approval plus PDF deliverables" },
];

const FEATURES: { icon: keyof typeof NavIcons; title: string; body: string }[] = [
  {
    icon: "culture",
    title: "Cultural knowledge base",
    body: "Verified-first elements with citations, restrictions and relationships — the single source of truth.",
  },
  {
    icon: "studio",
    title: "Grounded generation",
    body: "Concepts cite the exact cultural elements they use. The AI composes; it never invents heritage.",
  },
  {
    icon: "materials",
    title: "Deterministic costing",
    body: "A real cost engine — not the model — prices materials and flags every missing figure.",
  },
  {
    icon: "evaluations",
    title: "Evidence-based evaluation",
    body: "Six domains scored with findings and recommendations. Never an authenticity verdict.",
  },
  {
    icon: "admin",
    title: "Human in the loop",
    body: "Every gate is a deliberate human decision. Evaluation snapshots are immutable by design.",
  },
  {
    icon: "reports",
    title: "Reports & traceability",
    body: "PDF deliverables for each stage, backed by a full audit trail of who did what, and when.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-paper/85 backdrop-blur">
        <div className="flex w-full items-center justify-between gap-3 px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 font-display text-xl font-bold text-white shadow-sm shadow-brand-500/40"
            >
              A
            </span>
            <span>
              <span className="block font-display text-lg font-bold leading-none text-ink-950">
                AttireLab
              </span>
              <span className="mt-1 block text-[11px] font-medium uppercase tracking-widest text-ink-400">
                Heritage design lab
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Product">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button href="/login" variant="secondary" size="sm">
              Sign in
            </Button>
            <Button href="/dashboard" variant="accent" size="sm">
              Open Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="px-6 py-16 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-700 ring-1 ring-inset ring-brand-100">
                Master&apos;s thesis prototype
              </span>
              <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-ink-950 sm:text-5xl">
                Heritage-informed attire design,{" "}
                <span className="text-brand-600">reviewed at every gate</span>.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
                AttireLab turns structured cultural knowledge into design
                constraints — then generates, costs and evaluates concepts with
                cultural experts in the loop.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/dashboard" variant="accent">
                  Enter the atelier
                  <span aria-hidden="true">{NavIcons.arrowRight}</span>
                </Button>
                <Button href="/culture" variant="secondary">
                  Explore the knowledge base
                </Button>
              </div>

              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
                {[
                  { value: "6", label: "Workflow stages" },
                  { value: "6", label: "Evaluation domains" },
                  { value: "100%", label: "Human-approved gates" },
                ].map((s) => (
                  <div key={s.label}>
                    <dt className="font-display text-3xl font-bold text-ink-950">
                      {s.value}
                    </dt>
                    <dd className="mt-1 text-xs font-medium uppercase tracking-widest text-ink-400">
                      {s.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Product preview */}
            <div className="relative">
              <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-pop">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">
                      Studio
                    </p>
                    <p className="font-display text-lg font-bold text-ink-950">
                      Barong Tagalog · V3
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    Review required
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "Cultural", value: "3 / 4", tone: "text-brand-600" },
                    { label: "Cost", value: "₱12.4k", tone: "text-ink-950" },
                    { label: "Findings", value: "2", tone: "text-amber-600" },
                  ].map((t) => (
                    <div
                      key={t.label}
                      className="rounded-2xl border border-stone-200/80 bg-paper/60 px-3 py-3"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">
                        {t.label}
                      </p>
                      <p className={`mt-1 font-display text-xl font-bold ${t.tone}`}>
                        {t.value}
                      </p>
                    </div>
                  ))}
                </div>

                <ul className="mt-4 space-y-3">
                  {[
                    { label: "Cultural fidelity", pct: 82 },
                    { label: "Requirement coverage", pct: 67 },
                    { label: "Budget fit", pct: 91 },
                  ].map((row) => (
                    <li key={row.label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-ink-700">{row.label}</span>
                        <span className="tabular-nums text-ink-400">{row.pct}%</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="absolute -bottom-5 -left-5 hidden items-center gap-2.5 rounded-2xl border border-stone-200/80 bg-white px-4 py-3 shadow-card sm:flex">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink-900">
                    Sourced &amp; cited
                  </span>
                  <span className="block text-xs text-ink-500">
                    Every element traceable
                  </span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section className="border-y border-stone-200/70 bg-white px-6 py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              The workflow
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-950">
              From cultural research to final approval
            </h2>
            <p className="mt-3 text-ink-500">
              One project per attire task, moving through six deliberate stages —
              each with its own evidence and quality gate.
            </p>
          </div>

          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="rounded-2xl border border-stone-200/80 bg-paper/60 p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/50"
              >
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 font-display text-sm font-bold text-brand-400"
                >
                  {s.n}
                </span>
                <p className="mt-3 font-display text-base font-bold text-ink-950">
                  {s.label}
                </p>
                <p className="mt-1 text-sm text-ink-500">{s.hint}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Features */}
        <section className="px-6 py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              Why AttireLab
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-950">
              Grounded by design, not by chance
            </h2>
            <p className="mt-3 text-ink-500">
              The platform keeps heritage, cost and evaluation honest — with
              evidence attached to every claim.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card"
              >
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100"
                >
                  {NavIcons[f.icon]}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-ink-950">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-20">
          <div className="overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-paper p-10 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-xl">
                <h2 className="font-display text-3xl font-bold tracking-tight text-ink-950">
                  Ready to start a project?
                </h2>
                <p className="mt-2 text-ink-600">
                  Open the dashboard, create a project, and let the atelier guide
                  the rest — research, generate, evaluate, approve.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="/dashboard" variant="accent">
                  Go to Dashboard
                </Button>
                <Button href="/projects/new" variant="secondary">
                  New Project
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200/70 bg-white px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-display text-base font-bold text-white"
            >
              A
            </span>
            <span className="text-sm text-ink-500">
              AttireLab — Human-AI Collaborative Cultural Attire Design Platform
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-sm" aria-label="Footer">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-ink-600 transition-colors hover:text-brand-600"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
