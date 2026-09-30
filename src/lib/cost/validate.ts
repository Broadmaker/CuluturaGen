// Cost input validation — md/06 §56 (preconditions) + §91-92 (error codes).
// Pure: the same checks run in unit tests and inside CostService.calculate.
// Invalid inputs fail fast with 422 + structured codes; missing *prices*
// are NOT input errors — the engine reports those as INCOMPLETE snapshots.

export const COST_ERROR_CODES = [
  "INVALID_QUANTITY",
  "INVALID_UNIT",
  "INVALID_PRICE",
  "INVALID_CONTINGENCY",
  "INVALID_BUDGET",
  "CURRENCY_MISMATCH",
] as const;

export type CostErrorCode = (typeof COST_ERROR_CODES)[number];

export interface CostIssue {
  code: CostErrorCode;
  message: string;
  field?: string;
}

export interface CostValidationInput {
  materials: { materialId: string; name: string; quantity: unknown; unit?: unknown }[];
  adHoc: {
    category: "LABOR" | "DECORATION" | "OTHER";
    description: string;
    quantity?: unknown;
    unit?: unknown;
    unitPrice?: unknown;
  }[];
  budget: unknown;
  budgetCurrency: unknown;
  profileCurrency: string;
  contingencyPct: unknown;
}

function isFiniteNumber(v: unknown): v is number {
  // Rejects NaN, ±Infinity, numeric strings, null/undefined, and anything
  // parseable-but-not-a-number (Number("abc") is NaN → rejected).
  return typeof v === "number" && Number.isFinite(v);
}

function toNumber(v: unknown): number | null {
  if (isFiniteNumber(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function checkQuantity(
  value: unknown,
  field: string,
  issues: CostIssue[],
  opts: { required: boolean },
): void {
  const n = toNumber(value);
  if (n === null) {
    if (opts.required || value !== undefined) {
      issues.push({ code: "INVALID_QUANTITY", message: `${field} must be a finite number greater than 0.`, field });
    }
    return;
  }
  if (n <= 0) {
    issues.push({ code: "INVALID_QUANTITY", message: `${field} must be greater than 0 (got ${n}).`, field });
  }
}

function checkUnit(value: unknown, field: string, issues: CostIssue[]): void {
  if (value === undefined || value === null) return; // unit is optional
  if (typeof value !== "string" || value.trim() === "" || value.length > 50) {
    issues.push({ code: "INVALID_UNIT", message: `${field} must be a non-empty string up to 50 characters.`, field });
  }
}

export function validateCostInputs(input: CostValidationInput): CostIssue[] {
  const issues: CostIssue[] = [];

  for (const m of input.materials) {
    const label = `materials[${m.name || m.materialId}].quantity`;
    checkQuantity(m.quantity, label, issues, { required: true });
    checkUnit(m.unit, `materials[${m.name || m.materialId}].unit`, issues);
  }

  for (const l of input.adHoc) {
    const label = `${l.category.toLowerCase()}["${l.description}"].quantity`;
    if (l.quantity !== undefined) checkQuantity(l.quantity, label, issues, { required: false });
    checkUnit(l.unit, `${l.category.toLowerCase()}["${l.description}"].unit`, issues);
    if (l.unitPrice !== undefined) {
      const n = toNumber(l.unitPrice);
      if (n === null || n < 0) {
        issues.push({
          code: "INVALID_PRICE",
          message: `${l.category.toLowerCase()}["${l.description}"].unitPrice must be a finite number ≥ 0.`,
          field: `${l.category.toLowerCase()}["${l.description}"].unitPrice`,
        });
      }
    }
  }

  if (input.budget !== null && input.budget !== undefined) {
    const n = toNumber(input.budget);
    if (n === null || n < 0) {
      issues.push({ code: "INVALID_BUDGET", message: "Budget must be a finite number ≥ 0.", field: "budget" });
    }
  }

  if (
    typeof input.budgetCurrency === "string" &&
    input.budgetCurrency.trim() !== "" &&
    input.budgetCurrency.toUpperCase() !== input.profileCurrency.toUpperCase()
  ) {
    issues.push({
      code: "CURRENCY_MISMATCH",
      message: `Budget currency ${input.budgetCurrency} does not match calculation currency ${input.profileCurrency}.`,
      field: "budgetCurrency",
    });
  }

  {
    const n = toNumber(input.contingencyPct);
    if (n === null || n < 0 || n > 100) {
      issues.push({
        code: "INVALID_CONTINGENCY",
        message: "Contingency must be a finite number between 0 and 100.",
        field: "contingencyPct",
      });
    }
  }

  return issues;
}
