import Link from "next/link";
import { and, avg, count, desc, eq, isNull, notInArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { costEstimates, designs, projects } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

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
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">
        Welcome back{user?.displayName ? `, ${user.displayName}` : ""}
      </h1>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded border bg-white p-4">
            <p className="text-xs uppercase tracking-widest text-neutral-500">{c.label}</p>
            <p className="mt-1 text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <Link href="/projects/new" className="rounded bg-black px-4 py-2 text-white">
          + New Project
        </Link>
        <Link href="/culture" className="rounded border bg-white px-4 py-2">
          Browse Cultural Knowledge
        </Link>
        <Link href="/materials" className="rounded border bg-white px-4 py-2">
          Materials & Costs
        </Link>
        <Link href="/design-studio" className="rounded border bg-white px-4 py-2">
          Saved Designs
        </Link>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="font-semibold">Recent Projects</h2>
          {recentProjects.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">No projects yet.</p>
          ) : (
            <table className="mt-2 w-full rounded border bg-white text-sm">
              <thead>
                <tr className="border-b text-left text-neutral-500">
                  <th className="px-3 py-2">Project</th>
                  <th>Status</th>
                  <th className="px-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="px-3 py-2">
                      <Link href={`/projects/${p.id}`} className="underline">
                        {p.name}
                      </Link>
                    </td>
                    <td>
                      <span className="rounded border px-2 py-0.5 text-xs">{p.status}</span>
                    </td>
                    <td className="px-3 text-neutral-500">{p.updatedAt?.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section>
          <h2 className="font-semibold">Review Queue</h2>
          {reviewQueue.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">Nothing awaiting review.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {reviewQueue.map((d) => (
                <li key={d.id} className="rounded border bg-white px-3 py-2">
                  <span className="font-medium">{d.name ?? d.designCode}</span>
                  <span className="text-neutral-500"> · {d.project.name}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
