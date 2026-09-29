import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { reports } from "@/lib/db/schema";

// md/08 §62 report library. Generation happens per project / per design.
export default async function ReportsPage() {
  const rows = await db.query.reports.findMany({
    orderBy: desc(reports.generatedAt),
    limit: 100,
    with: { project: { columns: { id: true, name: true } } },
  });
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      {rows.length === 0 ? (
        <div className="mt-8 rounded border bg-white p-8 text-center">
          <p className="font-medium">NO REPORTS YET</p>
          <p className="mt-2 text-sm text-neutral-600">
            Generate a report from a project page or from the design studio.
          </p>
        </div>
      ) : (
        <table className="mt-4 w-full rounded border bg-white text-sm">
          <thead>
            <tr className="border-b text-left text-neutral-500">
              <th className="px-3 py-2">Report</th>
              <th>Project</th>
              <th>Generated</th>
              <th className="px-3">File</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="px-3 py-2 font-medium">{r.reportType?.replace(/_/g, " ")}</td>
                <td>
                  <a href={`/projects/${r.project.id}`} className="underline">
                    {r.project.name}
                  </a>
                </td>
                <td className="text-neutral-500">{r.generatedAt?.toLocaleString()}</td>
                <td className="px-3">
                  {r.fileUrl ? (
                    <a href={r.fileUrl} className="underline" download>
                      Download PDF
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
