import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, designVersions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { EvaluationService } from "@/server/services/evaluation/EvaluationService";

const schema = z.object({ designVersionId: z.string().uuid() });

// POST /api/evaluation — canonical alias of /api/designs/[id]/evaluate
// (md/09 §65+). Every run inserts a new snapshot; history is never rewritten.
export async function POST(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "designVersionId is required." }, { status: 400 });
  }
  const [version] = await db
    .select({ id: designVersions.id, versionNumber: designVersions.versionNumber })
    .from(designVersions)
    .where(eq(designVersions.id, parsed.data.designVersionId));
  if (!version) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const result = await EvaluationService.evaluateDesign({
    designVersionId: version.id,
    userId: user.id,
  });
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "EVALUATION_RUN",
    entityType: "Evaluation",
    entityId: result.evaluation.id,
    newValue: { version: version.versionNumber, status: result.evaluation.overallStatus },
  });
  return NextResponse.json({ ok: true, data: result }, { status: 201 });
}
