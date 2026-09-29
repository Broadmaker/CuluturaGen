import Link from "next/link";
import { and, desc, eq, ilike, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";
import { PROJECT_STATUSES } from "@/server/services/design/ProjectService";

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
    <main className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link href="/projects/new" className="rounded bg-black px-4 py-2 text-sm text-white">
          + New Project
        </Link>
      </div>

      <form method="get" className="mt-4 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search projects…"
          className="rounded border px-3 py-1.5 text-sm"
        />
        <select name="status" defaultValue={status ?? ""} className="rounded border px-3 py-1.5 text-sm">
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded border px-3 py-1.5 text-sm">
          Filter
        </button>
      </form>

      {projectList.length === 0 ? (
        <div className="mt-8 rounded border p-8 text-center">
          <p className="font-medium">NO PROJECTS YET</p>
          <p className="mt-2 text-sm text-neutral-600">
            Create your first project to start the design workflow.
          </p>
          <Link href="/projects/new" className="mt-4 inline-block rounded bg-black px-4 py-2 text-sm text-white">
            Create Project
          </Link>
        </div>
      ) : (
        <table className="mt-4 w-full text-sm">
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
                  <span className="rounded border px-2 py-0.5 text-xs">{p.status}</span>
                </td>
                <td>{p.designCount}</td>
                <td className="text-neutral-500">{p.updatedAt?.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
