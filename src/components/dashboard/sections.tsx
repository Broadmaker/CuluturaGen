import Link from "next/link";
import { and, avg, count, desc, eq, gte, isNull, notInArray, sum } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  aiUsage,
  costEstimates,
  culturalElements,
  designs,
  materials,
  projectCulturalElements,
  projects,
} from "@/lib/db/schema";
import StatusBadge from "@/components/status/StatusBadge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import StatCard from "@/components/dashboard/StatCard";
import { AreaTrend, GoalGauge, PipelineDonut, RankBars, StatusBars } from "@/components/dashboard/Charts";

const DAY_MS = 24 * 60 * 60 * 1000;

// Monday-anchored week starts for the activity trend (oldest first).
function buildWeeks(count: number) {
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  current.setDate(current.getDate() - ((current.getDay() + 6) % 7));
  const weeks: Date[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(current);
    d.setDate(d.getDate() - i * 7);
    weeks.push(d);
  }
  return weeks;
}

function bucketByWeek(rows: Array<{ createdAt: Date | null }>, weeks: Date[]) {
  const winStart = weeks[0].getTime();
  const out = weeks.map(() => 0);
  for (const r of rows) {
    if (!r.createdAt) continue;
    const idx = Math.floor((r.createdAt.getTime() - winStart) / (7 * DAY_MS));
    if (idx >= 0 && idx < out.length) out[idx] += 1;
  }
  return out;
}

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
      <StatCard label="Active Projects" value={active} caption={newWeek > 0 ? `+${newWeek} this week` : "Across all cultures"} icon="projects" tone="ink" href="/projects" featured />
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

export function InsightsRowFallback() {
  return <GridSkeleton cells={2} className="lg:grid-cols-5" />;
}

export async function InsightsRow() {
  const weeks = buildWeeks(8);
  const winStart = weeks[0];
  const [projectDates, designDates, totalRows, completedRows] = await Promise.all([
    db
      .select({ createdAt: projects.createdAt })
      .from(projects)
      .where(and(isNull(projects.deletedAt), gte(projects.createdAt, winStart))),
    db.select({ createdAt: designs.createdAt }).from(designs).where(gte(designs.createdAt, winStart)),
    db.select({ value: count() }).from(projects).where(isNull(projects.deletedAt)),
    db
      .select({ value: count() })
      .from(projects)
      .where(and(isNull(projects.deletedAt), eq(projects.status, "COMPLETED"))),
  ]);

  const projectSeries = bucketByWeek(projectDates, weeks);
  const designSeries = bucketByWeek(designDates, weeks);
  const labels = weeks.map((w) => w.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
  const totalProjects = totalRows[0]?.value ?? 0;
  const completed = completedRows[0]?.value ?? 0;
  const newThisWindow = projectSeries.reduce((s, n) => s + n, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card
        eyebrow="Activity"
        title="New work, last 8 weeks"
        className="lg:col-span-3"
        action={<Button href="/projects" variant="ghost" size="sm">All projects →</Button>}
      >
        <AreaTrend
          labels={labels}
          series={[
            { name: "Projects", color: "#f97316", points: projectSeries },
            { name: "Designs", color: "#fdba74", dashed: true, points: designSeries },
          ]}
          summary={`New work over the last 8 weeks: ${newThisWindow} projects and ${designSeries.reduce((s, n) => s + n, 0)} designs created.`}
        />
      </Card>
      <Card eyebrow="Progress" title="Portfolio completion" className="lg:col-span-2">
        <GoalGauge
          value={completed}
          total={totalProjects}
          label="Projects completed"
          caption={
            totalProjects === 0
              ? "No projects yet"
              : `${totalProjects - completed} still in flight`
          }
        />
      </Card>
    </div>
  );
}

export function RankingsRowFallback() {
  return <GridSkeleton cells={2} className="lg:grid-cols-5" />;
}

export async function RankingsRow() {
  const [motifRows, usageRows, unpricedRows] = await Promise.all([
    db
      .select({ name: culturalElements.name, total: count() })
      .from(projectCulturalElements)
      .innerJoin(culturalElements, eq(projectCulturalElements.culturalElementId, culturalElements.id))
      .groupBy(culturalElements.name)
      .orderBy(desc(count()))
      .limit(5),
    db.select({ calls: count(), spend: sum(aiUsage.estimatedCostUsd) }).from(aiUsage),
    db.select({ value: count() }).from(aiUsage).where(eq(aiUsage.unpriced, true)),
  ]);

  const calls = usageRows[0]?.calls ?? 0;
  const spend = Number(usageRows[0]?.spend ?? 0);
  const unpriced = unpricedRows[0]?.value ?? 0;

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card
        eyebrow="Knowledge"
        title="Most-referenced motifs"
        className="lg:col-span-3"
        action={<Button href="/culture" variant="ghost" size="sm">Browse culture →</Button>}
      >
        {motifRows.length === 0 ? (
          <p className="text-sm text-ink-500">
            No motifs in project baskets yet.{" "}
            <Link href="/culture" className="font-medium text-ink-800 underline-offset-2 hover:text-brand-600 hover:underline">
              Add cultural references
            </Link>
            .
          </p>
        ) : (
          <RankBars
            rows={motifRows.map((r) => ({
              label: r.name,
              value: r.total,
              href: `/culture?q=${encodeURIComponent(r.name)}`,
              meta: r.total === 1 ? "project" : "projects",
            }))}
          />
        )}
      </Card>
      <Card
        eyebrow="AI"
        title="Generation activity"
        className="lg:col-span-2"
        action={<Button href="/design-studio" variant="ghost" size="sm">Studio →</Button>}
      >
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-stone-200/80 bg-paper/60 p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">AI calls</dt>
            <dd className="mt-1 font-display text-2xl font-bold text-ink-950">{calls}</dd>
          </div>
          <div className="rounded-xl border border-stone-200/80 bg-paper/60 p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Est. spend</dt>
            <dd className="mt-1 font-display text-2xl font-bold text-ink-950">${spend.toFixed(2)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-ink-500">
          {unpriced > 0
            ? `${unpriced} unpriced call${unpriced === 1 ? "" : "s"} — cost not invented.`
            : "All calls priced (mock provider = $0)."}
        </p>
      </Card>
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
          <p className="mt-2 text-sm text-ink-500">
            No projects yet. <Link href="/projects/new" className="font-medium text-ink-800 underline-offset-2 hover:text-brand-600 hover:underline">Create your first project</Link>.
          </p>
        ) : (
          <div className="overflow-x-auto">
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
                      <Link href={`/projects/${p.id}`} className="font-medium text-ink-800 underline-offset-2 hover:text-brand-600 hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td>
                      <StatusBadge value={p.status} />
                    </td>
                    <td className="text-ink-500">{p.updatedAt?.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        eyebrow="Attention"
        title="Review Queue"
        action={<Button href="/evaluations" variant="ghost" size="sm">All evaluations →</Button>}
      >
        {reviewQueue.length === 0 ? (
          <p className="mt-2 text-sm text-ink-500">Nothing awaiting review.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {reviewQueue.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-brass-200 bg-brass-50 px-3 py-2">
                <div className="min-w-0">
                  <Link href={`/design-studio/${d.id}`} className="font-medium text-ink-800 underline-offset-2 hover:text-brand-600 hover:underline">
                    {d.name ?? d.designCode}
                  </Link>
                  <span className="text-ink-500"> · {d.project.name}</span>
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
