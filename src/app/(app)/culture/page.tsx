import Link from "next/link";
import { and, asc, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { culturalElements, cultures } from "@/lib/db/schema";
import { ELEMENT_CATEGORIES, VALIDATION_STATUSES } from "@/lib/culture/constants";
import { CultureService } from "@/server/services/culture/CultureService";
import ElementCard from "@/components/culture/ElementCard";

// md/08 §17–18 research workspace: search + filters.
export default async function CulturePage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; status?: string; cultureId?: string; verifiedOnly?: string };
}) {
  const { q, category, status, cultureId, verifiedOnly } = searchParams;

  const cultureList = await db.query.cultures.findMany({
    orderBy: asc(cultures.name),
    columns: { id: true, name: true },
  });

  const cultureLinkedIds = cultureId
    ? CultureService.elementIdsForCulture(cultureId)
    : undefined;

  const elements = await db.query.culturalElements.findMany({
    where: and(
      q
        ? or(
            ilike(culturalElements.name, `%${q}%`),
            ilike(culturalElements.description, `%${q}%`),
          )
        : undefined,
      category ? eq(culturalElements.category, category) : undefined,
      verifiedOnly === "1"
        ? eq(culturalElements.validationStatus, "VERIFIED")
        : status
          ? eq(culturalElements.validationStatus, status)
          : undefined,
      cultureLinkedIds ? inArray(culturalElements.id, cultureLinkedIds) : undefined,
    ),
    orderBy: desc(culturalElements.updatedAt),
    limit: 100,
  });

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cultural Knowledge</h1>
        <Link href="/culture/new" className="rounded bg-black px-4 py-2 text-sm text-white">
          + New Element
        </Link>
      </div>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-2 text-sm">
        <div>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search name or description…"
            className="rounded border px-3 py-1.5"
          />
        </div>
        <select name="category" defaultValue={category ?? ""} className="rounded border px-3 py-1.5">
          <option value="">All categories</option>
          {ELEMENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select name="cultureId" defaultValue={cultureId ?? ""} className="rounded border px-3 py-1.5">
          <option value="">All cultures</option>
          {cultureList.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className="rounded border px-3 py-1.5">
          <option value="">Any status</option>
          {VALIDATION_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <label className="flex items-center gap-1 rounded border px-3 py-1.5">
          <input type="checkbox" name="verifiedOnly" value="1" defaultChecked={verifiedOnly === "1"} />
          Verified only
        </label>
        <button type="submit" className="rounded border px-3 py-1.5">Search</button>
      </form>

      {elements.length === 0 ? (
        <div className="mt-8 rounded border bg-white p-8 text-center">
          <p className="font-medium">NO RESULTS</p>
          <p className="mt-2 text-sm text-neutral-600">
            Try different terms, or propose a new element for expert review.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {elements.map((e) => (
            <ElementCard key={e.id} element={e} />
          ))}
        </div>
      )}
    </main>
  );
}
