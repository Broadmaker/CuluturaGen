import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, communities } from "@/lib/db/schema";
import { getSessionUser, hasRole } from "@/lib/auth/session";

const communitySchema = z.object({
  cultureId: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  geographicArea: z.string().max(500).optional(),
});

export async function GET(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const cultureId = new URL(req.url).searchParams.get("cultureId");
  const rows = await db.query.communities.findMany({
    where: cultureId ? eq(communities.cultureId, cultureId) : undefined,
    orderBy: asc(communities.name),
    with: { culture: { columns: { id: true, name: true } } },
  });
  return NextResponse.json({ ok: true, data: rows });
}

export async function POST(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user || !hasRole(user, "ADMIN", "CULTURAL_EXPERT")) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }
  const parsed = communitySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });
  }
  const [row] = await db.insert(communities).values(parsed.data).returning();
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "CULTURAL_RECORD_CREATED",
    entityType: "Community",
    entityId: row.id,
    newValue: { name: row.name },
  });
  return NextResponse.json({ ok: true, data: row }, { status: 201 });
}
