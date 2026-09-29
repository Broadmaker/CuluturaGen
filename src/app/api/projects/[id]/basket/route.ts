import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { culturalElements, projectCulturalElements, projects } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { BASKET_ROLES } from "@/lib/culture/constants";

async function findProject(id: string) {
  return db.query.projects.findFirst({
    where: and(eq(projects.id, id), isNull(projects.deletedAt)),
    columns: { id: true },
  });
}

// md/08 §23 research basket.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!(await findProject(params.id))) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  const rows = await db.query.projectCulturalElements.findMany({
    where: eq(projectCulturalElements.projectId, params.id),
    with: { element: true },
  });
  return NextResponse.json({ ok: true, data: rows });
}

const addSchema = z.object({
  culturalElementId: z.string().uuid(),
  role: z.enum(BASKET_ROLES).optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!(await findProject(params.id))) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  const parsed = addSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "culturalElementId is required." }, { status: 400 });
  }
  const element = await db.query.culturalElements.findFirst({
    where: eq(culturalElements.id, parsed.data.culturalElementId),
    columns: { id: true },
  });
  if (!element) {
    return NextResponse.json({ ok: false, error: "Element not found." }, { status: 404 });
  }
  await db
    .insert(projectCulturalElements)
    .values({
      projectId: params.id,
      culturalElementId: parsed.data.culturalElementId,
      role: parsed.data.role ?? "REFERENCE",
      notes: parsed.data.notes,
      addedBy: user.id,
    })
    .onConflictDoNothing();
  return NextResponse.json({ ok: true }, { status: 201 });
}
