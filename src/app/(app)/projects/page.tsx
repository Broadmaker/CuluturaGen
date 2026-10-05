import Link from "next/link";
import { and, desc, eq, ilike, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";
import { PROJECT_STATUSES } from "@/server/services/design/ProjectService";
import StatusBadge from "@/components/status/StatusBadge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";

// md/08 §12 project list. Server-rendered; filters via search params.
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const { status, q } = searchParams;
  const rows = await db.query.projects.findMany({
    where: and(
      isNull(projects.deletedAt),
      status ? eq(projects.status, status) : undefined,
      q ? ilike(projects.name, `%${q}%`) : undefined,
    ),
    with: { designs: { columns: { id: true } } },
    orderBy: desc(projects.updatedAt),
    limit: 100,
  });
  const projectList = rows.map(({ designs, ...p }) => ({ ...p, designCount: designs.length }));

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-6">
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        description="One project per attire design task — research to final report."
        actions={<Button href="/projects/new" variant="accent">+ New Project</Button>}
      />

      <form method="get" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search projects…"
          className="input w-auto text-sm"
        />
        <select name="status" defaultValue={status ?? ""} className="input w-auto text-sm">
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
      </form>

      {projectList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center shadow-card">
          <p className="font-display text-xl text-ink-950">No projects yet</p>
          <p className="mt-2 text-sm text-stone-600">
            Create your first project to start the design workflow.
          </p>
          <Button href="/projects/new" variant="accent" size="sm" className="mt-4">
            Create Project
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-neutral-500">
              <th className="py-2">Project</th>
              <th>Code</th>
              <th>Status</th>
              <th>Designs</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {projectList.map((p) => (
              <tr key={p.id} className="border-b hover:bg-white">
                <td className="py-2 font-medium">
                  <Link href={`/projects/${p.id}`} className="underline">
                    {p.name}
                  </Link>
                </td>
                <td className="text-neutral-500">{p.projectCode}</td>
                <td>
                  <StatusBadge value={p.status} />
                </td>
                <td>{p.designCount}</td>
                <td className="text-neutral-500">{p.updatedAt?.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </main>
  );
}
