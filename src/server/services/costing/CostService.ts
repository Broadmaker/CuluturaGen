import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  costEstimates,
  costItems,
  designBriefs,
  designMaterials,
  designVersions,
  designs,
  materialPrices,
} from "@/lib/db/schema";
import { costProfile } from "@/lib/cost/constants";

export interface AdHocLine {
  description: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
}

export interface CostLine extends AdHocLine {
  category: "MATERIAL" | "LABOR" | "DECORATION" | "OTHER";
  materialId?: string;
  total: number;
  priceSource: string;
  expired?: boolean;
  missing?: boolean;
}

export interface CostResult {
  estimateId: string;
  currency: string;
  materials: number;
  labor: number;
  decoration: number;
  other: number;
  directCost: number;
  contingencyPct: number;
  contingency: number;
  estimatedTotal: number;
  budget: number | null;
  variance: number | null;
  variancePct: number | null;
  status: string;
  requiresReview: boolean;
  missingPrices: { materialId: string; name: string }[];
  expiredPrices: { materialId: string; name: string }[];
  lines: CostLine[];
}

const round2 = (n: number) => Number(n.toFixed(2));

// Deterministic cost engine — md/06. The AI may SUGGEST materials and
// quantities; this engine performs the authoritative arithmetic. Same inputs
// always produce the same result. Missing prices are reported, never invented.
export class CostService {
  static async calculate(opts: {
    designVersionId: string;
    userId: string;
    labor?: AdHocLine[];
    decoration?: AdHocLine[];
    other?: AdHocLine[];
    contingencyPct?: number;
  }): Promise<CostResult> {
    const profile = costProfile();
    const [version] = await db
      .select()
      .from(designVersions)
      .where(eq(designVersions.id, opts.designVersionId));
    if (!version) throw Object.assign(new Error("Design version not found."), { status: 404 });

    const linked = await db.query.designMaterials.findMany({
      where: eq(designMaterials.designVersionId, opts.designVersionId),
      with: { material: true },
    });

    // Budget comes from the project's latest brief (see resolveBudget).

    const lines: CostLine[] = [];
    const missingPrices: CostResult["missingPrices"] = [];
    const expiredPrices: CostResult["expiredPrices"] = [];
    const now = new Date();

    for (const link of linked) {
      const prices = await db.query.materialPrices.findMany({
        where: eq(materialPrices.materialId, link.materialId),
        orderBy: desc(materialPrices.effectiveDate),
        limit: 5,
      });
      const qty = Number(link.quantity ?? 0);
      if (prices.length === 0 || qty <= 0) {
        if (prices.length === 0) {
          missingPrices.push({ materialId: link.materialId, name: link.material.name });
        }
        lines.push({
          category: "MATERIAL",
          materialId: link.materialId,
          description: link.material.name,
          quantity: qty,
          unit: link.unit ?? link.material.unit ?? undefined,
          total: 0,
          priceSource: "MISSING",
          missing: prices.length === 0,
        });
        continue;
      }
      const price = prices[0];
      const expired =
        !!price.expirationDate && new Date(price.expirationDate) < now;
      if (expired) {
        expiredPrices.push({ materialId: link.materialId, name: link.material.name });
      }
      const unitPrice = Number(price.price);
      lines.push({
        category: "MATERIAL",
        materialId: link.materialId,
        description: `${link.material.name} (${price.supplier ?? "no supplier"} · ${price.source ?? "USER_ENTERED"})`,
        quantity: qty,
        unit: link.unit ?? price.unit ?? link.material.unit ?? undefined,
        unitPrice,
        total: round2(qty * unitPrice),
        priceSource: (price.source ?? "USER_ENTERED") as string,
        expired,
      });
    }

    const adhoc = (items: AdHocLine[] | undefined, category: CostLine["category"]) => {
      for (const it of items ?? []) {
        const qty = it.quantity ?? 1;
        const unitPrice = it.unitPrice ?? 0;
        lines.push({
          category,
          description: it.description,
          quantity: qty,
          unit: it.unit,
          unitPrice,
          total: round2(qty * unitPrice),
          priceSource: "USER_ENTERED",
        });
      }
    };
    adhoc(opts.labor, "LABOR");
    adhoc(opts.decoration, "DECORATION");
    adhoc(opts.other, "OTHER");

    const sum = (cat: CostLine["category"]) =>
      round2(lines.filter((l) => l.category === cat && !l.missing).reduce((s, l) => s + l.total, 0));
    const materials = sum("MATERIAL");
    const labor = sum("LABOR");
    const decoration = sum("DECORATION");
    const other = sum("OTHER");
    const directCost = round2(materials + labor + decoration + other);

    const contingencyPct = opts.contingencyPct ?? profile.contingencyPct;
    const contingency = round2((directCost * contingencyPct) / 100);
    const estimatedTotal = round2(directCost + contingency);

    // Budget from latest brief — resolved via the design's project below.
    const budget = await this.resolveBudget(version.designId);

    let variance: number | null = null;
    let variancePct: number | null = null;
    let status: string;
    if (missingPrices.length > 0) {
      status = "INCOMPLETE";
    } else if (!budget) {
      status = expiredPrices.length > 0 ? "REVIEW_REQUIRED" : "UNDER_BUDGET";
    } else {
      variance = round2(budget - estimatedTotal);
      variancePct = round2(((estimatedTotal - budget) / budget) * 100);
      const ratio = estimatedTotal / budget;
      status =
        ratio < profile.nearBudgetPct / 100
          ? "UNDER_BUDGET"
          : ratio < 1
            ? "NEAR_BUDGET"
            : Math.abs(ratio - 1) < 1e-9
              ? "AT_BUDGET"
              : "OVER_BUDGET";
      if (expiredPrices.length > 0 && status !== "OVER_BUDGET") status = "REVIEW_REQUIRED";
    }
    if (expiredPrices.length > 0 && status === "UNDER_BUDGET") status = "REVIEW_REQUIRED";

    const requiresReview = status !== "UNDER_BUDGET" && status !== "AT_BUDGET";    // Immutable snapshot: values captured on rows, never re-resolved.
    const [estimate] = await db
      .insert(costEstimates)
      .values({
        designVersionId: opts.designVersionId,
        materialCost: String(materials),
        laborCost: String(labor),
        decorationCost: String(decoration),
        otherCost: String(other),
        contingencyCost: String(contingency),
        subtotal: String(directCost),
        totalCost: String(estimatedTotal),
        budget: budget === null ? null : String(budget),
        currency: profile.currency,
        budgetStatus: status,
      })
      .returning();

    for (const l of lines) {
      await db.insert(costItems).values({
        costEstimateId: estimate.id,
        category: l.category,
        description: l.description,
        materialId: l.materialId ?? null,
        quantity: l.quantity !== undefined ? String(l.quantity) : null,
        unit: l.unit ?? null,
        unitPrice: l.unitPrice !== undefined ? String(l.unitPrice) : null,
        total: String(l.total),
        source: l.priceSource,
      });
    }

    return {
      estimateId: estimate.id,
      currency: profile.currency,
      materials,
      labor,
      decoration,
      other,
      directCost,
      contingencyPct,
      contingency,
      estimatedTotal,
      budget,
      variance,
      variancePct,
      status,
      requiresReview,
      missingPrices,
      expiredPrices,
      lines,
    };
  }

  private static async resolveBudget(designId: string): Promise<number | null> {
    const design = await db.query.designs.findFirst({
      where: eq(designs.id, designId),
      columns: { projectId: true },
    });
    if (!design) return null;
    const briefs = await db.query.designBriefs.findMany({
      where: eq(designBriefs.projectId, design.projectId),
      orderBy: desc(designBriefs.createdAt),
      limit: 1,
      columns: { budget: true },
    });
    const b = briefs[0]?.budget;
    return b === null || b === undefined ? null : Number(b);
  }
}
