// md/06 §56 + §91-92: cost preconditions and error codes.
import { describe, expect, it } from "vitest";
import { validateCostInputs, type CostValidationInput } from "@/lib/cost/validate";

const base: CostValidationInput = {
  materials: [{ materialId: "m1", name: "Silk", quantity: 2, unit: "meter" }],
  adHoc: [{ category: "LABOR", description: "Tailoring", quantity: 5, unit: "hour", unitPrice: 300 }],
  budget: 25000,
  budgetCurrency: "PHP",
  profileCurrency: "PHP",
  contingencyPct: 10,
};

describe("validateCostInputs", () => {
  it("accepts a fully valid input set", () => {
    expect(validateCostInputs(base)).toEqual([]);
  });

  it("accepts missing optional ad-hoc quantity/unit/price", () => {
    expect(
      validateCostInputs({ ...base, adHoc: [{ category: "OTHER", description: "Fees" }] }),
    ).toEqual([]);
  });

  it("rejects zero/negative/NaN/Infinity quantities (INVALID_QUANTITY)", () => {
    for (const q of [0, -3, NaN, Infinity, "abc", null]) {
      const issues = validateCostInputs({
        ...base,
        materials: [{ materialId: "m1", name: "Silk", quantity: q, unit: "meter" }],
      });
      expect(issues.some((i) => i.code === "INVALID_QUANTITY")).toBe(true);
    }
  });

  it("accepts numeric strings that parse finitely", () => {
    expect(
      validateCostInputs({
        ...base,
        materials: [{ materialId: "m1", name: "Silk", quantity: "2.5", unit: "meter" }],
      }),
    ).toEqual([]);
  });

  it("rejects bad units (INVALID_UNIT) but allows omission", () => {
    expect(
      validateCostInputs({
        ...base,
        materials: [{ materialId: "m1", name: "Silk", quantity: 2, unit: "   " }],
      }).some((i) => i.code === "INVALID_UNIT"),
    ).toBe(true);
    expect(
      validateCostInputs({
        ...base,
        materials: [{ materialId: "m1", name: "Silk", quantity: 2 }],
      }),
    ).toEqual([]);
  });

  it("rejects negative/NaN unit prices (INVALID_PRICE)", () => {
    for (const p of [-1, NaN]) {
      const issues = validateCostInputs({
        ...base,
        adHoc: [{ category: "LABOR", description: "T", quantity: 1, unitPrice: p }],
      });
      expect(issues.some((i) => i.code === "INVALID_PRICE")).toBe(true);
    }
  });

  it("rejects out-of-range/NaN contingency (INVALID_CONTINGENCY)", () => {
    for (const c of [-1, 101, NaN, "ten"]) {
      const issues = validateCostInputs({ ...base, contingencyPct: c });
      expect(issues.some((i) => i.code === "INVALID_CONTINGENCY")).toBe(true);
    }
    expect(validateCostInputs({ ...base, contingencyPct: 0 }).length).toBe(0);
    expect(validateCostInputs({ ...base, contingencyPct: 100 }).length).toBe(0);
  });

  it("rejects negative budgets, flags currency mismatch", () => {
    expect(
      validateCostInputs({ ...base, budget: -5 }).some((i) => i.code === "INVALID_BUDGET"),
    ).toBe(true);
    expect(
      validateCostInputs({ ...base, budgetCurrency: "USD" }).some(
        (i) => i.code === "CURRENCY_MISMATCH",
      ),
    ).toBe(true);
    expect(validateCostInputs({ ...base, budget: null, budgetCurrency: null }).length).toBe(0);
  });

  it("collects multiple issues in one pass", () => {
    const issues = validateCostInputs({
      ...base,
      materials: [{ materialId: "m1", name: "Silk", quantity: 0, unit: "" }],
      contingencyPct: 150,
    });
    const codes = issues.map((i) => i.code);
    expect(codes).toContain("INVALID_QUANTITY");
    expect(codes).toContain("INVALID_UNIT");
    expect(codes).toContain("INVALID_CONTINGENCY");
  });
});
