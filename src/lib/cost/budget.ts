// Pure budget-status thresholds — extracted from CostService so the §121
// "Budget status" unit tests cover the exact logic the engine runs (md/06).
// Same inputs → same status, always; the engine only calls this.

export interface BudgetStatusInput {
  estimatedTotal: number;
  budget: number | null;
  missingCount: number;
  expiredCount: number;
  nearBudgetPct: number;
}

export type BudgetStatus =
  | "UNDER_BUDGET"
  | "NEAR_BUDGET"
  | "AT_BUDGET"
  | "OVER_BUDGET"
  | "INCOMPLETE"
  | "REVIEW_REQUIRED";

export function resolveBudgetStatus(input: BudgetStatusInput): BudgetStatus {
  const { estimatedTotal, budget, missingCount, expiredCount, nearBudgetPct } = input;
  let status: BudgetStatus;
  if (missingCount > 0) {
    status = "INCOMPLETE";
  } else if (!budget) {
    // No usable budget (null, 0, NaN) — matches the engine's original check.
    status = expiredCount > 0 ? "REVIEW_REQUIRED" : "UNDER_BUDGET";
  } else {
    const ratio = estimatedTotal / budget;
    status =
      ratio < nearBudgetPct / 100
        ? "UNDER_BUDGET"
        : ratio < 1
          ? "NEAR_BUDGET"
          : Math.abs(ratio - 1) < 1e-9
            ? "AT_BUDGET"
            : "OVER_BUDGET";
    if (expiredCount > 0 && status !== "OVER_BUDGET") status = "REVIEW_REQUIRED";
  }
  if (expiredCount > 0 && status === "UNDER_BUDGET") status = "REVIEW_REQUIRED";
  return status;
}
