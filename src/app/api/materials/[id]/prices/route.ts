import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, materialPrices, materials } from "@/lib/db/schema";
import { getSessionUser, hasRole } from "@/lib/auth/session";
import { PRICE_SOURCES } from "@/lib/cost/constants";

const priceSchema = z.object({
  price: z.number().nonnegative(),
  currency: z.string().max(10).optional(),
  unit: z.string().max(50).optional(),
  supplier: z.string().max(255).optional(),
  effectiveDate: z.string().optional(),
  expirationDate: z.string().nullable().optional(),
  source: z.enum(PRICE_SOURCES).optional(),
  verified: z.boolean().optional(),
});

// Prices are append-only history (md/06 §20) — this endpoint lists them.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const rows = await db.query.materialPrices.findMany({
    where: eq(materialPrices.materialId, params.id),
    orderBy: desc(materialPrices.effectiveDate),
  });
  return NextResponse.json({ ok: true, data: rows });
}

// A new price never overwrites: it appends a history row with its own
// effective date. Old cost snapshots keep pointing at old values.
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user || !hasRole(user, "ADMIN", "DESIGNER")) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }
  const [material] = await db.select().from(materials).where(eq(materials.id, params.id));
  if (!material) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const parsed = priceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Price must be a non-negative number." }, { status: 400 });
  }
  const { effectiveDate, expirationDate, ...rest } = parsed.data;
  const [row] = await db
    .insert(materialPrices)
    .values({
      materialId: params.id,
      ...rest,
      price: String(rest.price),
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      expirationDate: expirationDate ? new Date(expirationDate) : null,
    })
    .returning();
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "PROJECT_UPDATED",
    entityType: "MaterialPrice",
    entityId: row.id,
    newValue: { price: row.price, material: material.name },
  });
  return NextResponse.json({ ok: true, data: row }, { status: 201 });
}
