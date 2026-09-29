import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, cultures } from "@/lib/db/schema";
import { getSessionUser, hasRole } from "@/lib/auth/session";

const cultureSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  historicalContext: z.string().max(5000).optional(),
  geographicScope: z.string().max(500).optional(),
});

export async function GET() {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const rows = await db.query.cultures.findMany({
    orderBy: asc(cultures.name),
    with: { communities: { columns: { id: true } } },
  });
  const data = rows.map(({ communities, ...c }) => ({
    ...c,
    communityCount: communities.length,
  }));
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user || !hasRole(user, "ADMIN", "CULTURAL_EXPERT")) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }
  const parsed = cultureSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });
  }
  const [row] = await db.insert(cultures).values(parsed.data).returning();
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "CULTURAL_RECORD_CREATED",
    entityType: "Culture",
    entityId: row.id,
    newValue: { name: row.name },
  });
  return NextResponse.json({ ok: true, data: row }, { status: 201 });
}
