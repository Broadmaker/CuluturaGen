import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { evaluations } from "@/lib/db/schema";
import StatusBadge from "@/components/status/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";

// Cross-design evaluation history. Snapshots are immutable; each run adds a row.
export default async function EvaluationsPage() {
  const rows = await db.query.evaluations.findMany({
    orderBy: desc(evaluations.createdAt),
    limit: 50,
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
    <main className="mx-auto max-w-6xl space-y-4 p-6">
      <PageHeader
        eyebrow="Quality gates"
        title="Evaluations"
        description="Immutable snapshots — every run is preserved with its evidence."
      />
      {rows.length === 0 ? (
        <p className="text-sm text-stone-500">
          No evaluations yet — run one from any design in the studio.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-neutral-500">
              <th className="px-3 py-2">Design</th>
              <th>Version</th>
              <th>Overall</th>
              <th>Culture</th>
              <th>Reqs</th>
              <th>Cost</th>
              <th className="px-3">Evaluated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const v = vMap.get(e.designVersionId);
              const d = v ? dMap.get(v.designId) : undefined;
              return (
                <tr key={e.id} className="border-b">
                  <td className="px-3 py-2">
                    {d ? (
                      <Link href={`/design-studio/${d.id}?v=${v?.versionNumber}`} className="underline">
                        {d.name ?? d.designCode}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>V{v?.versionNumber ?? "—"}</td>
                  <td>
                    <StatusBadge value={e.overallStatus} />
                  </td>
                  <td className="text-xs">{e.culturalStatus?.replace(/_/g, " ")}</td>
                  <td className="text-xs">{e.requirementStatus?.replace(/_/g, " ")}</td>
                  <td className="text-xs">{e.costStatus?.replace(/_/g, " ")}</td>
                  <td className="px-3 text-neutral-500">
                    {e.createdAt?.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
    </main>
  );
}
