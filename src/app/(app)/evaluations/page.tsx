import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { evaluations } from "@/lib/db/schema";
import StatusBadge from "@/components/status/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Pagination, { PAGE_SIZE } from "@/components/ui/Pagination";

// Overall statuses the evaluation engine can persist (md/07).
const OVERALL_OPTIONS = [
  { value: "PASSED_WITHOUT_CRITICAL_ISSUES", label: "Passed" },
  { value: "REVIEW_REQUIRED", label: "Review required" },
];

// Cross-design evaluation history. Snapshots are immutable; each run adds a row.
export default async function EvaluationsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  const status = searchParams.status;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const where = status ? eq(evaluations.overallStatus, status) : undefined;

  const [{ value: total }] = await db.select({ value: count() }).from(evaluations).where(where);
  const rows = await db.query.evaluations.findMany({
    where,
    orderBy: desc(evaluations.createdAt),
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const versionIds = Array.from(new Set(rows.map((r) => r.designVersionId)));
  const versionRows =
    versionIds.length > 0
      ? await db.query.designVersions.findMany({
          where: (v, { inArray }) => inArray(v.id, versionIds),
          columns: { id: true, versionNumber: true, designId: true },
        })
      : [];
  const vMap = new Map(versionRows.map((v) => [v.id, v]));
  const designList =
    vMap.size > 0
      ? await db.query.designs.findMany({
          where: (d, { inArray }) =>
            inArray(
              d.id,
              Array.from(new Set(Array.from(vMap.values()).map((v) => v.designId))),
            ),
          columns: { id: true, name: true, designCode: true, projectId: true },
        })
      : [];
  const dMap = new Map(designList.map((d) => [d.id, d]));

  return (
    <main className="w-full space-y-4 p-6">
      <PageHeader
        eyebrow="Quality gates"
        title="Evaluations"
        description="Immutable snapshots — every run is preserved with its evidence."
      />

      <form
        method="get"
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200/80 bg-white p-3 shadow-card"
      >
        <select name="status" defaultValue={status ?? ""} className="input w-auto">
          <option value="">All outcomes</option>
          {OVERALL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="sm">Filter</Button>
        {status && <Button href="/evaluations" variant="ghost" size="sm">Clear</Button>}
      </form>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-card">
          <p className="font-display text-xl font-bold text-ink-950">
            {status ? "No matching evaluations" : "No evaluations yet"}
          </p>
          <p className="mt-2 text-sm text-ink-500">
            {status
              ? "Try a different outcome or clear the filter."
              : "Run one from any design in the studio."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-3 py-2">Design</th>
                  <th className="px-3 py-2">Version</th>
                  <th className="px-3 py-2">Overall</th>
                  <th className="px-3 py-2">Culture</th>
                  <th className="px-3 py-2">Reqs</th>
                  <th className="px-3 py-2">Cost</th>
                  <th className="px-3 py-2">Evaluated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const v = vMap.get(e.designVersionId);
                  const d = v ? dMap.get(v.designId) : undefined;
                  return (
                    <tr key={e.id} className="border-t border-stone-100">
                      <td className="px-3 py-2">
                        {d ? (
                          <Link href={`/design-studio/${d.id}?v=${v?.versionNumber}`} className="font-medium text-ink-800 underline-offset-2 hover:text-brand-600 hover:underline">
                            {d.name ?? d.designCode}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2 text-ink-700">V{v?.versionNumber ?? "—"}</td>
                      <td className="px-3 py-2">
                        <StatusBadge value={e.overallStatus} />
                      </td>
                      <td className="px-3 py-2 text-xs text-ink-600">{e.culturalStatus?.replace(/_/g, " ")}</td>
                      <td className="px-3 py-2 text-xs text-ink-600">{e.requirementStatus?.replace(/_/g, " ")}</td>
                      <td className="px-3 py-2 text-xs text-ink-600">{e.costStatus?.replace(/_/g, " ")}</td>
                      <td className="px-3 py-2 text-ink-500">
                        {e.createdAt?.toLocaleString()}
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
            basePath="/evaluations"
            query={{ status }}
          />
        </div>
      )}
    </main>
  );
}
