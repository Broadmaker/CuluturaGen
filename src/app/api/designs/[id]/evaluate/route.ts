import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, designVersions, designs } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { EvaluationService } from "@/server/services/evaluation/EvaluationService";

const schema = z.object({ versionNumber: z.number().int().positive().optional() });

// Every run inserts a new evaluation snapshot — history is never rewritten.
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const [design] = await db.select().from(designs).where(eq(designs.id, params.id));
  if (!design) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const versions = await db.query.designVersions.findMany({
    where: eq(designVersions.designId, params.id),
    orderBy: desc(designVersions.versionNumber),
    columns: { id: true, versionNumber: true },
  });
  const target = parsed.data.versionNumber
    ? versions.find((v) => v.versionNumber === parsed.data.versionNumber)
    : versions[0];
  if (!target) return NextResponse.json({ ok: false, error: "No versions to evaluate." }, { status: 404 });

  const result = await EvaluationService.evaluateDesign({
    designVersionId: target.id,
    userId: user.id,
  });
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "EVALUATION_RUN",
    entityType: "Evaluation",
    entityId: result.evaluation.id,
    newValue: { version: target.versionNumber, status: result.evaluation.overallStatus },
  });
  return NextResponse.json({ ok: true, data: result }, { status: 201 });
}
