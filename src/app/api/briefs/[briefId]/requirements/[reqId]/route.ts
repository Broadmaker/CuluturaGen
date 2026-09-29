import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, designRequirements } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { REQUIREMENT_CATEGORIES, REQUIREMENT_PRIORITIES } from "@/lib/brief/constants";

const patchSchema = z.object({
  category: z.enum(REQUIREMENT_CATEGORIES).optional(),
  requirement: z.string().min(1).max(2000).optional(),
  priority: z.enum(REQUIREMENT_PRIORITIES).optional(),
  source: z.string().max(100).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { briefId: string; reqId: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid requirement data." }, { status: 400 });
  }
  const [updated] = await db
    .update(designRequirements)
    .set(parsed.data)
    .where(
      and(
        eq(designRequirements.id, params.reqId),
        eq(designRequirements.designBriefId, params.briefId),
      ),
    )
    .returning();
  if (!updated) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "PROJECT_UPDATED",
    entityType: "DesignRequirement",
    entityId: updated.id,
    newValue: { priority: updated.priority, isActive: updated.isActive },
  });
  return NextResponse.json({ ok: true, data: updated });
}

// Deactivation, not deletion — requirement history stays traceable for MVP 6.
export async function DELETE(
  _req: Request,
  { params }: { params: { briefId: string; reqId: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const [updated] = await db
    .update(designRequirements)
    .set({ isActive: false })
    .where(
      and(
        eq(designRequirements.id, params.reqId),
        eq(designRequirements.designBriefId, params.briefId),
      ),
    )
    .returning();
  if (!updated) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
