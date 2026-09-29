import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, culturalElementRelationships, culturalElements } from "@/lib/db/schema";
import { getSessionUser, hasRole } from "@/lib/auth/session";
import { RELATIONSHIP_TYPES } from "@/lib/culture/constants";

const linkSchema = z
  .object({
    targetElementId: z.string().uuid().optional(),
    cultureId: z.string().uuid().optional(),
    communityId: z.string().uuid().optional(),
    relationshipType: z.enum(RELATIONSHIP_TYPES),
    description: z.string().max(2000).optional(),
  })
  .refine(
    (v) => [v.targetElementId, v.cultureId, v.communityId].filter(Boolean).length === 1,
    { message: "Exactly one of targetElementId, cultureId, communityId is required." },
  );

// Associate the element with a culture, community, or another element —
// md/03 §20 (+ MVP 2 culture/community extension).
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user || !hasRole(user, "ADMIN", "CULTURAL_EXPERT", "DESIGNER", "RESEARCHER")) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }
  const element = await db.query.culturalElements.findFirst({
    where: eq(culturalElements.id, params.id),
    columns: { id: true },
  });
  if (!element) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const parsed = linkSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const [row] = await db
    .insert(culturalElementRelationships)
    .values({ sourceElementId: params.id, ...parsed.data })
    .returning();

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "CULTURAL_RECORD_UPDATED",
    entityType: "CulturalElement",
    entityId: params.id,
    newValue: { link: { type: row.relationshipType } },
  });

  return NextResponse.json({ ok: true, data: row }, { status: 201 });
}
