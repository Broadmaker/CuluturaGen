// md/04 §22-24 + md/07 §18-20: recorded contextual restrictions must surface
// as findings when their element is used — never silently ignored.
// Self-cleaning probe rows; skips without DB (like audit-trail.test.ts).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  culturalElements,
  culturalRestrictions,
  designCulturalElements,
  designVersions,
  designs,
  evaluationFindings,
  evaluations,
  explanations,
  projects,
  users,
} from "@/lib/db/schema";
import { EvaluationService } from "@/server/services/evaluation/EvaluationService";

let adminId = "";
let projectId = "";
let elementId = "";
let versionId = "";
let evaluationId = "";

async function dbOk(): Promise<boolean> {
  try {
    await db.execute("select 1");
    return true;
  } catch {
    return false;
  }
}

const ready = () => !!adminId && !!versionId;

beforeAll(async () => {
  if (!(await dbOk())) return;
  const admin = await db.query.users.findFirst({
    where: eq(users.email, "admin@attirelab.local"),
    columns: { id: true },
  });
  if (!admin) return;
  adminId = admin.id;

  const code = `TST-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const [p] = await db
    .insert(projects)
    .values({ projectCode: code, name: "Restriction probe", createdBy: admin.id })
    .returning({ id: projects.id });
  projectId = p.id;

  const elCode = `TST-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const [el] = await db
    .insert(culturalElements)
    .values({
      elementCode: elCode,
      name: "Probe Textile",
      category: "TEXTILE",
      description: "Integration probe — deleted after the test.",
      validationStatus: "VERIFIED",
    })
    .returning({ id: culturalElements.id });
  elementId = el.id;

  await db.insert(culturalRestrictions).values({
    culturalElementId: el.id,
    restrictionType: "CEREMONIAL_ONLY",
    description: "Probe restriction: ceremonial context only.",
    severity: "MEDIUM",
  });

  const [d] = await db
    .insert(designs)
    .values({ projectId, designCode: `${code}-D1`, name: "Probe design", createdBy: admin.id })
    .returning({ id: designs.id });
  const [v] = await db
    .insert(designVersions)
    .values({ designId: d.id, versionNumber: 1, createdBy: admin.id })
    .returning({ id: designVersions.id });
  versionId = v.id;
  await db.insert(designCulturalElements).values({
    designVersionId: v.id,
    culturalElementId: el.id,
    sourceType: "USER_SELECTED",
    approvedByHuman: false,
  });
});

afterAll(async () => {
  if (!ready()) return;
  if (evaluationId) await db.delete(evaluations).where(eq(evaluations.id, evaluationId));
  await db.delete(explanations).where(eq(explanations.designVersionId, versionId));
  await db.delete(designVersions).where(eq(designVersions.id, versionId));
  await db.delete(designs).where(eq(designs.projectId, projectId));
  await db.delete(culturalRestrictions).where(eq(culturalRestrictions.culturalElementId, elementId));
  await db.delete(culturalElements).where(eq(culturalElements.id, elementId));
  await db.delete(projects).where(eq(projects.id, projectId));
});

describe("restriction-context evaluation", () => {
  it("surfaces a CULTURAL_CONTEXT finding for the restricted element", async () => {
    if (!ready()) return;
    const { evaluation } = await EvaluationService.evaluateDesign({
      designVersionId: versionId,
      userId: adminId,
    });
    evaluationId = evaluation.id;

    const rows = await db.query.evaluationFindings.findMany({
      where: eq(evaluationFindings.evaluationId, evaluation.id),
    });
    const hits = rows.filter((r) => (r.evidence ?? "").includes("CULTURAL_CONTEXT"));
    expect(hits.length).toBe(1);
    // CEREMONIAL_ONLY without human approval → HIGH occasion review.
    expect(hits[0].severity).toBe("HIGH");
    expect(hits[0].relatedCulturalElement).toBe(elementId);
  });
});
