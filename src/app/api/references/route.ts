import { NextResponse } from "next/server";
import { desc, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, culturalReferences } from "@/lib/db/schema";
import { getSessionUser, hasRole } from "@/lib/auth/session";
import { SOURCE_TYPES } from "@/lib/culture/constants";

const referenceSchema = z.object({
  title: z.string().min(1),
  author: z.string().max(500).optional(),
  publicationYear: z.number().int().min(1000).max(2100).optional(),
  publisher: z.string().max(500).optional(),
  sourceType: z.enum(SOURCE_TYPES).optional(),
  url: z.string().url().max(2000).optional().or(z.literal("").optional()),
  citation: z.string().max(2000).optional(),
  description: z.string().max(5000).optional(),
});

export async function GET(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim();
  const rows = await db.query.culturalReferences.findMany({
    where: q
      ? or(
          ilike(culturalReferences.title, `%${q}%`),
          ilike(culturalReferences.author, `%${q}%`),
        )
      : undefined,
    orderBy: desc(culturalReferences.createdAt),
    limit: 100,
  });
  return NextResponse.json({ ok: true, data: rows });
}

function makeCode(): string {
  return `REF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function POST(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user || !hasRole(user, "ADMIN", "CULTURAL_EXPERT", "DESIGNER", "RESEARCHER")) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }
  const parsed = referenceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Title is required." }, { status: 400 });
  }
  let row = null;
  for (let i = 0; i < 2 && !row; i++) {
    try {
      [row] = await db
        .insert(culturalReferences)
        .values({ ...parsed.data, url: parsed.data.url || null, referenceCode: makeCode() })
        .returning();
    } catch (e) {
      if (i === 1) throw e;
    }
  }
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "CULTURAL_RECORD_CREATED",
    entityType: "CulturalReference",
    entityId: row!.id,
    newValue: { title: row!.title },
  });
  return NextResponse.json({ ok: true, data: row }, { status: 201 });
}
