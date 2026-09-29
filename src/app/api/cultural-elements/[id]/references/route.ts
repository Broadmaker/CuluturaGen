import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, culturalElementReferences, culturalElements } from "@/lib/db/schema";
import { getSessionUser, hasRole } from "@/lib/auth/session";

const attachSchema = z.object({ referenceId: z.string().uuid() });

// Attach an existing reference as provenance — md/04 §27 (SUPPORTED_BY).
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

  const parsed = attachSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "referenceId is required." }, { status: 400 });
  }

  await db
    .insert(culturalElementReferences)
    .values({ culturalElementId: params.id, referenceId: parsed.data.referenceId })
    .onConflictDoNothing();

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "CULTURAL_RECORD_UPDATED",
    entityType: "CulturalElement",
    entityId: params.id,
    newValue: { attachedReference: parsed.data.referenceId },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
