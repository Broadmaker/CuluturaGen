import { inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { culturalElements } from "@/lib/db/schema";

// AI output validation — md/05 §33-39: Schema → Business → Cultural →
// Requirement → Cost/Body. The zod schema (Stage 1) proves *shape*; this
// module proves *reference*: every cultural element ID the model emitted
// must resolve to a real record, and its status/restrictions/sources are
// reported so nothing unverified slips silently into the design graph.
// Unknown IDs (§32) are dropped by the caller, never linked (a blind insert
// would either FK-violate or launder an invented fact as knowledge).

export type ElementVerdict =
  | "OK"
  | "UNKNOWN"
  | "RESTRICTED"
  | "DEPRECATED"
  | "UNVERIFIED"
  | "UNSOURCED";

export interface ElementInventory {
  id: string;
  name: string;
  validationStatus: string | null;
  sources: string[];
  restrictionCount: number;
}

export interface ElementAssessment {
  elementId: string;
  verdict: ElementVerdict;
  record: ElementInventory | null;
}

// Pure classifier — unit-tested; the DB lookup below only builds inventory.
export function classifyElement(rec: ElementInventory | null): ElementVerdict {
  if (!rec) return "UNKNOWN";
  const st = (rec.validationStatus ?? "UNVERIFIED").toUpperCase();
  if (st === "RESTRICTED") return "RESTRICTED";
  if (st === "DEPRECATED") return "DEPRECATED";
  if (st === "UNVERIFIED" || st === "UNDER_REVIEW") return "UNVERIFIED";
  if (rec.sources.length === 0) return "UNSOURCED";
  return "OK";
}

export function assessElements(
  elementIds: string[],
  inventory: Map<string, ElementInventory>,
): ElementAssessment[] {
  const seen = new Set<string>();
  const out: ElementAssessment[] = [];
  for (const id of elementIds) {
    if (seen.has(id)) continue; // spec duplicates collapse to one link
    seen.add(id);
    const rec = inventory.get(id) ?? null;
    out.push({ elementId: id, verdict: classifyElement(rec), record: rec });
  }
  return out;
}

// DB-backed inventory for one spec's element IDs. Unknown IDs simply have
// no entry — the caller treats a missing record as UNKNOWN (§32).
export async function fetchElementInventory(
  elementIds: string[],
): Promise<Map<string, ElementInventory>> {
  const unique = Array.from(new Set(elementIds));
  const out = new Map<string, ElementInventory>();
  if (unique.length === 0) return out;
  const rows = await db.query.culturalElements.findMany({
    where: inArray(culturalElements.id, unique),
    with: {
      references: { with: { reference: { columns: { referenceCode: true } } } },
      restrictions: { columns: { id: true } },
    },
  });
  for (const r of rows) {
    out.set(r.id, {
      id: r.id,
      name: r.name,
      validationStatus: r.validationStatus,
      sources: r.references.map((x) => x.reference.referenceCode),
      restrictionCount: r.restrictions.length,
    });
  }
  return out;
}

export async function validateSpecElements(
  elementIds: string[],
): Promise<ElementAssessment[]> {
  return assessElements(elementIds, await fetchElementInventory(elementIds));
}
