import Link from "next/link";
import { and, avg, count, desc, eq, isNull, notInArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { costEstimates, designs, projects } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import StatusBadge from "@/components/status/StatusBadge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";

// md/01 §7 dashboard: statistics, recent projects, quick actions, review queue.
export default async function DashboardPage() {
  const user = await getSessionUser();

  const [
    activeRows,
    completedRows,
    draftRows,
    reviewRows,
    avgRows,
    recentProjects,
    reviewQueue,
  ] = await Promise.all([
    db.select({ value: count() }).from(projects).where(
      and(isNull(projects.deletedAt), notInArray(projects.status, ["COMPLETED", "ARCHIVED"])),
    ),
    db.select({ value: count() }).from(projects).where(
      and(isNull(projects.deletedAt), eq(projects.status, "COMPLETED")),
    ),
    db.select({ value: count() }).from(designs).where(eq(designs.status, "DRAFT")),
    db.select({ value: count() }).from(designs).where(eq(designs.status, "REVIEW_REQUIRED")),
    db.select({ value: avg(costEstimates.totalCost) }).from(costEstimates),
    db.query.projects.findMany({
      where: isNull(projects.deletedAt),
      orderBy: desc(projects.updatedAt),
      limit: 5,
    }),
    db.query.designs.findMany({
      where: eq(designs.status, "REVIEW_REQUIRED"),
      orderBy: desc(designs.updatedAt),
      limit: 5,
      with: { project: { columns: { name: true } } },
    }),
  ]);

  const avgCost = avgRows[0]?.value;
  const cards = [
    { label: "Active Projects", value: activeRows[0]?.value ?? 0 },
    { label: "Completed", value: completedRows[0]?.value ?? 0 },
    { label: "Draft Designs", value: draftRows[0]?.value ?? 0 },
    { label: "Pending Review", value: reviewRows[0]?.value ?? 0 },
    {
      label: "Avg. Est. Cost",
      value: avgCost
        ? `₱${Number(avgCost).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        : "—",
    },
  ];

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        eyebrow="Design workspace"
        title={`Welcome back${user?.displayName ? `, ${user.displayName}` : ""}`}
        description="Track projects from cultural research to final approval."
        actions={<Button href="/projects/new" variant="accent">+ New Project</Button>}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-stone-200 border-t-4 border-t-brass-500 bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">{c.label}</p>
            <p className="mt-1 font-display text-3xl text-ink-950">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Button href="/culture" variant="secondary">Browse Cultural Knowledge</Button>
        <Button href="/materials" variant="secondary">Materials & Costs</Button>
        <Button href="/design-studio" variant="secondary">Saved Designs</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card eyebrow="Pipeline" title="Recent Projects">
          {recentProjects.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">
              No projects yet. <Link href="/projects/new" className="font-medium text-ink-800 underline underline-offset-2">Create your first project</Link>.
            </p>
          ) : (
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th>Project</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/projects/${p.id}`} className="font-medium text-ink-800 underline underline-offset-2">
                        {p.name}
                      </Link>
                    </td>
                    <td>
                      <StatusBadge value={p.status} />
                    </td>
                    <td className="text-stone-500">{p.updatedAt?.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card
          eyebrow="Attention"
          title="Review Queue"
          action={<Button href="/evaluations" variant="ghost" size="sm">All evaluations →</Button>}
        >
          {reviewQueue.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">Nothing awaiting review.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {reviewQueue.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-brass-200 bg-brass-50 px-3 py-2">
                  <div className="min-w-0">
                    <Link href={`/design-studio/${d.id}`} className="font-medium text-ink-900 underline underline-offset-2">
                      {d.name ?? d.designCode}
                    </Link>
                    <span className="text-stone-500"> · {d.project.name}</span>
                  </div>
                  <StatusBadge value="REVIEW_REQUIRED" />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  );
}
