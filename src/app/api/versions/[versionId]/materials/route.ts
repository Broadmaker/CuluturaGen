import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, designMaterials, designVersions, materials } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

const linkSchema = z.object({
  materialId: z.string().uuid(),
  quantity: z.number().positive(),
  unit: z.string().max(50).optional(),
  purpose: z.string().max(1000).optional(),
  sourceType: z.string().max(50).optional(),
});

async function findVersion(versionId: string) {
  const [v] = await db.select().from(designVersions).where(eq(designVersions.id, versionId));
  return v ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: { versionId: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!(await findVersion(params.versionId))) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  const rows = await db.query.designMaterials.findMany({
    where: eq(designMaterials.designVersionId, params.versionId),
    with: { material: true },
  });
  return NextResponse.json({ ok: true, data: rows });
}

// Link a material with a required quantity. Source may be DESIGNER or
// AI_SUGGESTED — the engine prices it either way (md/06 §2).
export async function POST(
  req: Request,
  { params }: { params: { versionId: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!(await findVersion(params.versionId))) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  const parsed = linkSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "materialId and positive quantity required." }, { status: 400 });
  }
  const [material] = await db.select().from(materials).where(eq(materials.id, parsed.data.materialId));
  if (!material) return NextResponse.json({ ok: false, error: "Material not found." }, { status: 404 });

  const [row] = await db
    .insert(designMaterials)
    .values({
      designVersionId: params.versionId,
      materialId: parsed.data.materialId,
      quantity: String(parsed.data.quantity),
      unit: parsed.data.unit,
      purpose: parsed.data.purpose,
      sourceType: parsed.data.sourceType ?? "DESIGNER",
    })
    .returning();
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "PROJECT_UPDATED",
    entityType: "DesignMaterial",
    entityId: row.id,
    newValue: { material: material.name, quantity: parsed.data.quantity },
  });
  return NextResponse.json({ ok: true, data: row }, { status: 201 });
}

export async function DELETE(
  req: Request,
  { params }: { params: { versionId: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const materialId = new URL(req.url).searchParams.get("materialId");
  if (!materialId) {
    return NextResponse.json({ ok: false, error: "materialId query param required." }, { status: 400 });
  }
  await db
    .delete(designMaterials)
    .where(
      and(
        eq(designMaterials.designVersionId, params.versionId),
        eq(designMaterials.materialId, materialId),
      ),
    );
  return NextResponse.json({ ok: true });
}
