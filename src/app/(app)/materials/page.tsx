import Link from "next/link";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { materials } from "@/lib/db/schema";
import { MATERIAL_CATEGORIES } from "@/lib/cost/constants";
import AddMaterialModal from "@/components/materials/AddMaterialModal";
import StatusBadge from "@/components/status/StatusBadge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import Pagination, { PAGE_SIZE } from "@/components/ui/Pagination";

// md/08 §33 material library.
export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; page?: string };
}) {
  const { q, category } = searchParams;
  const page = Math.max(1, Number(searchParams.page) || 1);

  const where = and(
    q ? or(ilike(materials.name, `%${q}%`), ilike(materials.description, `%${q}%`)) : undefined,
    category ? eq(materials.category, category) : undefined,
  );

  const [{ value: total }] = await db.select({ value: count() }).from(materials).where(where);
  const rows = await db.query.materials.findMany({
    where,
    orderBy: desc(materials.updatedAt),
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    with: { prices: true },
  });
  const data = rows.map((m) => ({
    ...m,
    latestPrice: [...m.prices].sort(
      (a, b) => +new Date(b.effectiveDate ?? b.createdAt ?? 0) - +new Date(a.effectiveDate ?? a.createdAt ?? 0),
    )[0] ?? null,
  }));

  return (
    <main className="w-full space-y-4 p-6">
      <PageHeader
        eyebrow="Costing"
        title="Materials"
        description="Supplier prices feed the deterministic cost engine — append-only history."
        actions={<AddMaterialModal />}
      />

      <form
        method="get"
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200/80 bg-white p-3 shadow-card"
      >
        <input name="q" defaultValue={q ?? ""} placeholder="Search materials…" className="input w-auto" />
        <select name="category" defaultValue={category ?? ""} className="input w-auto">
          <option value="">All categories</option>
          {MATERIAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="sm">Filter</Button>
        {(q || category) && (
          <Button href="/materials" variant="ghost" size="sm">Clear</Button>
        )}
      </form>

      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-card">
          <p className="font-display text-xl font-bold text-ink-950">No materials found</p>
          <p className="mt-2 text-sm text-ink-500">
            {q || category
              ? "Try a different search or clear the filters."
              : "Add the first material from the button above."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-3 py-2">Material</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Availability</th>
                </tr>
              </thead>
              <tbody>
                {data.map((m) => (
                  <tr key={m.id} className="border-t border-stone-100">
                    <td className="px-3 py-2.5 font-medium">
                      <Link href={`/materials/${m.id}`} className="font-medium text-ink-800 underline-offset-2 hover:text-brand-600 hover:underline">{m.name}</Link>
                      <span className="ml-2 font-mono text-xs text-ink-400">{m.materialCode}</span>
                    </td>
                    <td className="px-3 py-2.5">{m.category ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      {m.latestPrice
                        ? `${m.latestPrice.currency ?? "PHP"} ${Number(m.latestPrice.price).toLocaleString()}/${m.latestPrice.unit ?? m.unit ?? "unit"}`
                        : <span className="text-amber-700">⚠ no price</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge value={m.availabilityStatus ?? "UNKNOWN"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            total={total}
            basePath="/materials"
            query={{ q, category }}
          />
        </div>
      )}
    </main>
  );
}
