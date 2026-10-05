import { describe, expect, it } from "vitest";
import { statusTone } from "@/components/status/statusTone";

// Unified status presentation: every state has icon + label + tone (md/08).

describe("statusTone", () => {
  it("maps known states with icon and label", () => {
    expect(statusTone("VERIFIED")).toMatchObject({ icon: "✓", label: "VERIFIED" });
    expect(statusTone("UNDER_REVIEW")).toMatchObject({ icon: "◌" });
    expect(statusTone("REVIEW_REQUIRED").className).toContain("amber");
    expect(statusTone("OVER_BUDGET").className).toContain("red");
    expect(statusTone("COMPUTER_VISION").label).toContain("ESTIMATED");
    expect(statusTone("MANDATORY").label).toBe("MANDATORY");
  });

  it("normalizes case and separators", () => {
    expect(statusTone("under review").label).toBe("UNDER REVIEW");
    expect(statusTone("near-budget").label).toBe("NEAR BUDGET");
  });

  it("falls back to neutral for unknown or empty values", () => {
    const unknown = statusTone("SOME_FUTURE_STATE");
    expect(unknown.label).toBe("SOME FUTURE STATE");
    expect(unknown.icon.length).toBeGreaterThan(0);
    expect(statusTone(null).label).toBe("—");
    expect(statusTone("").label).toBe("—");
  });

  it("never relies on color alone — every tone has a glyph", () => {
    for (const v of ["VERIFIED", "PASS", "FAIL", "DRAFT", "FINAL", "CRITICAL", "INFO", "UNKNOWN", "HUMAN_APPROVED"]) {
      expect(statusTone(v).icon.length, v).toBeGreaterThan(0);
    }
  });
});
