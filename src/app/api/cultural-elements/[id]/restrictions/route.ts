import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, culturalElements, culturalRestrictions } from "@/lib/db/schema";
import { getSessionUser, hasRole } from "@/lib/auth/session";
import { RESTRICTION_TYPES } from "@/lib/culture/constants";

const restrictionSchema = z.object({
  cultureId: z.string().uuid().optional(),
  communityId: z.string().uuid().optional(),
  restrictionType: z.enum(RESTRICTION_TYPES),
  description: z.string().min(1).max(4000),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  sourceReferenceId: z.string().uuid().optional(),
});

// Restrictions are first-class knowledge — md/04 §23. Expert-gated.
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user || !hasRole(user, "ADMIN", "CULTURAL_EXPERT")) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }
  const element = await db.query.culturalElements.findFirst({
    where: eq(culturalElements.id, params.id),
    columns: { id: true },
  });
  if (!element) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const parsed = restrictionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Type and description are required." }, { status: 400 });
  }

  const [row] = await db
    .insert(culturalRestrictions)
    .values({ culturalElementId: params.id, ...parsed.data })
    .returning();

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "CULTURAL_RECORD_UPDATED",
    entityType: "CulturalElement",
    entityId: params.id,
    newValue: { restriction: row.restrictionType },
  });

  return NextResponse.json({ ok: true, data: row }, { status: 201 });
}
