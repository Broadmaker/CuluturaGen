import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { CostService, type AdHocLine } from "@/server/services/costing/CostService";

const lineSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive().optional(),
  unit: z.string().max(50).optional(),
  unitPrice: z.number().nonnegative().optional(),
});

const schema = z.object({
  designVersionId: z.string().uuid(),
  labor: z.array(lineSchema).max(50).optional(),
  decoration: z.array(lineSchema).max(50).optional(),
  other: z.array(lineSchema).max(50).optional(),
  contingencyPct: z.number().min(0).max(100).optional(),
});

function toLines(items: z.infer<typeof lineSchema>[] | undefined): AdHocLine[] | undefined {
  return items?.map((l) => ({ ...l }));
}

// POST /api/cost — canonical alias of
// /api/versions/[versionId]/cost/calculate (md/09 §60–63). The ONLY way a
// total is produced: deterministic engine, same inputs → same snapshot.
export async function POST(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "designVersionId is required." }, { status: 400 });
  }
  try {
    const result = await CostService.calculate({
      designVersionId: parsed.data.designVersionId,
      userId: user.id,
      labor: toLines(parsed.data.labor),
      decoration: toLines(parsed.data.decoration),
      other: toLines(parsed.data.other),
      contingencyPct: parsed.data.contingencyPct,
    });
    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Calculation failed." },
      { status },
    );
  }
}
