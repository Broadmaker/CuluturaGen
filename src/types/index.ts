// Central domain types — mirrors md/03_DATABASE_SCHEMA.md + md/02_SYSTEM_ARCHITECTURE.md §23
// Keep thin: Zod validation lives in src/lib/validation, services own business logic.

export type RoleCode =
  | "ADMIN"
  | "DESIGNER"
  | "CULTURAL_EXPERT"
  | "RESEARCHER"
  | "VIEWER";

export type ProjectStatus =
  | "DRAFT"
  | "RESEARCH"
  | "DESIGNING"
  | "EVALUATION"
  | "REVISION"
  | "FINALIZATION"
  | "COMPLETED"
  | "ARCHIVED";

export type DesignStatus =
  | "DRAFT"
  | "GENERATING"
  | "GENERATED"
  | "EVALUATING"
  | "REVIEW_REQUIRED"
  | "REVISION"
  | "REVIEWED"
  | "APPROVED"
  | "FINAL"
  | "REJECTED"
  | "ARCHIVED";

export type ValidationStatus =
  | "UNVERIFIED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "RESTRICTED"
  | "DEPRECATED";

export type RequirementPriority =
  | "MANDATORY"
  | "PREFERRED"
  | "OPTIONAL"
  | "RESTRICTED";

export type FindingSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type EvaluationStatus =
  | "PASS"
  | "PASS_WITH_WARNINGS"
  | "REVIEW_REQUIRED"
  | "FAIL"
  | "NOT_EVALUATED"
  | "INSUFFICIENT_EVIDENCE";

export type CostStatus =
  | "UNDER_BUDGET"
  | "NEAR_BUDGET"
  | "AT_BUDGET"
  | "OVER_BUDGET"
  | "INCOMPLETE"
  | "REVIEW_REQUIRED";

export interface DesignObject {
  id: string;
  projectId: string;
  version: number;
  designSpecification: Record<string, unknown>;
  imageUrl?: string;
  culturalElements: string[];
  materials: string[];
  estimatedCost?: number;
  evaluation?: Record<string, unknown>;
  explanation?: Record<string, unknown>;
  status: DesignStatus;
}

export interface CostResult {
  materials: number;
  labor: number;
  decoration: number;
  other: number;
  directCost: number;
  contingency: number;
  estimatedTotal: number;
  budget?: number;
  status: CostStatus;
  requiresReview: boolean;
}
