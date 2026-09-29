// Project domain logic — md/01 §8 (Project Management), md/02 §44 (state machine).
// Pure functions stay here; Drizzle access lives in the API route handlers.

export const PROJECT_STATUSES = [
  "DRAFT",
  "RESEARCH",
  "DESIGNING",
  "EVALUATION",
  "REVISION",
  "FINALIZATION",
  "COMPLETED",
  "ARCHIVED",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ["RESEARCH", "ARCHIVED"],
  RESEARCH: ["DESIGNING", "DRAFT", "ARCHIVED"],
  DESIGNING: ["EVALUATION", "RESEARCH", "ARCHIVED"],
  EVALUATION: ["REVISION", "FINALIZATION", "DESIGNING", "ARCHIVED"],
  REVISION: ["EVALUATION", "DESIGNING", "ARCHIVED"],
  FINALIZATION: ["COMPLETED", "REVISION", "ARCHIVED"],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function isValidProjectStatus(s: string): s is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(s);
}

export function canTransitionProject(
  from: string,
  to: string,
): boolean {
  if (from === to) return true;
  if (!isValidProjectStatus(from) || !isValidProjectStatus(to)) return false;
  return PROJECT_TRANSITIONS[from].includes(to);
}

export function generateProjectCode(): string {
  return `PRJ-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export class ProjectService {
  // Thin wrapper kept for md/02 §42 service separation; route handlers use
  // the pure helpers above with Drizzle directly until the domain grows.
  static transitions = PROJECT_TRANSITIONS;
  static canTransition = canTransitionProject;
  static generateCode = generateProjectCode;
}
