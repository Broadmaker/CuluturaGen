import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, clients, projects } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

async function findProject(id: string) {
  return db.query.projects.findFirst({
    where: and(eq(projects.id, id), isNull(projects.deletedAt)),
    columns: { id: true },
  });
}

const clientSchema = z.object({
  name: z.string().max(255).optional(),
  genderPresentation: z.string().max(100).optional(),
  ageRange: z.string().max(50).optional(),
  notes: z.string().max(4000).optional(),
  consentStatus: z.string().max(50).optional(),
});

// Minimal identifying info only — md/02 §33 privacy.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!(await findProject(params.id))) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  const rows = await db.query.clients.findMany({
    where: eq(clients.projectId, params.id),
    orderBy: desc(clients.createdAt),
  });
  return NextResponse.json({ ok: true, data: rows });
}

function makeCode(): string {
  return `CL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
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
  const parsed = clientSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid client data." }, { status: 400 });
  }
  const [row] = await db
    .insert(clients)
    .values({ projectId: params.id, clientCode: makeCode(), ...parsed.data })
    .returning();
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "PROJECT_UPDATED",
    entityType: "Client",
    entityId: row.id,
    newValue: { name: row.name },
  });
  return NextResponse.json({ ok: true, data: row }, { status: 201 });
}
