import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, designBriefs, projects } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

async function findProject(id: string) {
  return db.query.projects.findFirst({
    where: and(eq(projects.id, id), isNull(projects.deletedAt)),
    columns: { id: true },
  });
}

const briefSchema = z.object({
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

// Latest brief with requirements. Projects may not have one yet (created
// before MVP 3 or without context) — GET returns null data in that case.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!(await findProject(params.id))) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  const [brief] = await db.query.designBriefs.findMany({
    where: eq(designBriefs.projectId, params.id),
    orderBy: desc(designBriefs.createdAt),
    limit: 1,
    with: { requirements: true },
  });
  return NextResponse.json({ ok: true, data: brief ?? null });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!(await findProject(params.id))) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  const parsed = briefSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid brief data." }, { status: 400 });
  }
  const { budget, ...rest } = parsed.data;
  const [row] = await db
    .insert(designBriefs)
    .values({
      projectId: params.id,
      ...rest,
      budget: budget === undefined || budget === null ? null : String(budget),
      createdBy: user.id,
    })
    .returning();
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "PROJECT_UPDATED",
    entityType: "DesignBrief",
    entityId: row.id,
  });
  return NextResponse.json({ ok: true, data: row }, { status: 201 });
}
