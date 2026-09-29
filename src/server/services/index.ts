// Service layer — one file per domain per md/02_SYSTEM_ARCHITECTURE.md §42.
// Each service coordinates repositories + validation. No direct AI keys here;
// AI access goes through src/lib/ai / src/server/services/ai only.

export * from "./culture/CultureService";
export * from "./design/ProjectService";
export * from "./design/DesignService";
export * from "./design/BodyService";
export * from "./costing/MaterialService";
export * from "./costing/CostService";
export * from "./ai/AIService";
export * from "./evaluation/EvaluationService";
export * from "./evaluation/ExplanationService";
export * from "./reports/ReportService";
