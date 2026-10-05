import { describe, expect, it } from "vitest";
import {
  fuseCandidates,
  statusWeight,
  type ElementRow,
  type FusionCandidate,
} from "@/lib/retrieval/hybrid";

// md/04 §73–74: fusion is deterministic and evidence-graded.
let n = 0;
function row(over: Partial<ElementRow> = {}): ElementRow {
  n += 1;
  return {
    id: `el-${n}`,
    elementCode: `CE-T${n}`,
    name: `Probe Element ${n}`,
    alternativeNames: [],
    category: "TEXTILE",
    description: null,
    historicalContext: null,
    symbolism: null,
    traditionalUsage: null,
    modernUsage: null,
    appropriateContext: null,
    restrictedContext: null,
    validationStatus: "VERIFIED",
    expertNotes: null,
    createdBy: null,
    verifiedBy: null,
    verifiedAt: null,
    deletedAt: null,
    createdAt: null,
    updatedAt: null,
    searchVector: null,
    ...over,
  };
}

function cand(el: ElementRow, over: Partial<FusionCandidate> = {}): FusionCandidate {
  return { element: el, textRank: 0, exactName: false, keywordHit: true, ...over };
}

describe("statusWeight", () => {
  it("ranks VERIFIED first per §74, degrades gracefully", () => {
    expect(statusWeight("VERIFIED")).toBe(1.0);
    expect(statusWeight("UNDER_REVIEW")).toBeLessThan(1.0);
    expect(statusWeight("UNVERIFIED")).toBeLessThan(statusWeight("UNDER_REVIEW"));
    expect(statusWeight("DEPRECATED")).toBeLessThan(statusWeight("RESTRICTED"));
    expect(statusWeight(null)).toBe(0.4);
    expect(statusWeight("UNKNOWN_FUTURE")).toBe(0.4);
  });
});

describe("fuseCandidates", () => {
  it("exact-name match wins regardless of rank or status", () => {
    const high = row({ id: "high", name: "Other Thing", validationStatus: "VERIFIED" });
    const exact = row({ id: "exact", name: "woven textile", validationStatus: "UNVERIFIED" });
    const out = fuseCandidates(
      "woven textile",
      [cand(high, { textRank: 2.5 }), cand(exact, { textRank: 0.1, exactName: true })],
      new Set(),
      [],
      10,
    );
    expect(out[0].element.id).toBe("exact");
    expect(out[0].via).toContain("exact-name");
  });

  it("VERIFIED beats UNVERIFIED at equal rank", () => {
    const v = row({ id: "v", validationStatus: "VERIFIED" });
    const u = row({ id: "u", validationStatus: "UNVERIFIED" });
    const out = fuseCandidates(
      "textile",
      [cand(u, { textRank: 1 }), cand(v, { textRank: 1 })],
      new Set(),
      [],
      10,
    );
    expect(out.map((h) => h.element.id)).toEqual(["v", "u"]);
  });

  it("appends graph-only neighbors with evidence, dedupes known ones", () => {
    const a = row({ id: "a" });
    const b = row({ id: "b" });
    const out = fuseCandidates(
      "textile",
      [cand(a, { textRank: 1 })],
      new Set(["a", "b"]),
      [a, b],
      10,
    );
    expect(out.map((h) => h.element.id)).toEqual(["a", "b"]);
    expect(out[0].via).toContain("graph");
    expect(out[1]).toMatchObject({ via: ["graph"], textRank: 0 });
  });

  it("vector scores boost and label the hit (pgvector-ready)", () => {
    const v = row({ id: "v" });
    const k = row({ id: "k" });
    const out = fuseCandidates(
      "textile",
      [cand(k, { textRank: 0.5 }), cand(v, { textRank: 0, keywordHit: false, vectorScore: 0.9 })],
      new Set(),
      [],
      10,
    );
    expect(out[0].element.id).toBe("v");
    expect(out[0].via).toContain("vector");
  });

  it("respects the limit", () => {
    const many = Array.from({ length: 5 }, (_, i) => cand(row({ id: `m${i}` }), { textRank: 1 }));
    expect(fuseCandidates("q", many, new Set(), [], 3)).toHaveLength(3);
  });
});
