// Pure report-type constants (safe for client components).
export const REPORT_TYPES = [
  "DESIGN_REPORT",
  "CULTURAL_REPORT",
  "COST_REPORT",
  "EVALUATION_REPORT",
  "FINAL_REPORT",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];
