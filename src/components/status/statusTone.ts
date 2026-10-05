// Unified status presentation (md/08 §68, §113, §73).
// One map for every system state: validation, project/design lifecycle,
// evaluation, cost, measurement source, availability, priority, severity.
// Never color alone: every tone carries a text glyph icon + full label.
// Unknown future values fall back to neutral instead of crashing.

export interface StatusTone {
  icon: string;
  label: string;
  className: string;
}

const GREEN = "border-green-700 bg-green-50 text-green-800";
const AMBER = "border-amber-600 bg-amber-50 text-amber-800";
const RED = "border-red-700 bg-red-50 text-red-800";
const DARK = "border-neutral-800 bg-neutral-800 text-white";
const NEUTRAL = "border-neutral-400 bg-neutral-100 text-neutral-700";
const FAINT = "border-neutral-300 bg-white text-neutral-500";

function tone(icon: string, label: string, className: string): StatusTone {
  return { icon, label, className };
}

const TONES: Record<string, StatusTone> = {
  // Knowledge validation (md/08 §21)
  VERIFIED: tone("✓", "VERIFIED", GREEN),
  UNDER_REVIEW: tone("◌", "UNDER REVIEW", AMBER),
  UNVERIFIED: tone("?", "UNVERIFIED", NEUTRAL),
  RESTRICTED: tone("⚠", "RESTRICTED", RED),
  DEPRECATED: tone("×", "DEPRECATED", "border-neutral-600 bg-neutral-200 text-neutral-600 line-through"),
  // Requirement priority
  MANDATORY: tone("●", "MANDATORY", RED),
  PREFERRED: tone("●", "PREFERRED", "border-blue-600 bg-blue-50 text-blue-800"),
  OPTIONAL: tone("○", "OPTIONAL", NEUTRAL),
  // Lifecycle — forward motion vs attention needed
  DRAFT: tone("○", "DRAFT", NEUTRAL),
  RESEARCH: tone("◌", "RESEARCH", AMBER),
  DESIGN_BRIEF: tone("◌", "DESIGN BRIEF", AMBER),
  DESIGNING: tone("◌", "DESIGNING", AMBER),
  GENERATING: tone("◌", "GENERATING", AMBER),
  GENERATED: tone("●", "GENERATED", "border-blue-600 bg-blue-50 text-blue-800"),
  EVALUATION: tone("◌", "EVALUATION", AMBER),
  EVALUATING: tone("◌", "EVALUATING", AMBER),
  REVIEW_REQUIRED: tone("⚠", "REVIEW REQUIRED", AMBER),
  REVISION: tone("↻", "REVISION", AMBER),
  REVISION_REQUESTED: tone("↻", "REVISION REQUESTED", AMBER),
  REVIEWED: tone("✓", "REVIEWED", "border-blue-600 bg-blue-50 text-blue-800"),
  APPROVED: tone("✓", "APPROVED", GREEN),
  FINAL: tone("★", "FINAL", GREEN),
  FINALIZATION: tone("◌", "FINALIZATION", AMBER),
  COMPLETED: tone("✓", "COMPLETED", GREEN),
  ACCEPTED: tone("✓", "ACCEPTED", GREEN),
  ACCEPT: tone("✓", "ACCEPT", GREEN),
  HUMAN_APPROVED: tone("✓", "HUMAN APPROVED", GREEN),
  RESOLVED: tone("✓", "RESOLVED", GREEN),
  REJECTED: tone("×", "REJECTED", RED),
  REJECT: tone("×", "REJECT", RED),
  ARCHIVED: tone("–", "ARCHIVED", FAINT),
  CANCELLED: tone("×", "CANCELLED", FAINT),
  // Evaluation outcomes (md/07 §8–9)
  PASS: tone("✓", "PASS", GREEN),
  PASSED_WITHOUT_CRITICAL_ISSUES: tone("✓", "PASSED WITHOUT CRITICAL ISSUES", GREEN),
  PASS_WITH_WARNINGS: tone("⚠", "PASS WITH WARNINGS", AMBER),
  FAIL: tone("×", "FAIL", RED),
  FAILED: tone("×", "FAILED", RED),
  BLOCKED: tone("■", "BLOCKED", DARK),
  NOT_EVALUATED: tone("○", "NOT EVALUATED", FAINT),
  INSUFFICIENT_EVIDENCE: tone("?", "INSUFFICIENT EVIDENCE", AMBER),
  PENDING: tone("◌", "PENDING", AMBER),
  // Cost (md/06 §15)
  UNDER_BUDGET: tone("✓", "UNDER BUDGET", GREEN),
  NEAR_BUDGET: tone("⚠", "NEAR BUDGET", AMBER),
  AT_BUDGET: tone("●", "AT BUDGET", "border-blue-600 bg-blue-50 text-blue-800"),
  OVER_BUDGET: tone("×", "OVER BUDGET", RED),
  INCOMPLETE: tone("○", "INCOMPLETE", FAINT),
  // Measurement source (md/01 §15)
  MANUAL: tone("●", "MANUAL", NEUTRAL),
  COMPUTER_VISION: tone("⚠", "ESTIMATED · VISION", AMBER),
  ESTIMATED: tone("⚠", "ESTIMATED", AMBER),
  IMPORTED: tone("●", "IMPORTED", NEUTRAL),
  VISION_ESTIMATED: tone("⚠", "ESTIMATED · VISION", AMBER),
  CORRECTED_BY_USER: tone("✓", "CORRECTED BY USER", "border-blue-600 bg-blue-50 text-blue-800"),
  // Availability
  AVAILABLE: tone("✓", "AVAILABLE", GREEN),
  LIMITED: tone("⚠", "LIMITED", AMBER),
  OUT_OF_STOCK: tone("×", "OUT OF STOCK", RED),
  DISCONTINUED: tone("×", "DISCONTINUED", FAINT),
  UNKNOWN: tone("?", "UNKNOWN", FAINT),
  // Users / jobs
  ACTIVE: tone("●", "ACTIVE", GREEN),
  INACTIVE: tone("○", "INACTIVE", FAINT),
  SUSPENDED: tone("■", "SUSPENDED", RED),
  QUEUED: tone("◌", "QUEUED", AMBER),
  PROCESSING: tone("◌", "PROCESSING", AMBER),
  // Severity (md/07 §11)
  INFO: tone("ⓘ", "INFO", NEUTRAL),
  LOW: tone("●", "LOW", NEUTRAL),
  MEDIUM: tone("●", "MEDIUM", AMBER),
  HIGH: tone("●", "HIGH", RED),
  CRITICAL: tone("■", "CRITICAL", DARK),
  // Price source (md/06 §18)
  SUPPLIER_QUOTE: tone("●", "SUPPLIER QUOTE", NEUTRAL),
  USER_ENTERED: tone("●", "USER ENTERED", NEUTRAL),
  EXPIRED: tone("⚠", "EXPIRED", AMBER),
  MISSING: tone("×", "MISSING", RED),
};

export function statusTone(value: string | null | undefined): StatusTone {
  if (!value) return tone("○", "—", FAINT);
  const key = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return TONES[key] ?? tone("●", value.trim().replace(/_/g, " "), NEUTRAL);
}
