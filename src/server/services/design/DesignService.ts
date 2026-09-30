import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  costEstimates,
  designCulturalElements,
  designVersions,
  designs,
  evaluationFindings,
  evaluations,
} from "@/lib/db/schema";
import type { DesignSpec } from "@/lib/ai/spec-schema";

// md/02 §47 version comparison data. Shared by the compare API and page so
// both read identical snapshots.
import type { DesignStatus } from "@/types";

export const DESIGN_STATUSES = [
  "DRAFT",
  "GENERATING",
  "GENERATED",
  "EVALUATING",
  "REVIEW_REQUIRED",
  "REVISION",
  "REVIEWED",
  "APPROVED",
  "FINAL",
  "FAILED",
  "REJECTED",
  "ARCHIVED",
] as const;

export type DesignStatusName = (typeof DESIGN_STATUSES)[number];

// md/02 §43 design lifecycle. Mirrors ProjectService's machine: every status
// write goes through setStatus(), which rejects illegal jumps with 409.
export const DESIGN_TRANSITIONS: Record<DesignStatusName, DesignStatusName[]> = {
  DRAFT: ["GENERATING", "REVISION", "ARCHIVED"],
  GENERATING: ["GENERATED", "FAILED", "ARCHIVED"],
  FAILED: ["GENERATING", "ARCHIVED"],
  GENERATED: ["GENERATING", "EVALUATING", "REVISION", "ARCHIVED"],
  EVALUATING: ["REVIEW_REQUIRED", "REVIEWED", "ARCHIVED"],
  REVIEW_REQUIRED: ["EVALUATING", "GENERATING", "REVISION", "REVIEWED", "APPROVED", "FINAL", "ARCHIVED"],
  REVISION: ["GENERATING", "ARCHIVED"],
  REVIEWED: ["EVALUATING", "GENERATING", "REVISION", "APPROVED", "FINAL", "ARCHIVED"],
  APPROVED: ["GENERATING", "REVISION", "FINAL", "ARCHIVED"],
  FINAL: ["ARCHIVED"],
  REJECTED: ["REVISION", "GENERATING", "ARCHIVED"],
  ARCHIVED: [],
};

export function isValidDesignStatus(s: string): s is DesignStatusName {
  return (DESIGN_STATUSES as readonly string[]).includes(s);
}

export function canTransitionDesign(from: string, to: string): boolean {
  if (from === to) return true;
  if (!isValidDesignStatus(from) || !isValidDesignStatus(to)) return false;
  return DESIGN_TRANSITIONS[from].includes(to);
}

export class DesignService {
  static statuses = DESIGN_STATUSES;
  static transitions = DESIGN_TRANSITIONS;
  static canTransition = canTransitionDesign;

  // Guarded status write: illegal jumps throw 409 instead of corrupting the
  // lifecycle. FINAL designs can never regenerate (archival only).
  static async setStatus(designId: string, to: DesignStatusName): Promise<string> {
    const [design] = await db.select().from(designs).where(eq(designs.id, designId));
    if (!design) throw Object.assign(new Error("Design not found."), { status: 404 });
    const from = design.status ?? "DRAFT";
    if (!canTransitionDesign(from, to)) {
      throw Object.assign(new Error(`Illegal design transition ${from} → ${to}.`), { status: 409 });
    }
    if (from === to) return from;
    await db.update(designs).set({ status: to as DesignStatus }).where(eq(designs.id, designId));
    return to;
  }

  static async compare(designId: string, a: number, b: number) {
    const [design] = await db.select().from(designs).where(eq(designs.id, designId));
    if (!design) return null;

    async function bundle(versionNumber: number) {
      const rows = await db.query.designVersions.findMany({
        where: eq(designVersions.designId, designId),
      });
      const v = rows.find((r) => r.versionNumber === versionNumber);
      if (!v) return null;
      const [used, costs, evaluationRows] = await Promise.all([
        db.query.designCulturalElements.findMany({
          where: eq(designCulturalElements.designVersionId, v.id),
          with: { element: { columns: { id: true, name: true, validationStatus: true } } },
        }),
        db.query.costEstimates.findMany({
          where: eq(costEstimates.designVersionId, v.id),
          orderBy: desc(costEstimates.calculatedAt),
          limit: 1,
        }),
        db.query.evaluations.findMany({
          where: eq(evaluations.designVersionId, v.id),
          orderBy: desc(evaluations.createdAt),
          limit: 1,
        }),
      ]);
      const findingRows =
        evaluationRows.length > 0
          ? await db.query.evaluationFindings.findMany({
              where: eq(evaluationFindings.evaluationId, evaluationRows[0].id),
              columns: { id: true, severity: true, resolved: true },
            })
          : [];
      return {
        version: v,
        spec: v.designSpecification as unknown as DesignSpec | null,
        elements: used.map((u) => ({
          id: u.element.id,
          name: u.element.name,
          status: u.element.validationStatus,
        })),
        cost: costs[0] ?? null,
        evaluation: evaluationRows[0] ?? null,
        openFindings: findingRows.filter((f) => !f.resolved).length,
        critical: findingRows.filter((f) => !f.resolved && f.severity === "CRITICAL").length,
      };
    }

    const [left, right] = await Promise.all([bundle(a), bundle(b)]);
    if (!left || !right) return null;
    return { design, a: left, b: right };
  }
}
