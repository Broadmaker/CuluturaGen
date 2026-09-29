import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, culturalElements } from "@/lib/db/schema";
import { getSessionUser, hasRole } from "@/lib/auth/session";
import { ELEMENT_CATEGORIES, isValidStatus, validationTransition } from "@/lib/culture/constants";
import { CultureService } from "@/server/services/culture/CultureService";

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  alternativeNames: z.string().max(1000).optional(),
  category: z.enum(ELEMENT_CATEGORIES).optional(),
  description: z.string().max(8000).nullable().optional(),
  historicalContext: z.string().max(8000).nullable().optional(),
  symbolism: z.string().max(4000).nullable().optional(),
  traditionalUsage: z.string().max(4000).nullable().optional(),
  modernUsage: z.string().max(4000).nullable().optional(),
  appropriateContext: z.string().max(4000).nullable().optional(),
  restrictedContext: z.string().max(4000).nullable().optional(),
  expertNotes: z.string().max(4000).nullable().optional(),
  status: z.string().max(50).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const row = await CultureService.getElementDetail(params.id);
  if (!row) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true, data: row });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const row = await db.query.culturalElements.findFirst({
    where: eq(culturalElements.id, params.id),
  });
  if (!row) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid update." }, { status: 400 });
  }
  const { status, alternativeNames, ...fields } = parsed.data;
  const privileged = hasRole(user, "ADMIN", "CULTURAL_EXPERT");

  // Field edits: experts/admins always; others only on UNVERIFIED records.
  const wantsEdit = Object.keys(fields).length > 0 || alternativeNames !== undefined;
  if (wantsEdit && row.validationStatus !== "UNVERIFIED" && !privileged) {
    return NextResponse.json(
      { ok: false, error: "Only experts can edit records under review or beyond." },
      { status: 403 },
    );
  }

  // Status workflow — md/04 §38.
  if (status !== undefined) {
    if (!isValidStatus(status)) {
      return NextResponse.json({ ok: false, error: `Unknown status: ${status}` }, { status: 400 });
    }
    const allowed = validationTransition(row.validationStatus ?? "UNVERIFIED", status);
    if (allowed === null) {
      return NextResponse.json(
        { ok: false, error: `Cannot move record from ${row.validationStatus} to ${status}.` },
        { status: 422 },
      );
    }
    if (!allowed.some((r) => user.roles.includes(r))) {
      return NextResponse.json(
        { ok: false, error: "Your role cannot perform this transition." },
        { status: 403 },
      );
    }
  }

  const [updated] = await db
    .update(culturalElements)
    .set({
      ...fields,
      ...(alternativeNames !== undefined
        ? { alternativeNames: alternativeNames.split(",").map((s) => s.trim()).filter(Boolean) }
        : {}),
      ...(status !== undefined
        ? {
            validationStatus: status,
            ...(status === "VERIFIED" ? { verifiedBy: user.id, verifiedAt: new Date() } : {}),
          }
        : {}),
    })
    .where(eq(culturalElements.id, row.id))
    .returning();

  await db.insert(auditLogs).values({
    userId: user.id,
    action:
      status !== undefined && status !== row.validationStatus
        ? "CULTURAL_RECORD_VERIFIED"
        : "CULTURAL_RECORD_UPDATED",
    entityType: "CulturalElement",
    entityId: row.id,
    oldValue: { status: row.validationStatus },
    newValue: { status: updated.validationStatus, name: updated.name },
  });

  return NextResponse.json({ ok: true, data: updated });
}
