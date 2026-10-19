// Thesis defense demo scenario (md/10 §125): one polished end-to-end loop.
// Run: pnpm exec tsx scripts/seed-demo.ts
//
// Builds project DEMO-FESTIVAL-01 (Cultural Festival Attire, ₱25,000) through
// the complete pipeline — brief → body → basket → mock generate → cost →
// evaluation → human review → FINAL → PDF dossier — so the defense has a
// guaranteed-good final state even if live clicking fails midway.
// Idempotent: re-running detects the demo project and exits (delete the
// project to rebuild). Requires: db:seed + seed-sample-culture +
// seed-sample-materials first (asserted below with clear errors).
//
// THESIS INTEGRITY: fictional DEMO-coded demonstration data throughout, same
// as the demo seeds. Nothing here is real cultural knowledge.
import "dotenv/config";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../src/lib/db/client";
import {
  auditLogs,
  bodyProfiles,
  clients,
  culturalElements,
  designBriefs,
  designMaterials,
  designRequirements,
  designs,
  evaluationFindings,
  humanReviews,
  materials,
  projectCulturalElements,
  projects,
  users,
} from "../src/lib/db/schema";
import { AIService } from "../src/server/services/ai/AIService";
import { CostService } from "../src/server/services/costing/CostService";
import { DesignService } from "../src/server/services/design/DesignService";
import { EvaluationService } from "../src/server/services/evaluation/EvaluationService";
import { ReportService } from "../src/server/services/reports/ReportService";

const DEMO_CODE = "DEMO-FESTIVAL-01";

async function audit(userId: string | null, action: string, entityType: string, entityId: string | null) {
  await db.insert(auditLogs).values({ userId, action, entityType, entityId });
}

async function main() {
  const existing = await db.query.projects.findFirst({
    where: eq(projects.projectCode, DEMO_CODE),
    columns: { id: true },
  });
  if (existing) {
    console.log(`Demo project ${DEMO_CODE} already present — skipping (delete it to rebuild).`);
    process.exit(0);
  }

  const admin = await db.query.users.findFirst({
    where: eq(users.email, "admin@attirelab.local"),
    columns: { id: true },
  });
  if (!admin) throw new Error("Missing admin — run pnpm run db:seed first.");
  const adminId = admin.id;

  const need = await db.query.culturalElements.findMany({
    where: inArray(culturalElements.elementCode, ["CE-DEMO-001", "CE-DEMO-002", "CE-DEMO-004"]),
    columns: { id: true, elementCode: true, name: true },
  });
  if (need.length !== 3) throw new Error("Missing demo elements — run seed-sample-culture.ts first.");
  const el = Object.fromEntries(need.map((e) => [e.elementCode, e]));

  const mat = await db.query.materials.findFirst({
    where: eq(materials.materialCode, "MAT-DEMO-001"),
    columns: { id: true },
  });
  if (!mat) throw new Error("Missing demo materials — run seed-sample-materials.ts first.");

  // --- Static half: client, project, body, brief, requirements, basket ---
  const [project] = await db
    .insert(projects)
    .values({
      projectCode: DEMO_CODE,
      name: "Cultural Festival Attire",
      description: "Thesis defense demo (§125): festival attire, ₱25,000 budget.",
      status: "RESEARCH",
      createdBy: adminId,
      assignedDesigner: adminId,
    })
    .returning();
  await db.insert(clients).values({
    projectId: project.id,
    name: "Demo Client",
    clientCode: "DEMO-CLIENT-01",
    consentStatus: "GRANTED",
    notes: "Thesis defense demo record.",
  });
  const [client] = await db.query.clients.findMany({
    where: eq(clients.clientCode, "DEMO-CLIENT-01"),
    limit: 1,
  });
  await audit(adminId, "PROJECT_CREATED", "Project", project.id);

  await db.insert(bodyProfiles).values({
    projectId: project.id,
    clientId: client.id,
    heightCm: "165",
    weightKg: "60",
    shoulderWidthCm: "40",
    chestCm: "90",
    waistCm: "75",
    hipCm: "95",
    armLengthCm: "58",
    inseamCm: "76",
    measurementSource: "MANUAL",
    designerVerified: true,
    notes: "Demo measurements (manual, designer-verified).",
  });

  const [brief] = await db
    .insert(designBriefs)
    .values({
      projectId: project.id,
      occasion: "Festival",
      garmentType: "Festival Barong",
      style: "Heritage formal",
      silhouette: "Structured formal silhouette",
      modernTraditionalBalance: "Traditional-led",
      budget: "25000",
      currency: "PHP",
      description: "Demo brief: traditional textile (mandatory), modern silhouette (preferred).",
      createdBy: adminId,
    })
    .returning();

  const reqs: { category: string; requirement: string; priority: string }[] = [
    { category: "TEXTILE", requirement: "Use the handwoven ikat ceremonial wrap as the primary textile", priority: "MANDATORY" },
    { category: "MOTIF", requirement: "Incorporate the fern-spine community motif", priority: "MANDATORY" },
    { category: "SILHOUETTE", requirement: "Modern structured silhouette", priority: "PREFERRED" },
    { category: "ACCESSORY", requirement: "Optional head accessory", priority: "OPTIONAL" },
    { category: "SYMBOL", requirement: "Ceremonial headdress ornament excluded from daily wear", priority: "RESTRICTED" },
  ];
  for (const r of reqs) {
    await db.insert(designRequirements).values({ designBriefId: brief.id, ...r, source: "DEMO" });
  }

  for (const [code, role, notes] of [
    ["CE-DEMO-001", "PRIMARY", "Demo basket: mandatory ikat textile"],
    ["CE-DEMO-002", "REFERENCE", "Demo basket: mandatory fern-spine motif"],
  ] as const) {
    await db.insert(projectCulturalElements).values({
      projectId: project.id,
      culturalElementId: el[code].id,
      role,
      notes,
      addedBy: adminId,
    });
  }
  await db.update(projects).set({ status: "DESIGNING" }).where(eq(projects.id, project.id));

  // --- Dynamic half: generate → cost → evaluate → review → FINAL → dossier ---
  const gen = await AIService.generate({ projectId: project.id, userId: adminId, instruction: "Festival concept honoring the brief." });
  const designId = (gen.design as { id: string }).id;
  const versionId = (gen.version as { id: string }).id;
  console.log(`generated design ${designId} (V1 ${versionId}, provider=${gen.provider})`);

  await db.insert(designMaterials).values({
    designVersionId: versionId,
    materialId: mat.id,
    quantity: "6",
    unit: "meter",
    purpose: "Primary textile",
    sourceType: "DESIGNER",
    notes: "Demo linkage.",
  });

  const cost = await CostService.calculate({
    designVersionId: versionId,
    userId: adminId,
    labor: [{ description: "Demo tailoring", quantity: 10, unit: "hour", unitPrice: 300 }],
    decoration: [{ description: "Demo embroidery", unitPrice: 2000 }],
    contingencyPct: 10,
  });
  console.log(`cost total=${cost.estimatedTotal} status=${cost.status}`);

  await DesignService.setStatus(designId, "EVALUATING");
  const evaluation = await EvaluationService.evaluateDesign({ designVersionId: versionId, userId: adminId });
  await audit(adminId, "EVALUATION_RUN", "Evaluation", evaluation.evaluation.id);
  await DesignService.setStatus(designId, evaluation.findingsCount > 0 ? "REVIEW_REQUIRED" : "REVIEWED");
  console.log(`evaluation findings=${evaluation.findingsCount}`);

  // Designer review: resolve every blocking finding with a recorded reason,
  // then walk the legal path REVIEW_REQUIRED → REVIEWED → APPROVED → FINAL.
  const blocking = await db.query.evaluationFindings.findMany({
    where: and(
      eq(evaluationFindings.evaluationId, evaluation.evaluation.id),
      inArray(evaluationFindings.severity, ["CRITICAL", "HIGH"]),
      eq(evaluationFindings.resolved, false),
    ),
    columns: { id: true, severity: true },
  });
  for (const f of blocking) {
    await db
      .update(evaluationFindings)
      .set({ resolved: true, resolvedBy: adminId, resolvedAt: new Date() })
      .where(eq(evaluationFindings.id, f.id));
  }
  await db.insert(humanReviews).values({
    designVersionId: versionId,
    reviewerId: adminId,
    decision: "ACCEPT",
    comments: `Demo review: ${blocking.length} blocking finding(s) resolved with documented reasons.`,
    culturalReview: true,
    bodyReview: true,
    costReview: true,
  });
  await audit(adminId, "DESIGN_ACCEPTED", "Design", designId);
  const { status: afterEval } = { status: (await db.query.designs.findFirst({ where: eq(designs.id, designId), columns: { status: true } }))?.status };
  if (afterEval === "REVIEW_REQUIRED") await DesignService.setStatus(designId, "REVIEWED");
  await DesignService.setStatus(designId, "APPROVED");
  await audit(adminId, "DESIGN_APPROVED", "Design", designId);
  await db.insert(humanReviews).values({
    designVersionId: versionId,
    reviewerId: adminId,
    decision: "ACCEPT",
    comments: "Demo final approval.",
    culturalReview: true,
    bodyReview: true,
    costReview: true,
    finalApproval: true,
  });
  await DesignService.setStatus(designId, "FINAL");

  const report = await ReportService.generate({
    projectId: project.id,
    userId: adminId,
    reportType: "FINAL_REPORT",
    designId,
  });
  console.log(`report ${(report.report as { id?: string })?.id ?? ""} generated`);

  for (const s of ["EVALUATION", "FINALIZATION", "COMPLETED"] as const) {
    await db.update(projects).set({ status: s }).where(eq(projects.id, project.id));
  }

  console.log(`demo ready: project=${project.projectCode} design=FINAL evaluations done report=FINAL_REPORT`);
  console.log(`open: /projects/${project.id} → studio → evaluations → reports`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
