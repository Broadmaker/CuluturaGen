import { NextResponse } from "next/server";
import { and, desc, eq, ilike, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { auditLogs, designBriefs, projects } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { projectCreateSchema } from "@/lib/validation/schemas";
import { generateProjectCode } from "@/server/services/design/ProjectService";

async function requireUser() {
  const user = await getSessionUser().catch(() => null);
  return user;
}

// GET /api/projects?status=&q= — md/08 §12 project list.
export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();

  const rows = await db.query.projects.findMany({
    where: and(
      isNull(projects.deletedAt),
      status ? eq(projects.status, status) : undefined,
      q ? ilike(projects.name, `%${q}%`) : undefined,
    ),
    with: { designs: { columns: { id: true } } },
    orderBy: desc(projects.updatedAt),
    limit: 100,
  });

  const data = rows.map(({ designs, ...p }) => ({ ...p, designCount: designs.length }));
  return NextResponse.json({ ok: true, data });
}

// POST /api/projects — md/08 §14 create wizard (info + cultural context + budget).
// A budget/culture context creates an initial design_brief alongside.
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = projectCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Project name is required.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { name, description, cultureId, occasion, budget, targetCompletionDate } =
    parsed.data;

  let created: { id: string } | null = null;
  for (let attempt = 0; attempt < 2 && !created; attempt++) {
    try {
      [created] = await db
        .insert(projects)
        .values({
          projectCode: generateProjectCode(),
          name,
          description,
          createdBy: user.id,
          assignedDesigner: user.id,
          targetCompletionDate: targetCompletionDate ? new Date(targetCompletionDate) : null,
        })
        .returning({ id: projects.id });
    } catch (e) {
      // Retry once on projectCode collision (23505).
      if (attempt === 1) throw e;
    }
  }
  const projectId = created!.id;

  let brief = null;
  if (budget !== undefined || cultureId || occasion) {
    [brief] = await db
      .insert(designBriefs)
      .values({
        projectId,
        cultureId,
        occasion,
        budget: budget !== undefined ? String(budget) : undefined,
        createdBy: user.id,
      })
      .returning();
  }

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "PROJECT_CREATED",
    entityType: "Project",
    entityId: projectId,
    newValue: { name },
  });

  return NextResponse.json({ ok: true, data: { ...project, briefs: brief ? [brief] : [] } }, { status: 201 });
}
