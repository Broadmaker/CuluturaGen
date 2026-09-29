import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { designVersions, designs, evaluationFindings, evaluations } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

// Latest snapshot with findings for a design (across its versions).
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
    columns: { id: true, versionNumber: true },
  });
  if (versions.length === 0) return NextResponse.json({ ok: true, data: null });

  const [latest] = await db.query.evaluations.findMany({
    where: inArray(
      evaluations.designVersionId,
      versions.map((v) => v.id),
    ),
    orderBy: desc(evaluations.createdAt),
    limit: 1,
  });
  if (!latest) return NextResponse.json({ ok: true, data: null });

  const findings = await db.query.evaluationFindings.findMany({
    where: eq(evaluationFindings.evaluationId, latest.id),
    orderBy: desc(evaluationFindings.createdAt),
  });
  const versionNumber = versions.find((v) => v.id === latest.designVersionId)?.versionNumber ?? null;
  return NextResponse.json({ ok: true, data: { evaluation: latest, findings, versionNumber } });
}
