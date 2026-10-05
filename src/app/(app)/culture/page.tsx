import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { culturalElements, cultures } from "@/lib/db/schema";
import { ELEMENT_CATEGORIES, VALIDATION_STATUSES } from "@/lib/culture/constants";
import { CultureService } from "@/server/services/culture/CultureService";
import { hybridSearch, type RankedElement } from "@/lib/retrieval/hybrid";
import ElementCard from "@/components/culture/ElementCard";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";

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

  // Ranked hybrid retrieval when searching (md/04 §73); recency otherwise.
  let hits: RankedElement[];
  if (q?.trim()) {
    hits = await hybridSearch(
      q.trim(),
      {
        category: category || undefined,
        status: status || undefined,
        verifiedOnly: verifiedOnly === "1",
        cultureId: cultureId || undefined,
      },
      100,
    );
  } else {
    const cultureLinkedIds = cultureId
      ? CultureService.elementIdsForCulture(cultureId)
      : undefined;
    const rows = await db.query.culturalElements.findMany({
      where: and(
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
    hits = rows.map((element) => ({ element, score: 0, via: [], textRank: 0 }));
  }
  const elements = hits.map((h) => h.element);
  const matchById = new Map(hits.map((h) => [h.element.id, h]));

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-6">
      <PageHeader
        eyebrow="Research"
        title="Cultural Knowledge"
        description="Verified-first structured knowledge with sources and restrictions."
        actions={<Button href="/culture/new" variant="accent">+ New Element</Button>}
      />

      <form method="get" className="flex flex-wrap items-end gap-2 rounded-xl border border-stone-200 bg-white p-3 text-sm shadow-card">
        <div>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search knowledge (ranked)…"
            className="input"
          />
        </div>
        <select name="category" defaultValue={category ?? ""} className="input w-auto">
          <option value="">All categories</option>
          {ELEMENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select name="cultureId" defaultValue={cultureId ?? ""} className="input w-auto">
          <option value="">All cultures</option>
          {cultureList.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className="input w-auto">
          <option value="">Any status</option>
          {VALIDATION_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2">
          <input type="checkbox" name="verifiedOnly" value="1" defaultChecked={verifiedOnly === "1"} className="accent-brass-600" />
          Verified only
        </label>
        <Button type="submit" variant="secondary" size="sm">Search</Button>
      </form>

      {elements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center shadow-card">
          <p className="font-display text-xl text-ink-950">No results</p>
          <p className="mt-2 text-sm text-stone-600">
            Try different terms, or propose a new element for expert review.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {elements.map((e) => (
            <ElementCard key={e.id} element={e} match={matchById.get(e.id) ?? null} />
          ))}
        </div>
      )}
    </main>
  );
}
