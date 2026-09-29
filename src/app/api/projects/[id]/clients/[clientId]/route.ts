import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, clients } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

const updateSchema = z.object({
  name: z.string().max(255).nullable().optional(),
  genderPresentation: z.string().max(100).nullable().optional(),
  ageRange: z.string().max(50).nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
  consentStatus: z.string().max(50).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; clientId: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid client data." }, { status: 400 });
  }
  const [updated] = await db
    .update(clients)
    .set(parsed.data)
    .where(and(eq(clients.id, params.clientId), eq(clients.projectId, params.id)))
    .returning();
  if (!updated) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "PROJECT_UPDATED",
    entityType: "Client",
    entityId: updated.id,
    newValue: { name: updated.name },
  });
  return NextResponse.json({ ok: true, data: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; clientId: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const deleted = await db
    .delete(clients)
    .where(and(eq(clients.id, params.clientId), eq(clients.projectId, params.id)))
    .returning({ id: clients.id });
  if (deleted.length === 0) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
