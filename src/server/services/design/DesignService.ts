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
export class DesignService {
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
