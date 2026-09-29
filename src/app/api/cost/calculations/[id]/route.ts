import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { costEstimates, costItems, designVersions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

// Immutable snapshot as stored (md/06 §21–22): values, never re-resolved.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const [estimate] = await db.select().from(costEstimates).where(eq(costEstimates.id, params.id));
  if (!estimate) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  const items = await db.query.costItems.findMany({
    where: eq(costItems.costEstimateId, params.id),
  });
  return NextResponse.json({ ok: true, data: { ...estimate, items } });
}
