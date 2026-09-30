// md/05 §32-39: output validation verdicts (pure classifier).
import { describe, expect, it } from "vitest";
import {
  assessElements,
  classifyElement,
  type ElementInventory,
} from "@/lib/ai/output-validator";

const rec = (over: Partial<ElementInventory> = {}): ElementInventory => ({
  id: "11111111-1111-4111-8111-111111111111",
  name: "Sample Textile A",
  validationStatus: "VERIFIED",
  sources: ["REF-024"],
  restrictionCount: 0,
  ...over,
});

describe("classifyElement", () => {
  it("maps every status honestly", () => {
    expect(classifyElement(null)).toBe("UNKNOWN");
    expect(classifyElement(rec())).toBe("OK");
    expect(classifyElement(rec({ validationStatus: "RESTRICTED" }))).toBe("RESTRICTED");
    expect(classifyElement(rec({ validationStatus: "DEPRECATED" }))).toBe("DEPRECATED");
    expect(classifyElement(rec({ validationStatus: "UNVERIFIED" }))).toBe("UNVERIFIED");
    expect(classifyElement(rec({ validationStatus: "UNDER_REVIEW" }))).toBe("UNVERIFIED");
    expect(classifyElement(rec({ validationStatus: null }))).toBe("UNVERIFIED");
    expect(classifyElement(rec({ sources: [] }))).toBe("UNSOURCED");
  });
});

describe("assessElements", () => {
  it("dedupes spec IDs and preserves order", () => {
    const r = rec();
    const out = assessElements(
      [r.id, r.id, "22222222-2222-4222-8222-222222222222"],
      new Map([[r.id, r]]),
    );
    expect(out.map((a) => a.elementId)).toEqual([r.id, "22222222-2222-4222-8222-222222222222"]);
    expect(out[0].verdict).toBe("OK");
    expect(out[1]).toMatchObject({ verdict: "UNKNOWN", record: null });
  });

  it("handles an empty spec", () => {
    expect(assessElements([], new Map())).toEqual([]);
  });
});
