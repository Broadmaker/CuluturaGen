import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, bodyProfiles } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { BODY_FIELDS } from "@/lib/brief/constants";

const measure = z.number().positive().max(500).nullable().optional();
const patchSchema = z.object({
  clientId: z.string().uuid().nullable().optional(),
  heightCm: measure,
  weightKg: measure,
  shoulderWidthCm: measure,
  chestCm: measure,
  waistCm: measure,
  hipCm: measure,
  neckCm: measure,
  armLengthCm: measure,
  torsoLengthCm: measure,
  inseamCm: measure,
  legLengthCm: measure,
  designerVerified: z.boolean().optional(),
  notes: z.string().max(4000).nullable().optional(),
});

// Corrections to the latest profile. New measurement sessions POST a new row.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; bodyId: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Measurements must be positive numbers." }, { status: 400 });
  }
  const { designerVerified, notes, clientId, ...measures } = parsed.data;
  const values: Record<string, string | null | boolean | undefined> = {};
  for (const f of BODY_FIELDS) {
    if (f.key in measures) {
      const v = (measures as Record<string, number | null | undefined>)[f.key];
      values[f.key] = v === undefined || v === null ? null : String(v);
    }
  }
  if (designerVerified !== undefined) values.designerVerified = designerVerified;
  if (notes !== undefined) values.notes = notes;
  if (clientId !== undefined) values.clientId = clientId;

  const [updated] = await db
    .update(bodyProfiles)
    .set(values)
    .where(and(eq(bodyProfiles.id, params.bodyId), eq(bodyProfiles.projectId, params.id)))
    .returning();
  if (!updated) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "PROJECT_UPDATED",
    entityType: "BodyProfile",
    entityId: updated.id,
  });
  return NextResponse.json({ ok: true, data: updated });
}
