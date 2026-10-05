import Link from "next/link";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { materials } from "@/lib/db/schema";
import { MATERIAL_CATEGORIES } from "@/lib/cost/constants";
import NewMaterialForm from "@/components/materials/NewMaterialForm";
import StatusBadge from "@/components/status/StatusBadge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";

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
    <main className="mx-auto max-w-6xl space-y-4 p-6">
      <PageHeader
        eyebrow="Costing"
        title="Materials"
        description="Supplier prices feed the deterministic cost engine — append-only history."
      />
      <form method="get" className="flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={q ?? ""} placeholder="Search materials…" className="input w-auto" />
        <select name="category" defaultValue={category ?? ""} className="input w-auto">
          <option value="">All categories</option>
          {MATERIAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="sm">Search</Button>
      </form>

      {data.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">No materials yet — add the first below.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-card">
        <table className="w-full text-sm">
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
                  <StatusBadge value={m.availabilityStatus ?? "UNKNOWN"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-card">
        <h2 className="font-display text-lg text-ink-950">Add material</h2>
        <div className="mt-2">
        <NewMaterialForm />
        </div>
      </section>
    </main>
  );
}
