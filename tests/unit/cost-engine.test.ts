// §121: Cost formulas + Budget status — deterministic engine (md/06).
import { describe, expect, it } from "vitest";
import { resolveBudgetStatus } from "@/lib/cost/budget";
import { costProfile } from "@/lib/cost/constants";

const base = { nearBudgetPct: 90, expiredCount: 0, missingCount: 0 };

describe("resolveBudgetStatus", () => {
  it("UNDER below near threshold, NEAR below 100%, AT at 100%, OVER above", () => {
    expect(resolveBudgetStatus({ ...base, estimatedTotal: 8999, budget: 10000 })).toBe("UNDER_BUDGET");
    expect(resolveBudgetStatus({ ...base, estimatedTotal: 9000, budget: 10000 })).toBe("NEAR_BUDGET");
    expect(resolveBudgetStatus({ ...base, estimatedTotal: 9999, budget: 10000 })).toBe("NEAR_BUDGET");
    expect(resolveBudgetStatus({ ...base, estimatedTotal: 10000, budget: 10000 })).toBe("AT_BUDGET");
    expect(resolveBudgetStatus({ ...base, estimatedTotal: 10001, budget: 10000 })).toBe("OVER_BUDGET");
  });

  it("INCOMPLETE on missing prices — never invented", () => {
    expect(
      resolveBudgetStatus({ ...base, estimatedTotal: 500, budget: 10000, missingCount: 2 }),
    ).toBe("INCOMPLETE");
  });

  it("REVIEW_REQUIRED on expired prices except when OVER", () => {
    expect(
      resolveBudgetStatus({ ...base, estimatedTotal: 5000, budget: 10000, expiredCount: 1 }),
    ).toBe("REVIEW_REQUIRED");
    expect(
      resolveBudgetStatus({ ...base, estimatedTotal: 15000, budget: 10000, expiredCount: 1 }),
    ).toBe("OVER_BUDGET");
  });

  it("no budget → UNDER (or REVIEW when expired)", () => {
    expect(resolveBudgetStatus({ ...base, estimatedTotal: 5000, budget: null })).toBe("UNDER_BUDGET");
    expect(
      resolveBudgetStatus({ ...base, estimatedTotal: 5000, budget: null, expiredCount: 1 }),
    ).toBe("REVIEW_REQUIRED");
  });

  it("respects a custom near-budget threshold", () => {
    expect(
      resolveBudgetStatus({ ...base, nearBudgetPct: 50, estimatedTotal: 6000, budget: 10000 }),
    ).toBe("NEAR_BUDGET");
  });

  it("matches the worked example in md/10 §58: ₱11,550 of ₱25,000", () => {
    expect(resolveBudgetStatus({ ...base, estimatedTotal: 11550, budget: 25000 })).toBe(
      "UNDER_BUDGET",
    );
  });
});

describe("costProfile", () => {
  it("defaults to PHP / 10% contingency / 90% near-budget", () => {
    delete process.env.COST_CONTINGENCY_PCT;
    delete process.env.COST_NEAR_BUDGET_PCT;
    expect(costProfile()).toEqual({ currency: "PHP", contingencyPct: 10, nearBudgetPct: 90 });
  });

  it("reads env overrides (never hard-coded)", () => {
    process.env.COST_CONTINGENCY_PCT = "15";
    process.env.COST_NEAR_BUDGET_PCT = "80";
    expect(costProfile()).toEqual({ currency: "PHP", contingencyPct: 15, nearBudgetPct: 80 });
    delete process.env.COST_CONTINGENCY_PCT;
    delete process.env.COST_NEAR_BUDGET_PCT;
  });
});
