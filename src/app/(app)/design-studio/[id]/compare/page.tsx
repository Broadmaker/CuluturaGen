import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { designVersions, designs } from "@/lib/db/schema";
import { DesignService } from "@/server/services/design/DesignService";

// md/08 §53 version comparison: visual, requirements, culture, cost,
// materials, evaluation — without declaring a universal "best".
export default async function ComparePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { a?: string; b?: string };
}) {
  const [design] = await db.select().from(designs).where(eq(designs.id, params.id));
  if (!design) notFound();
  const versions = await db.query.designVersions.findMany({
    where: eq(designVersions.designId, params.id),
    orderBy: desc(designVersions.versionNumber),
    columns: { versionNumber: true },
  });
  if (versions.length < 2) {
    return (
      <main className="w-full p-6">
        <p className="text-sm font-medium text-ink-500">
          <Link href={`/design-studio/${params.id}`} className="text-ink-700 transition hover:text-brand-600">Back to studio</Link>
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink-950">Compare designs</h1>
        <p className="mt-2 text-sm text-ink-600">
          Generate at least two versions to compare them.
        </p>
      </main>
    );
  }

  const nums = versions.map((v) => v.versionNumber);
  const a = Number(searchParams.a) || Math.min(...nums);
  const b = Number(searchParams.b) || Math.max(...nums);
  const data = a === b ? null : await DesignService.compare(params.id, a, b);

  function picker(name: "a" | "b", current: number) {
    return (
      <select
        name={name}
        defaultValue={current}
        className="input w-auto text-sm"
        aria-label={`Version ${name}`}
      >
        {nums.map((n) => (
          <option key={n} value={n}>V{n}</option>
        ))}
      </select>
    );
  }

  return (
    <main className="w-full p-6">
      <p className="text-sm font-medium text-ink-500">
        <Link href={`/design-studio/${params.id}`} className="text-ink-700 transition hover:text-brand-600">Back to studio</Link>
      </p>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink-950">Compare designs</h1>

      {!data ? (
        <p className="mt-4 text-sm text-ink-600">
          Select two different versions to compare.
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-card">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left">Attribute</th>
              <th className="px-3 py-2 text-left">DESIGN V{data.a.version.versionNumber}</th>
              <th className="px-3 py-2 text-left">DESIGN V{data.b.version.versionNumber}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b align-top">
              <td className="px-3 py-2 text-ink-500">Visual</td>
              {[data.a, data.b].map((s) => (
                <td key={s.version.id} className="px-3 py-2">
                  {s.version.generatedImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.version.generatedImageUrl} alt={`V${s.version.versionNumber}`} className="max-h-64 rounded-lg border border-stone-200" />
                  ) : (
                    "—"
                  )}
                </td>
              ))}
            </tr>
            <tr className="border-b align-top">
              <td className="px-3 py-2 text-ink-500">Silhouette</td>
              {[data.a, data.b].map((s) => (
                <td key={s.version.id} className="px-3 py-2">{s.spec?.silhouette.type ?? "—"}</td>
              ))}
            </tr>
            <tr className="border-b align-top">
              <td className="px-3 py-2 text-ink-500">Cultural elements</td>
              {[data.a, data.b].map((s) => (
                <td key={s.version.id} className="px-3 py-2">
                  {s.elements.length === 0 ? "—" : (
                    <ul className="list-disc pl-4">
                      {s.elements.map((e) => (
                        <li key={e.id}>{e.name} <span className="text-xs text-ink-500">({e.status})</span></li>
                      ))}
                    </ul>
                  )}
                </td>
              ))}
            </tr>
            <tr className="border-b align-top">
              <td className="px-3 py-2 text-ink-500">Budget</td>
              {[data.a, data.b].map((s) => (
                <td key={s.version.id} className="px-3 py-2">
                  {s.cost ? (
                    <>₱{Number(s.cost.totalCost).toLocaleString()} <span className="text-xs text-ink-500">({s.cost.budgetStatus})</span></>
                  ) : (
                    "Not calculated"
                  )}
                </td>
              ))}
            </tr>
            <tr className="border-b align-top">
              <td className="px-3 py-2 text-ink-500">Evaluation</td>
              {[data.a, data.b].map((s) => (
                <td key={s.version.id} className="px-3 py-2">
                  {s.evaluation ? (
                    <>{s.evaluation.overallStatus?.replace(/_/g, " ")} <span className="text-xs text-ink-500">({s.openFindings} open, {s.critical} critical)</span></>
                  ) : (
                    "Not evaluated"
                  )}
                </td>
              ))}
            </tr>
            <tr className="align-top">
              <td className="px-3 py-2 text-ink-500">Explanation</td>
              {[data.a, data.b].map((s) => (
                <td key={s.version.id} className="px-3 py-2 text-ink-600">
                  {s.spec?.aiExplanation.summary || "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        </div>
        </div>
      )}

      <form method="get" className="mt-4 flex items-center gap-2 text-sm">
        <span>Compare</span>
        {picker("a", a)}
        <span>vs</span>
        {picker("b", b)}
        <button type="submit" className="rounded-full bg-ink-50 px-3 py-1.5 font-medium text-ink-700 ring-1 ring-inset ring-ink-100 transition hover:text-brand-600">Compare</button>
      </form>
    </main>
  );
}
