import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, materials } from "@/lib/db/schema";
import { getSessionUser, hasRole } from "@/lib/auth/session";
import { AVAILABILITY_STATUSES, MATERIAL_CATEGORIES } from "@/lib/cost/constants";

const patchSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  category: z.enum(MATERIAL_CATEGORIES).nullable().optional(),
  description: z.string().max(4000).nullable().optional(),
  unit: z.string().max(50).nullable().optional(),
  fabricWidthCm: z.number().positive().nullable().optional(),
  weightGsm: z.number().positive().nullable().optional(),
  color: z.string().max(100).nullable().optional(),
  culturalAssociation: z.string().max(1000).nullable().optional(),
  availabilityStatus: z.enum(AVAILABILITY_STATUSES).nullable().optional(),
  supplier: z.string().max(255).nullable().optional(),
  minimumQuantity: z.number().positive().nullable().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const row = await db.query.materials.findFirst({
    where: eq(materials.id, params.id),
    with: { prices: true },
  });
  if (!row) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true, data: row });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user || !hasRole(user, "ADMIN", "DESIGNER")) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid material data." }, { status: 400 });
  }
  const { fabricWidthCm, weightGsm, minimumQuantity, ...rest } = parsed.data;
  const num = (v: number | null | undefined) =>
    v === undefined ? undefined : v === null ? null : String(v);
  const [updated] = await db
    .update(materials)
    .set({
      ...rest,
      fabricWidthCm: num(fabricWidthCm),
      weightGsm: num(weightGsm),
      minimumQuantity: num(minimumQuantity),
    })
    .where(eq(materials.id, params.id))
    .returning();
  if (!updated) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "PROJECT_UPDATED",
    entityType: "Material",
    entityId: updated.id,
    newValue: { name: updated.name },
  });
  return NextResponse.json({ ok: true, data: updated });
}
