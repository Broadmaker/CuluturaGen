// md/06 §56 + §91-92: CostService fails fast with structured 422s on invalid
// inputs (bypassing route-level zod by writing link rows directly).
// Self-cleaning probe rows; skips without DB.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  costEstimates,
  designBriefs,
  designMaterials,
  designVersions,
  designs,
  materials,
  projects,
  users,
} from "@/lib/db/schema";
import { CostService } from "@/server/services/costing/CostService";

let adminId = "";
let projectId = "";
let versionId = "";
let materialId = "";

async function dbOk(): Promise<boolean> {
  try {
    await db.execute("select 1");
    return true;
  } catch {
    return false;
  }
}

const ready = () => !!adminId && !!versionId && !!materialId;

async function expectCostError(
  opts: Parameters<typeof CostService.calculate>[0],
  code: string,
): Promise<void> {
  try {
    await CostService.calculate(opts);
  } catch (e) {
    const err = e as { status?: number; code?: string; details?: { code: string }[] };
    expect(err.status).toBe(422);
    expect(err.code).toBe("COST_VALIDATION_FAILED");
    expect((err.details ?? []).some((d) => d.code === code)).toBe(true);
    return;
  }
  throw new Error(`expected COST_VALIDATION_FAILED/${code}, calculation succeeded`);
}

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
    .values({ projectCode: code, name: "Cost validation probe", createdBy: admin.id })
    .returning({ id: projects.id });
  projectId = p.id;
  await db.insert(designBriefs).values({
    projectId,
    budget: "5000",
    currency: "PHP",
    createdBy: admin.id,
  });

  const [m] = await db
    .insert(materials)
    .values({ materialCode: `${code}-MAT`, name: "Probe Silk", unit: "meter" })
    .returning({ id: materials.id });
  materialId = m.id;

  const [d] = await db
    .insert(designs)
    .values({ projectId, designCode: `${code}-D1`, name: "Probe design", createdBy: admin.id })
    .returning({ id: designs.id });
  const [v] = await db
    .insert(designVersions)
    .values({ designId: d.id, versionNumber: 1, createdBy: admin.id })
    .returning({ id: designVersions.id });
  versionId = v.id;
});

afterAll(async () => {
  if (!ready()) return;
  await db.delete(costEstimates).where(eq(costEstimates.designVersionId, versionId));
  await db.delete(designMaterials).where(eq(designMaterials.designVersionId, versionId));
  await db.delete(designVersions).where(eq(designVersions.id, versionId));
  await db.delete(designs).where(eq(designs.projectId, projectId));
  await db.delete(designBriefs).where(eq(designBriefs.projectId, projectId));
  await db.delete(materials).where(eq(materials.id, materialId));
  await db.delete(projects).where(eq(projects.id, projectId));
});

describe("CostService input validation", () => {
  it("rejects a zero-quantity link row (INVALID_QUANTITY)", async () => {
    if (!ready()) return;
    await db.insert(designMaterials).values({
      designVersionId: versionId,
      materialId,
      quantity: "0",
      unit: "meter",
    });
    await expectCostError(
      { designVersionId: versionId, userId: adminId },
      "INVALID_QUANTITY",
    );
    await db.delete(designMaterials).where(eq(designMaterials.designVersionId, versionId));
  });

  it("rejects negative ad-hoc prices and out-of-range contingency", async () => {
    if (!ready()) return;
    await expectCostError(
      {
        designVersionId: versionId,
        userId: adminId,
        labor: [{ description: "X", quantity: 1, unitPrice: -50 }],
      },
      "INVALID_PRICE",
    );
    await expectCostError(
      { designVersionId: versionId, userId: adminId, contingencyPct: 101 },
      "INVALID_CONTINGENCY",
    );
  });

  it("rejects a mismatched brief currency (CURRENCY_MISMATCH)", async () => {
    if (!ready()) return;
    await db
      .update(designBriefs)
      .set({ currency: "USD" })
      .where(eq(designBriefs.projectId, projectId));
    await expectCostError(
      { designVersionId: versionId, userId: adminId },
      "CURRENCY_MISMATCH",
    );
    await db
      .update(designBriefs)
      .set({ currency: "PHP" })
      .where(eq(designBriefs.projectId, projectId));
  });

  it("still calculates cleanly with valid inputs", async () => {
    if (!ready()) return;
    await db.insert(designMaterials).values({
      designVersionId: versionId,
      materialId,
      quantity: "2",
      unit: "meter",
    });
    // No prices for the probe material → INCOMPLETE snapshot, never invented.
    const r = await CostService.calculate({ designVersionId: versionId, userId: adminId });
    expect(r.status).toBe("INCOMPLETE");
    expect(r.missingPrices.length).toBe(1);
  });
});
