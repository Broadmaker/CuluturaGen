import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, designBriefs } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

const patchSchema = z.object({
  cultureId: z.string().uuid().nullable().optional(),
  communityId: z.string().uuid().nullable().optional(),
  occasion: z.string().max(255).nullable().optional(),
  garmentType: z.string().max(255).nullable().optional(),
  genderPresentation: z.string().max(100).nullable().optional(),
  style: z.string().max(255).nullable().optional(),
  silhouette: z.string().max(255).nullable().optional(),
  modernTraditionalBalance: z.string().max(100).nullable().optional(),
  desiredComplexity: z.string().max(100).nullable().optional(),
  budget: z.number().positive().nullable().optional(),
  currency: z.string().max(10).optional(),
  description: z.string().max(8000).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; briefId: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid brief data." }, { status: 400 });
  }
  const { budget, ...rest } = parsed.data;
  const [updated] = await db
    .update(designBriefs)
    .set({
      ...rest,
      ...(budget !== undefined ? { budget: budget === null ? null : String(budget) } : {}),
    })
    .where(and(eq(designBriefs.id, params.briefId), eq(designBriefs.projectId, params.id)))
    .returning();
  if (!updated) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "PROJECT_UPDATED",
    entityType: "DesignBrief",
    entityId: updated.id,
  });
  return NextResponse.json({ ok: true, data: updated });
}
