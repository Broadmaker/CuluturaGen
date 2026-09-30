// §121: Requirement validation + evaluation rules (md/07).
import { describe, expect, it } from "vitest";
import {
  domainFromFindings,
  requirementCoverage,
  terms,
} from "@/server/services/evaluation/EvaluationService";

describe("terms", () => {
  it("lowercases, drops punctuation, short words, and stopwords", () => {
    expect(terms("Gold Embroidery!")).toEqual(["gold", "embroidery"]);
    // "traditional" is a stopword; "textile" survives
    expect(terms("Traditional textile")).toEqual(["textile"]);
    expect(terms("the and for")).toEqual([]);
  });

  it("dedupes", () => {
    expect(terms("silk silk silk robe")).toEqual(["silk", "robe"]);
  });
});

describe("requirementCoverage", () => {
  const spec = "Structured formal silhouette in deep red silk with gold embroidery";

  it("full match → ratio 1, no missing", () => {
    const r = requirementCoverage("gold embroidery", spec);
    expect(r.ratio).toBe(1);
    expect(r.missing).toEqual([]);
  });

  it("partial match reports matched/missing evidence", () => {
    const r = requirementCoverage("gold embroidery beads", spec);
    expect(r.matched).toContain("gold");
    expect(r.missing).toContain("beads");
    expect(r.ratio).toBeCloseTo(2 / 3);
  });

  it("vacuous requirement (only stopwords) → ratio 1", () => {
    expect(requirementCoverage("traditional", spec).ratio).toBe(1);
  });
});

describe("domainFromFindings", () => {
  it("escalates by worst severity, never a single score", () => {
    expect(domainFromFindings([])).toBe("PASS");
    expect(domainFromFindings(["INFO", "LOW"])).toBe("PASS");
    expect(domainFromFindings(["LOW", "MEDIUM"])).toBe("PASS_WITH_WARNINGS");
    expect(domainFromFindings(["MEDIUM", "HIGH"])).toBe("REVIEW_REQUIRED");
    expect(domainFromFindings(["LOW", "CRITICAL"])).toBe("FAIL");
  });
});
