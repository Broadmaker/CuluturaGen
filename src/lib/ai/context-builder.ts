import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { bodyProfiles, designBriefs, projects } from "@/lib/db/schema";
import { CultureService } from "@/server/services/culture/CultureService";

export interface BasketItem {
  elementId: string;
  elementCode: string;
  name: string;
  category: string | null;
  validationStatus: string | null;
  basketRole: string;
  basketNotes: string | null;
  sources: string[];
  restrictions: { type: string | null; description: string }[];
}

export interface BuiltContext {
  project: { id: string; name: string };
  brief: {
    id: string;
    occasion: string | null;
    garmentType: string | null;
    style: string | null;
    silhouette: string | null;
    modernTraditionalBalance: string | null;
    desiredComplexity: string | null;
    budget: string | null;
    currency: string | null;
    description: string | null;
  } | null;
  requirements: { category: string; requirement: string; priority: string }[];
  cultural: { approved: BasketItem[]; restricted: BasketItem[] };
  body: {
    measurements: Record<string, string | null>;
    source: string | null;
    verified: boolean | null;
  } | null;
  instruction: string | null;
  previousSpec: Record<string, unknown> | null;
}

// md/02 §10 — assembles everything the AI may see. Only basket elements
// (human-selected in MVP 2) enter the cultural context; the model never gets
// the whole knowledge base. Restricted elements are passed as must-avoid,
// never as suggestions.
export async function buildDesignContext(opts: {
  projectId: string;
  instruction?: string;
  previousSpec?: Record<string, unknown> | null;
}): Promise<BuiltContext> {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, opts.projectId),
    columns: { id: true, name: true },
    with: {
      briefs: {
        orderBy: desc(designBriefs.createdAt),
        limit: 1,
        with: { requirements: true },
      },
      basket: { with: { element: true } },
      bodyProfiles: {
        orderBy: desc(bodyProfiles.createdAt),
        limit: 1,
      },
    },
  });
  if (!project) throw new Error("Project not found.");

  const brief = project.briefs[0] ?? null;
  const requirements = (brief?.requirements ?? [])
    .filter((r) => r.isActive !== false)
    .map((r) => ({ category: r.category, requirement: r.requirement, priority: r.priority }));

  // Enrich basket items with sources + restrictions for the context.
  const cultural: BuiltContext["cultural"] = { approved: [], restricted: [] };
  for (const b of project.basket) {
    const detail = await CultureService.getElementDetail(b.element.id);
    const item: BasketItem = {
      elementId: b.element.id,
      elementCode: b.element.elementCode,
      name: b.element.name,
      category: b.element.category,
      validationStatus: b.element.validationStatus,
      basketRole: b.role,
      basketNotes: b.notes,
      sources: (detail?.references ?? []).map((r) => r.reference.referenceCode),
      restrictions: (detail?.restrictions ?? []).map((r) => ({
        type: r.restrictionType,
        description: r.description,
      })),
    };
    if (b.element.validationStatus === "RESTRICTED" || item.restrictions.length > 0) {
      cultural.restricted.push(item);
    } else {
      cultural.approved.push(item);
    }
  }

  const body = project.bodyProfiles[0] ?? null;

  return {
    project: { id: project.id, name: project.name },
    brief: brief
      ? {
          id: brief.id,
          occasion: brief.occasion,
          garmentType: brief.garmentType,
          style: brief.style,
          silhouette: brief.silhouette,
          modernTraditionalBalance: brief.modernTraditionalBalance,
          desiredComplexity: brief.desiredComplexity,
          budget: brief.budget,
          currency: brief.currency,
          description: brief.description,
        }
      : null,
    requirements,
    cultural,
    body: body
      ? {
          measurements: {
            heightCm: body.heightCm,
            weightKg: body.weightKg,
            shoulderWidthCm: body.shoulderWidthCm,
            chestCm: body.chestCm,
            waistCm: body.waistCm,
            hipCm: body.hipCm,
            armLengthCm: body.armLengthCm,
            torsoLengthCm: body.torsoLengthCm,
            inseamCm: body.inseamCm,
            legLengthCm: body.legLengthCm,
          },
          source: body.measurementSource,
          verified: body.designerVerified,
        }
      : null,
    instruction: opts.instruction?.trim() || null,
    previousSpec: opts.previousSpec ?? null,
  };
}
