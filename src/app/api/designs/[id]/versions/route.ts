import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { aiJobs, designVersions, designs } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

// Version lineage V1→Vn with job trail (md/02 §47, md/03 §58–59).
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
  });
  const jobs = await db.query.aiJobs.findMany({
    where: eq(aiJobs.designId, params.id),
    orderBy: desc(aiJobs.createdAt),
    columns: { id: true, jobType: true, status: true, provider: true, model: true, designVersionId: true, errorMessage: true, createdAt: true },
  });
  return NextResponse.json({ ok: true, data: { design, versions, jobs } });
}
