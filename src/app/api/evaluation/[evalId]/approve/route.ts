import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, designVersions, evaluationFindings, evaluations, humanReviews } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { DesignService } from "@/server/services/design/DesignService";

const schema = z.object({ comment: z.string().max(2000).optional() });

// Final human approval. The AI never calls this: it requires a signed-in
// human, and is blocked while CRITICAL findings remain unresolved (md/08 §60).
export async function POST(
  req: Request,
  { params }: { params: { evalId: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const [evaluation] = await db.select().from(evaluations).where(eq(evaluations.id, params.evalId));
  if (!evaluation) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const blocking = await db.query.evaluationFindings.findMany({
    where: and(
      eq(evaluationFindings.evaluationId, evaluation.id),
      inArray(evaluationFindings.severity, ["CRITICAL", "HIGH"]),
      eq(evaluationFindings.resolved, false),
    ),
    columns: { id: true, severity: true },
  });
  if (blocking.length > 0) {
    const critical = blocking.filter((f) => f.severity === "CRITICAL").length;
    const high = blocking.length - critical;
    return NextResponse.json(
      { ok: false, error: `${blocking.length} blocking finding(s) remain unresolved (${critical} CRITICAL, ${high} HIGH).` },
      { status: 422 },
    );
  }

  const [review] = await db
    .insert(humanReviews)
    .values({
      designVersionId: evaluation.designVersionId,
      reviewerId: user.id,
      decision: "ACCEPT",
      comments: parsed.data.comment,
      culturalReview: true,
      bodyReview: true,
      costReview: true,
      finalApproval: true,
    })
    .returning();
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "DESIGN_ACCEPTED",
    entityType: "Evaluation",
    entityId: evaluation.id,
  });

  // Lifecycle: human approval moves the design to APPROVED (guarded).
  try {
    const [version] = await db
      .select()
      .from(designVersions)
      .where(eq(designVersions.id, evaluation.designVersionId));
    if (version) await DesignService.setStatus(version.designId, "APPROVED");
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Approval failed." },
      { status },
    );
  }
  return NextResponse.json({ ok: true, data: review }, { status: 201 });
}
