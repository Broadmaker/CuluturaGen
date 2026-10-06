import Link from "next/link";
import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth/session";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { NavIcons } from "@/components/layout/icons";
import {
  ChartsRow,
  ChartsRowFallback,
  StatRow,
  StatRowFallback,
  TablesRow,
  TablesRowFallback,
} from "@/components/dashboard/sections";

// Dashboard — md/01 §7. Streams: header + workflow paint immediately, data
// sections fill in via Suspense as their queries resolve.
const FLOW = [
  { n: 1, label: "Research culture", href: "/culture", hint: "Verified elements" },
  { n: 2, label: "Brief & body", href: "/projects", hint: "Requirements + profile" },
  { n: 3, label: "Pick materials", href: "/materials", hint: "Priced library" },
  { n: 4, label: "Generate", href: "/design-studio", hint: "AI studio" },
  { n: 5, label: "Cost & evaluate", href: "/evaluations", hint: "6 domains" },
  { n: 6, label: "Review & report", href: "/reports", hint: "Approve + PDF" },
];

export default async function DashboardPage() {
  const user = await getSessionUser();
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        eyebrow={today}
        title={`Welcome back${user?.displayName ? `, ${user.displayName}` : ""}`}
        description="From cultural research to final approval — pick up where the atelier left off."
        actions={
          <>
            <Button href="/projects/new" variant="accent">
              <span aria-hidden="true">{NavIcons.plus}</span> New Project
            </Button>
            <Button href="/design-studio" variant="secondary">Open Studio</Button>
          </>
        }
      />

      <Suspense fallback={<StatRowFallback />}>
        <StatRow />
      </Suspense>

      <Card eyebrow="Workflow" title="How a project flows">
        <ol className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {FLOW.map((s) => (
            <li key={s.n}>
              <Link
                href={s.href}
                className="group flex h-full items-start gap-2.5 rounded-lg border border-stone-200 bg-paper p-3 transition-colors hover:border-brass-400 hover:bg-brass-50"
              >
                <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-brass-400">
                  {s.n}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink-950 group-hover:underline">{s.label}</span>
                  <span className="block truncate text-xs text-stone-500">{s.hint}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Card>

      <Suspense fallback={<ChartsRowFallback />}>
        <ChartsRow />
      </Suspense>

      <Suspense fallback={<TablesRowFallback />}>
        <TablesRow />
      </Suspense>
    </main>
  );
}
