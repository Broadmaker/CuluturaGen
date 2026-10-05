// Hybrid retrieval against the real DB. Skips gracefully when unreachable.
// Creates self-cleaning probe elements with unique tokens — never touches
// seed/demo data. Also proves the search_vector trigger fires on INSERT.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  culturalElementRelationships,
  culturalElements,
} from "@/lib/db/schema";
import { hybridSearch } from "@/lib/retrieval/hybrid";

const TOKEN = `Zzxq${Date.now().toString(36)}`;
let reachable = false;
const probeIds: string[] = [];

async function dbOk(): Promise<boolean> {
  try {
    await db.execute("select 1");
    return true;
  } catch {
    return false;
  }
}

beforeAll(async () => {
  reachable = await dbOk();
  if (!reachable) return;
  const mk = async (name: string, over: Record<string, unknown> = {}) => {
    const [r] = await db
      .insert(culturalElements)
      .values({
        elementCode: `CE-TST-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        name,
        category: "TEXTILE",
        validationStatus: "UNVERIFIED",
        ...over,
      })
      .returning({ id: culturalElements.id });
    probeIds.push(r.id);
    return r.id;
  };
  // A: symbolism-only mention (old ilike name/description search missed this).
  const a = await mk(`${TOKEN} Alpha Weave`, { symbolism: `${TOKEN} prosperity thread` });
  // B: exact-name target + VERIFIED status.
  const b = await mk(`${TOKEN} Beta Cloth`, { validationStatus: "VERIFIED" });
  // C: UNVERIFIED element sharing B's exact name stem for status ordering.
  await mk(`${TOKEN} Beta Cloth Variant`, { description: `${TOKEN} Beta Cloth notes` });
  // Graph link A → B.
  await db.insert(culturalElementRelationships).values({
    sourceElementId: a,
    targetElementId: b,
    relationshipType: "RELATED_TO",
  });
});

afterAll(async () => {
  if (!reachable || probeIds.length === 0) return;
  await db.delete(culturalElementRelationships).where(
    inArray(culturalElementRelationships.sourceElementId, probeIds),
  );
  await db.delete(culturalElements).where(inArray(culturalElements.id, probeIds));
});

describe("hybrid retrieval integration", () => {
  it("finds symbolism-only mentions via full-text", async () => {
    if (!reachable) return;
    const hits = await hybridSearch(`${TOKEN} prosperity`, {}, 10);
    const ids = hits.map((h) => h.element.id);
    expect(ids).toContain(probeIds[0]);
    expect(hits.find((h) => h.element.id === probeIds[0])!.via).toContain("full-text");
  });

  it("exact-name VERIFIED element ranks first", async () => {
    if (!reachable) return;
    const hits = await hybridSearch(`${TOKEN} Beta Cloth`, {}, 10);
    expect(hits[0].element.id).toBe(probeIds[1]);
    expect(hits[0].via).toContain("exact-name");
  });

  it("expands graph neighbors with evidence", async () => {
    if (!reachable) return;
    const hits = await hybridSearch(`${TOKEN} Alpha Weave`, {}, 10);
    const b = hits.find((h) => h.element.id === probeIds[1]);
    expect(b).toBeDefined();
    expect(b!.via).toContain("graph");
  });

  it("verifiedOnly filter is respected", async () => {
    if (!reachable) return;
    const hits = await hybridSearch(TOKEN, { verifiedOnly: true }, 10);
    const ids = hits.map((h) => h.element.id);
    expect(ids).toContain(probeIds[1]);
    expect(ids).not.toContain(probeIds[0]);
    expect(ids).not.toContain(probeIds[2]);
  });

  it("unmatched queries return empty, not everything", async () => {
    if (!reachable) return;
    const hits = await hybridSearch(`${TOKEN} NoSuchThingAnywhere`, {}, 10);
    expect(hits).toHaveLength(0);
  });

  it("trigger backfills search_vector on insert", async () => {
    if (!reachable) return;
    const [r] = await db
      .select({ v: culturalElements.searchVector })
      .from(culturalElements)
      .where(eq(culturalElements.id, probeIds[0]));
    expect(r.v).toBeTruthy();
  });
});
