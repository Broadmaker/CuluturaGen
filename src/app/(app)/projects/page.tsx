import Link from "next/link";
import { and, count, desc, eq, ilike, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";
import { PROJECT_STATUSES } from "@/server/services/design/ProjectService";
import StatusBadge from "@/components/status/StatusBadge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import Pagination, { PAGE_SIZE } from "@/components/ui/Pagination";
import { NavIcons } from "@/components/layout/icons";

// md/08 §12 project list. Server-rendered; filters via search params.
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; page?: string };
}) {
  const { status, q } = searchParams;
  const page = Math.max(1, Number(searchParams.page) || 1);

  const where = and(
    isNull(projects.deletedAt),
    status ? eq(projects.status, status) : undefined,
    q ? ilike(projects.name, `%${q}%`) : undefined,
  );
  const [{ value: total }] = await db.select({ value: count() }).from(projects).where(where);
  const rows = await db.query.projects.findMany({
    where,
    with: { designs: { columns: { id: true } } },
    orderBy: desc(projects.updatedAt),
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const projectList = rows.map(({ designs, ...p }) => ({ ...p, designCount: designs.length }));
  const filtered = Boolean(status || q);

  return (
    <main className="w-full space-y-6 p-6">
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        description="One project per attire design task — research to final report."
        actions={
          <Button href="/projects/new" variant="accent">
            <span aria-hidden="true">{NavIcons.plus}</span> New Project
          </Button>
        }
      />

      <form
        method="get"
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200/80 bg-white p-3 shadow-card"
      >
        <div className="relative min-w-56 flex-1">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
          >
            {NavIcons.search}
          </span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search projects…"
            className="input pl-10"
          />
        </div>
        <select name="status" defaultValue={status ?? ""} className="input w-auto">
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="sm">Filter</Button>
        {filtered && (
          <Button href="/projects" variant="ghost" size="sm">Clear</Button>
        )}
      </form>

      {projectList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-card">
          <p className="font-display text-xl font-bold text-ink-950">
            {filtered ? "No matching projects" : "No projects yet"}
          </p>
          <p className="mt-2 text-sm text-ink-500">
            {filtered
              ? "Try a different search or clear the filters."
              : "Create your first project to start the design workflow."}
          </p>
          {!filtered && (
            <Button href="/projects/new" variant="accent" size="sm" className="mt-4">
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th>Project</th>
                  <th>Status</th>
                  <th>Designs</th>
                  <th>Updated</th>
                  <th className="text-right">Open</th>
                </tr>
              </thead>
              <tbody>
                {projectList.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        href={`/projects/${p.id}`}
                        className="font-medium text-ink-800 underline-offset-2 hover:text-brand-600 hover:underline"
                      >
                        {p.name}
                      </Link>
                      <p className="mt-0.5 font-mono text-xs text-ink-400">{p.projectCode}</p>
                    </td>
                    <td>
                      <StatusBadge value={p.status} />
                    </td>
                    <td className="tabular-nums text-ink-700">{p.designCount}</td>
                    <td className="whitespace-nowrap text-ink-500">
                      {p.updatedAt?.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/projects/${p.id}`}
                        aria-label={`Open ${p.name}`}
                        className="inline-flex rounded-lg border border-stone-200 bg-white p-1.5 text-ink-500 shadow-sm transition-colors hover:border-brand-200 hover:text-brand-600"
                      >
                        {NavIcons.arrowRight}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            total={total}
            basePath="/projects"
            query={{ q, status }}
          />
        </div>
      )}
    </main>
  );
}
