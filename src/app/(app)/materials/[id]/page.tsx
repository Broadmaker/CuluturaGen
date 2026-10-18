import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { materialPrices, materials } from "@/lib/db/schema";
import AddPriceForm from "@/components/materials/AddPriceForm";
import StatusBadge from "@/components/status/StatusBadge";

// md/08 §34–35 material detail + price history.
export default async function MaterialDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const material = await db.query.materials.findFirst({
    where: eq(materials.id, params.id),
  });
  if (!material) notFound();
  const prices = await db.query.materialPrices.findMany({
    where: eq(materialPrices.materialId, params.id),
    orderBy: desc(materialPrices.effectiveDate),
  });

  return (
    <main className="w-full p-6">
      <p className="text-sm font-medium text-ink-500">
        <a href="/materials" className="text-ink-700 transition hover:text-brand-600">Materials</a>
        <span className="mx-1.5 text-ink-300">/</span> {material.materialCode}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink-950">{material.name}</h1>
        <span className="rounded-full bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink-700 ring-1 ring-inset ring-ink-100">{material.category ?? "—"}</span>
        <StatusBadge value={material.availabilityStatus ?? "UNKNOWN"} />
      </div>
      {material.description && <p className="mt-2 max-w-2xl text-sm text-ink-600">{material.description}</p>}

      <dl className="mt-6 grid max-w-3xl grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200/80 bg-white px-4 py-3 shadow-card">
          <dt className="text-xs font-semibold uppercase tracking-widest text-ink-400">Unit</dt>
          <dd className="mt-1 text-ink-900">{material.unit ?? "—"}</dd>
        </div>
        <div className="rounded-xl border border-stone-200/80 bg-white px-4 py-3 shadow-card">
          <dt className="text-xs font-semibold uppercase tracking-widest text-ink-400">Supplier</dt>
          <dd className="mt-1 text-ink-900">{material.supplier ?? "—"}</dd>
        </div>
        <div className="rounded-xl border border-stone-200/80 bg-white px-4 py-3 shadow-card">
          <dt className="text-xs font-semibold uppercase tracking-widest text-ink-400">Cultural association</dt>
          <dd className="mt-1 text-ink-900">{material.culturalAssociation ?? "—"}</dd>
        </div>
        <div className="rounded-xl border border-stone-200/80 bg-white px-4 py-3 shadow-card">
          <dt className="text-xs font-semibold uppercase tracking-widest text-ink-400">Minimum qty</dt>
          <dd className="mt-1 text-ink-900">{material.minimumQuantity ?? "—"}</dd>
        </div>
      </dl>

      <section className="mt-6 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card">
        <h2 className="font-display text-lg font-bold text-ink-950">Price history</h2>
        {prices.length === 0 ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">⚠ No verified price — designs using this material will report INCOMPLETE.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-stone-200/80">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-3 py-2">Effective</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Supplier</th>
                  <th className="px-3 py-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((p) => (
                  <tr key={p.id} className="border-t border-stone-100">
                    <td className="px-3 py-2 text-ink-700">{p.effectiveDate?.toLocaleDateString() ?? "—"}</td>
                    <td className="px-3 py-2 font-medium text-ink-900">{p.currency} {Number(p.price).toLocaleString()}/{p.unit ?? "unit"}</td>
                    <td className="px-3 py-2 text-ink-700">{p.supplier ?? "—"}</td>
                    <td className="px-3 py-2"><span className="rounded-full bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink-700 ring-1 ring-inset ring-ink-100">{p.source ?? "—"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4">
          <AddPriceForm materialId={material.id} unit={material.unit} />
        </div>
      </section>
    </main>
  );
}
