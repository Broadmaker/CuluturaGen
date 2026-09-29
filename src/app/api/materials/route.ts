import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, materials } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { AVAILABILITY_STATUSES, MATERIAL_CATEGORIES } from "@/lib/cost/constants";

const materialSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.enum(MATERIAL_CATEGORIES).optional(),
  description: z.string().max(4000).optional(),
  unit: z.string().max(50).optional(),
  fabricWidthCm: z.number().positive().optional(),
  weightGsm: z.number().positive().optional(),
  color: z.string().max(100).optional(),
  culturalAssociation: z.string().max(1000).optional(),
  availabilityStatus: z.enum(AVAILABILITY_STATUSES).optional(),
  supplier: z.string().max(255).optional(),
  minimumQuantity: z.number().positive().optional(),
});

export async function GET(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim();
  const category = sp.get("category");

  const rows = await db.query.materials.findMany({
    where: and(
      q ? or(ilike(materials.name, `%${q}%`), ilike(materials.description, `%${q}%`)) : undefined,
      category ? eq(materials.category, category) : undefined,
    ),
    orderBy: desc(materials.updatedAt),
    limit: 100,
    with: { prices: true },
  });
  // Attach latest price per material (price history itself lives on detail).
  const data = rows.map((m) => ({
    ...m,
    latestPrice: [...m.prices].sort(
      (a, b) => +new Date(b.effectiveDate ?? b.createdAt ?? 0) - +new Date(a.effectiveDate ?? a.createdAt ?? 0),
    )[0] ?? null,
  }));
  return NextResponse.json({ ok: true, data });
}

function makeCode(): string {
  return `MAT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function POST(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = materialSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });
  }
  const { fabricWidthCm, weightGsm, minimumQuantity, ...rest } = parsed.data;
  let row = null;
  for (let i = 0; i < 2 && !row; i++) {
    try {
      [row] = await db
        .insert(materials)
        .values({
          ...rest,
          materialCode: makeCode(),
          fabricWidthCm: fabricWidthCm !== undefined ? String(fabricWidthCm) : undefined,
          weightGsm: weightGsm !== undefined ? String(weightGsm) : undefined,
          minimumQuantity: minimumQuantity !== undefined ? String(minimumQuantity) : undefined,
        })
        .returning();
    } catch (e) {
      if (i === 1) throw e;
    }
  }
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "PROJECT_UPDATED",
    entityType: "Material",
    entityId: row!.id,
    newValue: { name: row!.name },
  });
  return NextResponse.json({ ok: true, data: row }, { status: 201 });
}
