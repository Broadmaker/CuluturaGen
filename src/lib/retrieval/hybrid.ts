import { and, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  culturalElementRelationships,
  culturalElements,
} from "@/lib/db/schema";
import { CultureService } from "@/server/services/culture/CultureService";

// Hybrid cultural retrieval (md/04 §72–74, md/05 §95–101).
//
// Three modes fused (md/04 §73):
//   Mode 1 — Exact/keyword: name/description substring (existing behavior).
//   Mode 2 — Ranked full-text: native tsvector + ts_rank_cd (md/03 §61).
//   Mode 3 — Graph: one-hop relationships + culture/community traversal.
//
// Dense vector search (pgvector) activates where the extension is installed
// (Supabase ships it built in; migration 0004 enables it, guarded so local
// Postgres without the binaries keeps working). The fusion scorer accepts an
// optional vector score per hit, so enabling embeddings later is additive
// (embedding column + provider), not a rewrite. Check availability at runtime
// with isPgVectorAvailable() — retrieval priority follows md/04 §74:
// VERIFIED first, then context match, then rank.

export type ElementRow = typeof culturalElements.$inferSelect;

export interface RetrievalFilters {
  category?: string;
  status?: string;
  verifiedOnly?: boolean;
  cultureId?: string;
}

export interface RankedElement {
  element: ElementRow;
  score: number;
  via: string[];
  textRank: number;
}

export interface VectorScores {
  [elementId: string]: number;
}

const STATUS_WEIGHT: Record<string, number> = {
  VERIFIED: 1.0,
  UNDER_REVIEW: 0.6,
  UNVERIFIED: 0.4,
  RESTRICTED: 0.3,
  DEPRECATED: 0.1,
};

export function statusWeight(status: string | null): number {
  if (!status) return 0.4;
  return STATUS_WEIGHT[status] ?? 0.4;
}

export interface FusionCandidate {
  element: ElementRow;
  textRank: number;
  exactName: boolean;
  keywordHit: boolean;
  vectorScore?: number;
}

// Pure fusion — unit-testable without a database.
export function fuseCandidates(
  q: string,
  candidates: FusionCandidate[],
  graphElementIds: Set<string>,
  graphRows: ElementRow[],
  limit: number,
): RankedElement[] {
  const seen = new Map<string, RankedElement>();

  for (const c of candidates) {
    const el = c.element;
    const via: string[] = [];
    if (c.exactName) via.push("exact-name");
    else if (c.keywordHit) via.push("keyword");
    if (c.textRank > 0) via.push("full-text");
    if (c.vectorScore !== undefined && c.vectorScore > 0) via.push("vector");
    if (via.length === 0) via.push("keyword");

    let score = c.textRank * 10 + (c.exactName ? 5 : c.keywordHit ? 1 : 0);
    if (c.vectorScore !== undefined) score += c.vectorScore * 10;
    score *= statusWeight(el.validationStatus);
    // Exact-name matches win regardless of status (§74 context match first).
    if (c.exactName) score += 100;

    const prev = seen.get(el.id);
    if (!prev || prev.score < score) {
      seen.set(el.id, { element: el, score, via, textRank: c.textRank });
    }
  }

  // Graph expansion: related elements the text modes missed (§56–57).
  for (const el of graphRows) {
    if (seen.has(el.id)) {
      seen.get(el.id)!.via.push("graph");
      continue;
    }
    if (!graphElementIds.has(el.id)) continue;
    seen.set(el.id, {
      element: el,
      score: 0.5 * statusWeight(el.validationStatus),
      via: ["graph"],
      textRank: 0,
    });
  }

  return Array.from(seen.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit));
}

function filterConditions(f: RetrievalFilters) {
  const cultureLinkedIds = f.cultureId
    ? CultureService.elementIdsForCulture(f.cultureId)
    : undefined;
  return [
    f.category ? eq(culturalElements.category, f.category) : undefined,
    f.verifiedOnly
      ? eq(culturalElements.validationStatus, "VERIFIED")
      : f.status
        ? eq(culturalElements.validationStatus, f.status)
        : undefined,
    cultureLinkedIds ? inArray(culturalElements.id, cultureLinkedIds) : undefined,
  ];
}

export async function hybridSearch(
  q: string,
  filters: RetrievalFilters = {},
  limit = 100,
  vectorScores: VectorScores = {},
): Promise<RankedElement[]> {
  const needle = `%${q}%`;
  const conds = filterConditions(filters);

  // Candidate selection runs as standalone SQL (real table names): a raw
  // fragment inside db.query.* would miss drizzle's relational alias.
  const matchConds = [
    sql`"search_vector" @@ plainto_tsquery('english', ${q})`,
    sql`"name" ILIKE ${needle}`,
    sql`"description" ILIKE ${needle}`,
  ];
  const scope = [
    filters.category ? sql`"category" = ${filters.category}` : undefined,
    filters.verifiedOnly
      ? sql`"validation_status" = 'VERIFIED'`
      : filters.status
        ? sql`"validation_status" = ${filters.status}`
        : undefined,
    filters.cultureId
      ? sql`"id" IN (SELECT "source_element_id" FROM "cultural_element_relationships" WHERE "culture_id" = ${filters.cultureId} OR "community_id" IN (SELECT "id" FROM "communities" WHERE "culture_id" = ${filters.cultureId}))`
      : undefined,
  ].filter((c): c is SQL => c !== undefined);
  const idRows = (await db.execute(sql`
    SELECT "id" FROM "cultural_elements"
    WHERE (${sql.join(matchConds, sql` OR `)})
    ${scope.length > 0 ? sql`AND (${sql.join(scope, sql` AND `)})` : sql``}
    LIMIT 200
  `)) as unknown as { rows: { id: string }[] };
  const ids = (idRows.rows ?? []).map((r) => r.id);
  if (ids.length === 0) return [];

  const candidates = await db.query.culturalElements.findMany({
    where: inArray(culturalElements.id, ids),
    limit: 200,
  });
  const rankRows = (await db.execute(sql`
    SELECT "id", ts_rank_cd("search_vector", plainto_tsquery('english', ${q})) AS "rank"
    FROM "cultural_elements" WHERE "id" IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})
  `)) as unknown as { rows: { id: string; rank: string }[] };
  const rankById = new Map<string, number>();
  for (const r of rankRows.rows ?? []) rankById.set(r.id, Number(r.rank));

  const lowered = q.trim().toLowerCase();
  const toCandidate = (el: ElementRow): FusionCandidate => ({
    element: el,
    textRank: rankById.get(el.id) ?? 0,
    exactName: el.name.trim().toLowerCase() === lowered,
    keywordHit: true,
    vectorScore: vectorScores[el.id],
  });
  const provisional = fuseCandidates(
    q,
    candidates.map(toCandidate),
    new Set(),
    [],
    candidates.length,
  );

  // Graph expansion around the top hits: both directions of element links.
  const topIds = provisional.slice(0, 20).map((h) => h.element.id);
  const links = await db.query.culturalElementRelationships.findMany({
    where: or(
      inArray(culturalElementRelationships.sourceElementId, topIds),
      inArray(culturalElementRelationships.targetElementId, topIds),
    ),
    columns: { sourceElementId: true, targetElementId: true },
    limit: 100,
  });
  const neighborIds = new Set<string>();
  for (const l of links) {
    if (l.sourceElementId && !topIds.includes(l.sourceElementId)) neighborIds.add(l.sourceElementId);
    if (l.targetElementId && !topIds.includes(l.targetElementId)) neighborIds.add(l.targetElementId);
  }
  let graphRows: ElementRow[] = [];
  if (neighborIds.size > 0) {
    graphRows = await db.query.culturalElements.findMany({
      where: and(inArray(culturalElements.id, Array.from(neighborIds)), ...conds),
      limit: 30,
    });
  }

  return fuseCandidates(
    q,
    candidates.map(toCandidate),
    neighborIds,
    graphRows,
    limit,
  );
}
