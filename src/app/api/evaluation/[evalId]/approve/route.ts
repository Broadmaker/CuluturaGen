import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, evaluationFindings, evaluations, humanReviews } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

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

  const openCritical = await db.query.evaluationFindings.findMany({
    where: and(
      eq(evaluationFindings.evaluationId, evaluation.id),
      eq(evaluationFindings.severity, "CRITICAL"),
      eq(evaluationFindings.resolved, false),
    ),
    columns: { id: true },
  });
  if (openCritical.length > 0) {
    return NextResponse.json(
      { ok: false, error: `${openCritical.length} CRITICAL finding(s) remain unresolved.` },
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
  return NextResponse.json({ ok: true, data: review }, { status: 201 });
}
