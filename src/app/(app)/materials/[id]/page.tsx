import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { materialPrices, materials } from "@/lib/db/schema";
import AddPriceForm from "@/components/materials/AddPriceForm";

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
    <main className="mx-auto max-w-6xl p-6">
      <p className="text-sm text-neutral-500">
        <a href="/materials" className="underline">Materials</a> / {material.materialCode}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{material.name}</h1>
        <span className="rounded border bg-white px-2 py-0.5 text-xs">{material.category ?? "—"}</span>
        <span className="rounded border bg-white px-2 py-0.5 text-xs">{material.availabilityStatus ?? "UNKNOWN"}</span>
      </div>
      {material.description && <p className="mt-2 max-w-2xl text-neutral-600">{material.description}</p>}

      <dl className="mt-4 grid max-w-2xl grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between border-b py-1"><dt className="text-neutral-500">Unit</dt><dd>{material.unit ?? "—"}</dd></div>
        <div className="flex justify-between border-b py-1"><dt className="text-neutral-500">Supplier</dt><dd>{material.supplier ?? "—"}</dd></div>
        <div className="flex justify-between border-b py-1"><dt className="text-neutral-500">Cultural association</dt><dd>{material.culturalAssociation ?? "—"}</dd></div>
        <div className="flex justify-between border-b py-1"><dt className="text-neutral-500">Minimum qty</dt><dd>{material.minimumQuantity ?? "—"}</dd></div>
      </dl>

      <section className="mt-6 rounded border bg-white p-4">
        <h2 className="font-semibold">Price history</h2>
        {prices.length === 0 ? (
          <p className="mt-2 text-sm text-amber-700">⚠ No verified price — designs using this material will report INCOMPLETE.</p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b text-left text-neutral-500">
                <th className="py-1">Effective</th>
                <th>Price</th>
                <th>Supplier</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-1">{p.effectiveDate?.toLocaleDateString() ?? "—"}</td>
                  <td>{p.currency} {Number(p.price).toLocaleString()}/{p.unit ?? "unit"}</td>
                  <td>{p.supplier ?? "—"}</td>
                  <td><span className="rounded border px-1.5 py-0.5 text-xs">{p.source ?? "—"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <AddPriceForm materialId={material.id} unit={material.unit} />
      </section>
    </main>
  );
}
