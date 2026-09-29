import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { costEstimates, designVersions, designs } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

// Cost history across versions: V1 → ₱x, V2 → ₱y (md/06 §71).
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const [design] = await db.select().from(designs).where(eq(designs.id, params.id));
  if (!design) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const versions = await db.query.designVersions.findMany({
    where: eq(designVersions.designId, params.id),
    orderBy: desc(designVersions.versionNumber),
    columns: { id: true, versionNumber: true },
  });
  if (versions.length === 0) return NextResponse.json({ ok: true, data: [] });

  const estimates = await db.query.costEstimates.findMany({
    where: inArray(
      costEstimates.designVersionId,
      versions.map((v) => v.id),
    ),
    orderBy: desc(costEstimates.calculatedAt),
  });
  const byVersion = new Map(versions.map((v) => [v.id, v.versionNumber]));
  const data = estimates.map((e) => ({ ...e, versionNumber: byVersion.get(e.designVersionId) ?? null }));
  return NextResponse.json({ ok: true, data });
}
