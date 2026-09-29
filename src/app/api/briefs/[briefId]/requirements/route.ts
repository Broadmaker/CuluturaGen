import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, designBriefs, designRequirements } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { REQUIREMENT_CATEGORIES, REQUIREMENT_PRIORITIES } from "@/lib/brief/constants";

const requirementSchema = z.object({
  category: z.enum(REQUIREMENT_CATEGORIES),
  requirement: z.string().min(1).max(2000),
  priority: z.enum(REQUIREMENT_PRIORITIES),
  source: z.string().max(100).optional(),
});

async function findBrief(briefId: string) {
  return db.query.designBriefs.findFirst({
    where: eq(designBriefs.id, briefId),
    columns: { id: true },
  });
}

// md/01 §17 — every requirement carries a priority for the evaluation engine.
export async function POST(
  req: Request,
  { params }: { params: { briefId: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!(await findBrief(params.briefId))) {
    return NextResponse.json({ ok: false, error: "Brief not found." }, { status: 404 });
  }
  const parsed = requirementSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Category, requirement text, and priority are required." },
      { status: 400 },
    );
  }
  const [row] = await db
    .insert(designRequirements)
    .values({ designBriefId: params.briefId, ...parsed.data })
    .returning();
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "PROJECT_UPDATED",
    entityType: "DesignRequirement",
    entityId: row.id,
    newValue: { priority: row.priority, category: row.category },
  });
  return NextResponse.json({ ok: true, data: row }, { status: 201 });
}
