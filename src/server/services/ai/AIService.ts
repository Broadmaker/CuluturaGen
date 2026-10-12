import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  aiContexts,
  aiJobs,
  auditLogs,
  designCulturalElements,
  designVersions,
  designs,
  fileAssets,
  projects,
} from "@/lib/db/schema";
import { buildDesignContext } from "@/lib/ai/context-builder";
import {
  buildConstraints,
  buildImagePrompt,
  buildSpecPrompt,
} from "@/lib/ai/constraint-engine";
import { designSpecSchema } from "@/lib/ai/spec-schema";
import { validateSpecElements } from "@/lib/ai/output-validator";
import { getProvider } from "@/lib/ai/provider";
import { checkQuota, recordUsage } from "./AiUsage";
import { DesignService } from "@/server/services/design/DesignService";
import { saveGeneratedImage } from "@/lib/storage";

function makeDesignCode(): string {
  return `DES-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

// md/02 §9 + §21: Application → Orchestrator → Context → Constraints →
// LLM (spec) → Image → versioned Design. Synchronous for the thesis demo;
// long-running providers should move to poll-based jobs (md/08 §119).
export class AIService {
  static async generate(opts: {
    projectId: string;
    userId: string;
    instruction?: string;
    baseDesignId?: string;
  }) {
    const provider = getProvider();

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, opts.projectId),
      columns: { id: true, name: true },
    });
    if (!project) throw Object.assign(new Error("Project not found."), { status: 404 });

    // Daily spend quota (md/10 §159) — checked before any work or rows are
    // created. Refinements draw from their own quota, not the generation one.
    const usageKind: "GENERATION" | "REFINEMENT" = opts.baseDesignId ? "REFINEMENT" : "GENERATION";
    await checkQuota(opts.userId, usageKind);

    // Resolve lineage for regenerate/refine.
    let designId = opts.baseDesignId ?? null;
    let versionNumber = 1;
    let parentVersionId: string | null = null;
    let previousSpec: Record<string, unknown> | null = null;
    if (designId) {
      const base = await db.query.designs.findFirst({
        where: eq(designs.id, designId),
        with: { versions: { orderBy: desc(designVersions.versionNumber), limit: 1 } },
      });
      if (!base || base.projectId !== opts.projectId) {
        throw Object.assign(new Error("Design not found in this project."), { status: 404 });
      }
      const current = base.versions[0];
      versionNumber = (current?.versionNumber ?? 0) + 1;
      parentVersionId = current?.id ?? null;
      previousSpec = (current?.designSpecification as Record<string, unknown>) ?? null;
    }

    const ctx = await buildDesignContext({
      projectId: opts.projectId,
      instruction: opts.instruction,
      previousSpec,
    });
    const constraints = buildConstraints(ctx);
    const prompt = buildSpecPrompt(ctx, constraints);

    // Design row (fresh or continuing lineage).
    if (!designId) {
      let created = null;
      for (let i = 0; i < 2 && !created; i++) {
        try {
          [created] = await db
            .insert(designs)
            .values({
              projectId: opts.projectId,
              designCode: makeDesignCode(),
              name: `${project.name} — Concept`,
              status: "GENERATING",
              currentVersion: 1,
              createdBy: opts.userId,
            })
            .returning();
        } catch (e) {
          if (i === 1) throw e;
        }
      }
      designId = created!.id;
    } else {
      // Guarded: regenerating a FINAL design is rejected with 409.
      await DesignService.setStatus(designId, "GENERATING");
    }

    const [version] = await db
      .insert(designVersions)
      .values({
        designId,
        versionNumber,
        parentVersionId,
        visualPrompt: null,
        generationSource: provider.name.toUpperCase(),
        aiModel: process.env.AI_MODEL || provider.name,
        status: "GENERATING",
        createdBy: opts.userId,
      })
      .returning();

    // Persist the exact context for reproducibility (md/03 §33).
    const [aiContext] = await db
      .insert(aiContexts)
      .values({
        designVersionId: version.id,
        context: { project: ctx.project, instruction: ctx.instruction },
        culturalContext: { approved: ctx.cultural.approved, restricted: ctx.cultural.restricted },
        bodyContext: ctx.body,
        budgetContext: constraints.budget,
        materialContext: { note: "Materials module arrives in MVP 5." },
        requirementContext: ctx.requirements,
        constraintContext: {
          mandatory: constraints.mandatory,
          restricted: constraints.restricted,
          mustAvoid: constraints.mustAvoidElements,
        },
      })
      .returning();

    // --- Stage 1: structured spec ---
    const specJob = await this.startJob({
      projectId: opts.projectId,
      designId,
      versionId: version.id,
      type: "DESIGN_SPECIFICATION",
      input: { aiContextId: aiContext.id, prompt },
    });
    let spec;
    let usage = { inputTokens: 0, outputTokens: 0 };
    try {
      const result = await provider.generateSpec(ctx, constraints, prompt);
      spec = designSpecSchema.parse(result.spec);
      usage = result.usage;
    } catch (e) {
      await this.failJob(specJob.id, e);
      await db.update(designVersions).set({ status: "FAILED" }).where(eq(designVersions.id, version.id));
      // Truthful failure state (was: reset to DRAFT, hiding the attempt).
      await DesignService.setStatus(designId, "FAILED");
      throw e;
    }

    // Business/cultural validation (md/05 §32-39): unknown IDs are dropped
    // BEFORE the spec is persisted or linked — a blind insert would
    // FK-violate or launder an invented fact as knowledge. The drop is
    // recorded on the spec itself so the designer sees what the model
    // tried to reference.
    const assessments = await validateSpecElements(spec.culturalElements.map((c) => c.elementId));
    const unknownIds = assessments.filter((a) => a.verdict === "UNKNOWN").map((a) => a.elementId);
    if (unknownIds.length > 0) {
      const dropNote = `Validation dropped ${unknownIds.length} unrecognized cultural reference(s) (${unknownIds.join(", ")}): not in the knowledge base, held for human review instead of linked.`;
      spec = {
        ...spec,
        culturalElements: spec.culturalElements.filter((c) => !unknownIds.includes(c.elementId)),
        constructionNotes: [...spec.constructionNotes, dropNote],
        aiExplanation: {
          ...spec.aiExplanation,
          summary: `${spec.aiExplanation.summary} [Output validation: ${dropNote}]`,
        },
      };
    }
    const elementVerdicts = assessments
      .filter((a) => a.verdict !== "UNKNOWN")
      .map((a) => ({ elementId: a.elementId, verdict: a.verdict, name: a.record?.name ?? null }));

    // The job record keeps the *validated* spec — what was stored and linked.
    await this.finishJob(specJob.id, { spec, usage });
    // Spend ledger (md/10 §158): spec tokens are billable even if the image
    // stage below fails — record them as soon as the stage completes.
    const specCost = await recordUsage({
      jobId: specJob.id,
      userId: opts.userId,
      projectId: opts.projectId,
      kind: usageKind,
      provider: provider.name,
      model: provider.models.spec,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      images: 0,
    });
    let spendUsd = specCost.usd;
    let spendUnpriced = specCost.unpriced;

    await db
      .update(designVersions)
      .set({ designSpecification: spec })
      .where(eq(designVersions.id, version.id));

    // Link used cultural elements (AI_SUGGESTED until a human approves).
    for (const ce of spec.culturalElements) {
      await db
        .insert(designCulturalElements)
        .values({
          designVersionId: version.id,
          culturalElementId: ce.elementId,
          usageDescription: ce.usage,
          sourceType: "AI_SUGGESTED",
          required: false,
          approvedByHuman: false,
        })
        .onConflictDoNothing();
    }

    // --- Stage 2: visual ---
    const imagePrompt = buildImagePrompt(spec, ctx);
    const imageJob = await this.startJob({
      projectId: opts.projectId,
      designId,
      versionId: version.id,
      type: "IMAGE_GENERATION",
      input: { aiContextId: aiContext.id, imagePrompt },
    });
    try {
      const image = await provider.generateImage(imagePrompt, spec);
      const saved = await saveGeneratedImage(designId, versionNumber, image.bytes, image.ext);
      await db
        .update(designVersions)
        .set({
          visualPrompt: imagePrompt,
          generatedImageUrl: saved.url,
          thumbnailUrl: saved.url,
          status: "GENERATED",
        })
        .where(eq(designVersions.id, version.id));
      await db.insert(fileAssets).values({
        projectId: opts.projectId,
        designVersionId: version.id,
        fileType: "GENERATED_IMAGE",
        fileName: `v${versionNumber}.${image.ext}`,
        storageUrl: saved.url,
        mimeType: image.ext === "svg" ? "image/svg+xml" : "image/png",
        fileSize: image.bytes.length,
        uploadedBy: opts.userId,
      });
      await this.finishJob(imageJob.id, { url: saved.url, usage: image.usage });
      const imageCost = await recordUsage({
        jobId: imageJob.id,
        userId: opts.userId,
        projectId: opts.projectId,
        kind: "IMAGE",
        provider: provider.name,
        model: provider.models.image,
        inputTokens: 0,
        outputTokens: 0,
        images: image.usage.images,
      });
      spendUsd += imageCost.usd;
      spendUnpriced = spendUnpriced || imageCost.unpriced;
    } catch (e) {
      // Spec survives image failure (md/08 §121 data preservation).
      await this.failJob(imageJob.id, e);
      await db.update(designVersions).set({ status: "GENERATED" }).where(eq(designVersions.id, version.id));
    }

    await DesignService.setStatus(designId, "GENERATED");
    await db
      .update(designs)
      .set({ currentVersion: versionNumber })
      .where(eq(designs.id, designId));
    await db.insert(auditLogs).values({
      userId: opts.userId,
      action: "DESIGN_GENERATED",
      entityType: "Design",
      entityId: designId,
      newValue: { version: versionNumber, provider: provider.name, droppedUnknown: unknownIds, estimatedCostUsd: spendUsd },
    });

    const [design] = await db.select().from(designs).where(eq(designs.id, designId));
    const [freshVersion] = await db
      .select()
      .from(designVersions)
      .where(eq(designVersions.id, version.id));
    return {
      design,
      version: freshVersion,
      provider: provider.name,
      validation: { droppedUnknown: unknownIds, elements: elementVerdicts },
      spend: { estimatedCostUsd: spendUsd, unpriced: spendUnpriced },
    };
  }

  private static async startJob(opts: {
    projectId: string;
    designId: string;
    versionId: string;
    type: string;
    input: unknown;
  }) {
    const [job] = await db
      .insert(aiJobs)
      .values({
        projectId: opts.projectId,
        designId: opts.designId,
        designVersionId: opts.versionId,
        jobType: opts.type,
        provider: getProvider().name,
        model: process.env.AI_MODEL || getProvider().name,
        status: "PROCESSING",
        inputPayload: opts.input as Record<string, unknown>,
        startedAt: new Date(),
      })
      .returning();
    return job;
  }

  private static async finishJob(id: string, output: unknown) {
    await db
      .update(aiJobs)
      .set({ status: "COMPLETED", outputPayload: output as Record<string, unknown>, completedAt: new Date() })
      .where(eq(aiJobs.id, id));
  }

  private static async failJob(id: string, e: unknown) {
    await db
      .update(aiJobs)
      .set({
        status: "FAILED",
        errorMessage: e instanceof Error ? e.message.slice(0, 2000) : String(e).slice(0, 2000),
        completedAt: new Date(),
      })
      .where(eq(aiJobs.id, id));
  }
}
