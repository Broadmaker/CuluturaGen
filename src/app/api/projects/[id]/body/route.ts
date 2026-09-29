import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, bodyProfiles, projects } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { BODY_FIELDS } from "@/lib/brief/constants";

async function findProject(id: string) {
  return db.query.projects.findFirst({
    where: and(eq(projects.id, id), isNull(projects.deletedAt)),
    columns: { id: true },
  });
}

const measure = z.number().positive().max(500).optional();
const bodySchema = z.object({
  clientId: z.string().uuid().nullable().optional(),
  heightCm: measure,
  weightKg: measure,
  shoulderWidthCm: measure,
  chestCm: measure,
  waistCm: measure,
  hipCm: measure,
  neckCm: measure,
  armLengthCm: measure,
  torsoLengthCm: measure,
  inseamCm: measure,
  legLengthCm: measure,
  designerVerified: z.boolean().optional(),
  notes: z.string().max(4000).optional(),
});

// Latest profile per project. Every POST inserts a new row (history is
// preserved); corrections go through PATCH on the latest.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!(await findProject(params.id))) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  const rows = await db.query.bodyProfiles.findMany({
    where: eq(bodyProfiles.projectId, params.id),
    orderBy: desc(bodyProfiles.createdAt),
    limit: 10,
    with: { client: { columns: { id: true, name: true } } },
  });
  return NextResponse.json({ ok: true, data: rows });
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
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Measurements must be positive numbers." }, { status: 400 });
  }
  const { designerVerified, ...measures } = parsed.data;
  const values: Record<string, string | null> = {};
  for (const f of BODY_FIELDS) {
    const v = (measures as Record<string, number | undefined>)[f.key];
    values[f.key] = v !== undefined ? String(v) : null;
  }
  const [row] = await db
    .insert(bodyProfiles)
    .values({
      projectId: params.id,
      clientId: parsed.data.clientId ?? null,
      ...values,
      // MVP 3 is manual entry only. Computer-vision estimates arrive later
      // and must be labeled ESTIMATED (md/01 §15) — never silently MANUAL.
      measurementSource: "MANUAL",
      designerVerified: designerVerified ?? false,
      notes: parsed.data.notes,
    })
    .returning();
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "PROJECT_UPDATED",
    entityType: "BodyProfile",
    entityId: row.id,
  });
  return NextResponse.json({ ok: true, data: row }, { status: 201 });
}
