import Link from "next/link";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { materials } from "@/lib/db/schema";
import { MATERIAL_CATEGORIES } from "@/lib/cost/constants";
import NewMaterialForm from "@/components/materials/NewMaterialForm";

// md/08 §33 material library.
export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  const { q, category } = searchParams;
  const rows = await db.query.materials.findMany({
    where: and(
      q ? or(ilike(materials.name, `%${q}%`), ilike(materials.description, `%${q}%`)) : undefined,
      category ? eq(materials.category, category) : undefined,
    ),
    orderBy: desc(materials.updatedAt),
    limit: 100,
    with: { prices: true },
  });
  const data = rows.map((m) => ({
    ...m,
    latestPrice: [...m.prices].sort(
      (a, b) => +new Date(b.effectiveDate ?? b.createdAt ?? 0) - +new Date(a.effectiveDate ?? a.createdAt ?? 0),
    )[0] ?? null,
  }));

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">Materials</h1>
      <form method="get" className="mt-4 flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={q ?? ""} placeholder="Search materials…" className="rounded border px-3 py-1.5" />
        <select name="category" defaultValue={category ?? ""} className="rounded border px-3 py-1.5">
          <option value="">All categories</option>
          {MATERIAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button type="submit" className="rounded border px-3 py-1.5">Search</button>
      </form>

      {data.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">No materials yet — add the first below.</p>
      ) : (
        <table className="mt-4 w-full rounded border bg-white text-sm">
          <thead>
            <tr className="border-b text-left text-neutral-500">
              <th className="px-3 py-2">Material</th>
              <th>Category</th>
              <th>Price</th>
              <th>Availability</th>
            </tr>
          </thead>
          <tbody>
            {data.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="px-3 py-2 font-medium">
                  <Link href={`/materials/${m.id}`} className="underline">{m.name}</Link>
                  <span className="ml-2 font-mono text-xs text-neutral-400">{m.materialCode}</span>
                </td>
                <td>{m.category ?? "—"}</td>
                <td>
                  {m.latestPrice
                    ? `${m.latestPrice.currency ?? "PHP"} ${Number(m.latestPrice.price).toLocaleString()}/${m.latestPrice.unit ?? m.unit ?? "unit"}`
                    : <span className="text-amber-700">⚠ no price</span>}
                </td>
                <td>
                  <span className="rounded border px-2 py-0.5 text-xs">{m.availabilityStatus ?? "UNKNOWN"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <section className="mt-8 rounded border bg-white p-4">
        <h2 className="font-semibold">Add material</h2>
        <NewMaterialForm />
      </section>
    </main>
  );
}
