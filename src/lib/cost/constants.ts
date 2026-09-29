// Cost domain constants — md/06 (deterministic cost engine spec).
export const MATERIAL_CATEGORIES = [
  "FABRIC",
  "TEXTILE",
  "LINING",
  "THREAD",
  "FASTENER",
  "TRIM",
  "EMBROIDERY",
  "BEADS",
  "SEQUINS",
  "ORNAMENT",
  "ACCESSORY",
  "PACKAGING",
  "OTHER",
] as const;

export const AVAILABILITY_STATUSES = [
  "AVAILABLE",
  "LIMITED",
  "OUT_OF_STOCK",
  "UNKNOWN",
  "DISCONTINUED",
] as const;

// Price provenance — md/06 §18. NEVER invent a price; missing stays missing.
export const PRICE_SOURCES = [
  "VERIFIED",
  "USER_ENTERED",
  "SUPPLIER_QUOTE",
  "ESTIMATED",
  "EXPIRED",
  "MISSING",
] as const;

export const COST_STATUSES = [
  "UNDER_BUDGET",
  "NEAR_BUDGET",
  "AT_BUDGET",
  "OVER_BUDGET",
  "INCOMPLETE",
  "REVIEW_REQUIRED",
] as const;

// Calculation profile. Configurable via env, never hard-coded in the engine
// (md/06 §15). Admin-managed profiles arrive with the admin console pass.
export function costProfile() {
  return {
    currency: "PHP",
    contingencyPct: Number(process.env.COST_CONTINGENCY_PCT ?? 10),
    nearBudgetPct: Number(process.env.COST_NEAR_BUDGET_PCT ?? 90),
  };
}
