import Link from "next/link";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { designs } from "@/lib/db/schema";
import { DESIGN_STATUSES } from "@/server/services/design/DesignService";
import StatusBadge from "@/components/status/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Pagination, { PAGE_SIZE } from "@/components/ui/Pagination";
import { NavIcons } from "@/components/layout/icons";

// MVP 1: design index backing the Design Studio nav entry.
// Full 3-panel workspace arrives in MVP 7 (md/08 §36).
export default async function DesignStudioIndexPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; page?: string };
}) {
  const { status, q } = searchParams;
  const page = Math.max(1, Number(searchParams.page) || 1);

  const where = and(
    status ? eq(designs.status, status) : undefined,
    q ? or(ilike(designs.name, `%${q}%`), ilike(designs.designCode, `%${q}%`)) : undefined,
  );

  const [{ value: total }] = await db.select({ value: count() }).from(designs).where(where);
  const designList = await db.query.designs.findMany({
    where,
    orderBy: desc(designs.updatedAt),
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    with: { project: { columns: { name: true } } },
  });
  const filtered = Boolean(status || q);

  return (
    <main className="w-full space-y-6 p-6">
      <PageHeader
        eyebrow="Studio"
        title="Design Studio"
        description="Every generated concept, its project, stage and current version."
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
          <input name="q" defaultValue={q ?? ""} placeholder="Search designs…" className="input pl-10" />
        </div>
        <select name="status" defaultValue={status ?? ""} className="input w-auto">
          <option value="">All statuses</option>
          {DESIGN_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="sm">Filter</Button>
        {filtered && <Button href="/design-studio" variant="ghost" size="sm">Clear</Button>}
      </form>

      {designList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-card">
          <p className="font-display text-xl font-bold text-ink-950">
            {filtered ? "No matching designs" : "No designs yet"}
          </p>
          <p className="mt-2 text-sm text-ink-500">
            {filtered
              ? "Try a different search or clear the filters."
              : "Designs are generated from a project once the brief, basket and body profile are ready."}
          </p>
          {!filtered && (
            <Link
              href="/projects"
              className="mt-4 inline-flex rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition-colors hover:bg-brand-600"
            >
              Go to Projects
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th>Design</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th>Updated</th>
                  <th className="text-right">Open</th>
                </tr>
              </thead>
              <tbody>
                {designList.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <Link
                        href={`/design-studio/${d.id}`}
                        className="font-medium text-ink-800 underline-offset-2 hover:text-brand-600 hover:underline"
                      >
                        {d.name ?? d.designCode}
                      </Link>
                    </td>
                    <td className="text-ink-500">{d.project.name}</td>
                    <td>
                      <StatusBadge value={d.status} />
                    </td>
                    <td className="text-ink-500">v{d.currentVersion}</td>
                    <td className="whitespace-nowrap text-ink-500">
                      {d.updatedAt?.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/design-studio/${d.id}`}
                        aria-label={`Open ${d.name ?? d.designCode}`}
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
            basePath="/design-studio"
            query={{ q, status }}
          />
        </div>
      )}
    </main>
  );
}
