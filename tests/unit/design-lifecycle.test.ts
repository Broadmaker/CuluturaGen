// md/02 §43 design lifecycle + md/07 §91 gate semantics.
import { describe, expect, it } from "vitest";
import {
  DESIGN_STATUSES,
  canTransitionDesign,
  isValidDesignStatus,
} from "@/server/services/design/DesignService";

describe("design status machine", () => {
  it("accepts all known statuses, rejects unknown", () => {
    for (const s of DESIGN_STATUSES) expect(isValidDesignStatus(s)).toBe(true);
    expect(isValidDesignStatus("DRAFTING")).toBe(false);
    expect(isValidDesignStatus("")).toBe(false);
  });

  it("walks the happy path to FINAL", () => {
    const path = [
      "DRAFT",
      "GENERATING",
      "GENERATED",
      "EVALUATING",
      "REVIEW_REQUIRED",
      "REVIEWED",
      "APPROVED",
      "FINAL",
    ];
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransitionDesign(path[i], path[i + 1])).toBe(true);
    }
  });

  it("supports the revision loop", () => {
    expect(canTransitionDesign("REVIEW_REQUIRED", "REVISION")).toBe(true);
    expect(canTransitionDesign("REVISION", "GENERATING")).toBe(true);
    expect(canTransitionDesign("REVIEWED", "REVISION")).toBe(true);
    expect(canTransitionDesign("APPROVED", "REVISION")).toBe(true);
  });

  it("supports failure + retry", () => {
    expect(canTransitionDesign("GENERATING", "FAILED")).toBe(true);
    expect(canTransitionDesign("FAILED", "GENERATING")).toBe(true);
    expect(canTransitionDesign("FAILED", "FINAL")).toBe(false);
  });

  it("FINAL never regenerates — archival only", () => {
    expect(canTransitionDesign("FINAL", "GENERATING")).toBe(false);
    expect(canTransitionDesign("FINAL", "REVISION")).toBe(false);
    expect(canTransitionDesign("FINAL", "EVALUATING")).toBe(false);
    expect(canTransitionDesign("FINAL", "ARCHIVED")).toBe(true);
    for (const s of DESIGN_STATUSES) {
      if (s === "ARCHIVED") continue;
      expect(canTransitionDesign(s, "ARCHIVED")).toBe(true);
    }
    for (const s of DESIGN_STATUSES) {
      expect(canTransitionDesign("ARCHIVED", s)).toBe(s === "ARCHIVED");
    }
  });

  it("rejects skips", () => {
    expect(canTransitionDesign("DRAFT", "GENERATED")).toBe(false);
    expect(canTransitionDesign("DRAFT", "FINAL")).toBe(false);
    expect(canTransitionDesign("GENERATED", "APPROVED")).toBe(false);
    expect(canTransitionDesign("GENERATED", "FINAL")).toBe(false);
  });

  it("same-state is a no-op; unknown states rejected", () => {
    for (const s of DESIGN_STATUSES) expect(canTransitionDesign(s, s)).toBe(true);
    expect(canTransitionDesign("NOPE", "DRAFT")).toBe(false);
    expect(canTransitionDesign("DRAFT", "NOPE")).toBe(false);
  });
});
