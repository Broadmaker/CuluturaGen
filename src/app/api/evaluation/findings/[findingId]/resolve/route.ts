import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, designFeedback, evaluationFindings, evaluations } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

const schema = z.object({ comment: z.string().max(2000).optional() });

// Human resolution of a finding. The finding row keeps resolvedBy/at; the
// comment goes to design_feedback so the snapshot stays factual.
export async function POST(
  req: Request,
  { params }: { params: { findingId: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const [finding] = await db
    .select()
    .from(evaluationFindings)
    .where(eq(evaluationFindings.id, params.findingId));
  if (!finding) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const [updated] = await db
    .update(evaluationFindings)
    .set({ resolved: true, resolvedBy: user.id, resolvedAt: new Date() })
    .where(eq(evaluationFindings.id, finding.id))
    .returning();

  if (parsed.data.comment) {
    const [evaluation] = await db
      .select()
      .from(evaluations)
      .where(eq(evaluations.id, finding.evaluationId));
    if (evaluation) {
      await db.insert(designFeedback).values({
        designVersionId: evaluation.designVersionId,
        userId: user.id,
        feedbackType: "EVALUATION",
        comment: parsed.data.comment,
      });
    }
  }

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "EVALUATION_RUN",
    entityType: "EvaluationFinding",
    entityId: finding.id,
    newValue: { resolved: true, comment: parsed.data.comment ?? null },
  });
  return NextResponse.json({ ok: true, data: updated });
}
