import Link from "next/link";
import { and, avg, count, desc, eq, gte, isNull, notInArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { costEstimates, culturalElements, designs, materials, projects } from "@/lib/db/schema";
import StatusBadge from "@/components/status/StatusBadge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import StatCard from "@/components/dashboard/StatCard";
import { PipelineDonut, StatusBars } from "@/components/dashboard/Charts";

// Streaming dashboard sections: each awaits only its own queries, so the
// page header + workflow paint first and cards fill in as data resolves.
// Skeletons hold each section's footprint to avoid layout shift.
function GridSkeleton({ cells, className = "" }: { cells: number; className?: string }) {
  return (
    <div className={`grid gap-3 ${className}`} aria-hidden="true">
      {Array.from({ length: cells }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-stone-200/70" />
      ))}
    </div>
  );
}

export function StatRowFallback() {
  return <GridSkeleton cells={4} className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" />;
}

export async function StatRow() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [activeRows, completedRows, reviewRows, newWeekRows, avgRows, elementRows, materialRows] =
    await Promise.all([
      db.select({ value: count() }).from(projects).where(
        and(isNull(projects.deletedAt), notInArray(projects.status, ["COMPLETED", "ARCHIVED"])),
      ),
      db.select({ value: count() }).from(projects).where(
        and(isNull(projects.deletedAt), eq(projects.status, "COMPLETED")),
      ),
      db.select({ value: count() }).from(designs).where(eq(designs.status, "REVIEW_REQUIRED")),
      db.select({ value: count() }).from(projects).where(
        and(isNull(projects.deletedAt), gte(projects.createdAt, weekAgo)),
      ),
      db.select({ value: avg(costEstimates.totalCost) }).from(costEstimates),
      db.select({ value: count() }).from(culturalElements),
      db.select({ value: count() }).from(materials),
    ]);

  const active = activeRows[0]?.value ?? 0;
  const completed = completedRows[0]?.value ?? 0;
  const pending = reviewRows[0]?.value ?? 0;
  const newWeek = newWeekRows[0]?.value ?? 0;
  const avgCost = avgRows[0]?.value;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Active Projects" value={active} caption={newWeek > 0 ? `+${newWeek} this week` : "Across all cultures"} icon="projects" tone="ink" href="/projects" />
      <StatCard label="Pending Review" value={pending} caption={pending > 0 ? "Designer action needed" : "Queue is clear"} icon="evaluations" tone={pending > 0 ? "red" : "green"} href="/evaluations" />
      <StatCard label="Completed" value={completed} caption="Approved & finalized" icon="reports" tone="green" href="/projects" />
      <StatCard
        label="Avg. Est. Cost"
        value={avgCost ? `₱${Number(avgCost).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
        caption={`${elementRows[0]?.value ?? 0} cultural elements · ${materialRows[0]?.value ?? 0} materials`}
        icon="materials"
        tone="brass"
        href="/materials"
      />
    </div>
  );
}

export function ChartsRowFallback() {
  return <GridSkeleton cells={2} className="lg:grid-cols-5" />;
}

export async function ChartsRow() {
  const [projectsByStatus, designsByStatus] = await Promise.all([
    db.select({ status: projects.status, count: count() }).from(projects).where(
      isNull(projects.deletedAt),
    ).groupBy(projects.status),
    db.select({ status: designs.status, count: count() }).from(designs).groupBy(designs.status),
  ]);
  const projectTotal = projectsByStatus.reduce((s, r) => s + r.count, 0);
  const designTotal = designsByStatus.reduce((s, r) => s + r.count, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card eyebrow="Portfolio" title="Projects by status" className="lg:col-span-3" action={<Button href="/projects" variant="ghost" size="sm">All projects →</Button>}>
        <StatusBars rows={projectsByStatus} total={projectTotal} />
      </Card>
      <Card eyebrow="Pipeline" title="Designs by stage" className="lg:col-span-2" action={<Button href="/design-studio" variant="ghost" size="sm">Studio →</Button>}>
        <PipelineDonut rows={designsByStatus} total={designTotal} />
      </Card>
    </div>
  );
}

export function TablesRowFallback() {
  return <GridSkeleton cells={2} className="md:grid-cols-2" />;
}

export async function TablesRow() {
  const [recentProjects, reviewQueue] = await Promise.all([
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

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card eyebrow="Pipeline" title="Recent Projects" action={<Button href="/projects" variant="ghost" size="sm">View all →</Button>}>
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
  );
}
