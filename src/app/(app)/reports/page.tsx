import Link from "next/link";
import { count, countDistinct, desc, eq, gte, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { reports } from "@/lib/db/schema";
import { REPORT_TYPES } from "@/lib/reports/constants";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import StatCard from "@/components/dashboard/StatCard";
import Pagination, { PAGE_SIZE } from "@/components/ui/Pagination";

// md/08 §62 report library. Generation happens per project / per design.
const TYPE_META: Record<string, { label: string; dot: string; chip: string }> = {
  DESIGN_REPORT: { label: "Design", dot: "bg-brand-500", chip: "bg-brand-50 text-brand-700 ring-brand-200" },
  CULTURAL_REPORT: { label: "Cultural", dot: "bg-emerald-600", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  COST_REPORT: { label: "Cost", dot: "bg-blue-600", chip: "bg-blue-50 text-blue-700 ring-blue-200" },
  EVALUATION_REPORT: { label: "Evaluation", dot: "bg-amber-600", chip: "bg-amber-50 text-amber-700 ring-amber-200" },
  FINAL_REPORT: { label: "Final", dot: "bg-ink-900", chip: "bg-ink-50 text-ink-800 ring-ink-100" },
};

function typeMeta(type: string | null | undefined) {
  const key = type ?? "";
  return (
    TYPE_META[key] ?? {
      label: type?.replace(/_/g, " ") ?? "Report",
      dot: "bg-ink-400",
      chip: "bg-ink-50 text-ink-700 ring-ink-100",
    }
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { type?: string; page?: string };
}) {
  const type = searchParams.type;
  const page = Math.max(1, Number(searchParams.page) || 1);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const where = type ? eq(reports.reportType, type) : undefined;

  const [[{ value: totalAll }], [{ value: thisMonth }], [{ value: withFile }], [{ value: projects }], [{ value: total }]] =
    await Promise.all([
      db.select({ value: count() }).from(reports),
      db.select({ value: count() }).from(reports).where(gte(reports.generatedAt, monthStart)),
      db.select({ value: count() }).from(reports).where(isNotNull(reports.fileUrl)),
      db.select({ value: countDistinct(reports.projectId) }).from(reports),
      db.select({ value: count() }).from(reports).where(where),
    ]);

  const rows = await db.query.reports.findMany({
    where,
    orderBy: desc(reports.generatedAt),
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    with: { project: { columns: { id: true, name: true } } },
  });

  return (
    <main className="w-full space-y-6 p-6">
      <PageHeader
        eyebrow="Deliverables"
        title="Reports"
        description="Every generated PDF, its project and provenance. Reports are produced per project or per design."
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Total Reports" value={totalAll} caption={`${withFile} ready to download`} icon="reports" tone="brass" />
        <StatCard label="This Month" value={thisMonth} caption="Generated since the 1st" icon="evaluations" tone="green" />
        <StatCard label="Projects Covered" value={projects} caption="With at least one report" icon="projects" tone="ink" />
        <StatCard label="Downloadable" value={withFile} caption="PDF files available" icon="reports" tone="ink" />
      </div>

      <form
        method="get"
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200/80 bg-white p-3 shadow-card"
      >
        <select name="type" defaultValue={type ?? ""} className="input w-auto">
          <option value="">All report types</option>
          {REPORT_TYPES.map((t) => (
            <option key={t} value={t}>
              {typeMeta(t).label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="sm">Filter</Button>
        {type && <Button href="/reports" variant="ghost" size="sm">Clear</Button>}
      </form>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-card">
          <p className="font-display text-xl font-bold text-ink-950">
            {type ? "No matching reports" : "No reports yet"}
          </p>
          <p className="mt-2 text-sm text-ink-500">
            {type
              ? "Try a different report type or clear the filter."
              : "Generate a report from a project page or from the design studio."}
          </p>
          {!type && (
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
                  <th>Report</th>
                  <th>Project</th>
                  <th>Generated</th>
                  <th className="text-right">File</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const meta = typeMeta(r.reportType);
                  return (
                    <tr key={r.id}>
                      <td>
                        <span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.chip}`}>
                          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/projects/${r.project.id}`}
                          className="font-medium text-ink-800 underline-offset-2 hover:text-brand-600 hover:underline"
                        >
                          {r.project.name}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap text-ink-500">
                        {r.generatedAt?.toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="text-right">
                        {r.fileUrl ? (
                          <a
                            href={r.fileUrl}
                            download
                            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                          >
                            Download PDF
                          </a>
                        ) : (
                          <span className="text-xs text-ink-500">Not available</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            total={total}
            basePath="/reports"
            query={{ type }}
          />
        </div>
      )}
    </main>
  );
}
