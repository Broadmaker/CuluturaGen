import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, designFeedback, designVersions, designs, evaluationFindings, evaluations } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { DesignService } from "@/server/services/design/DesignService";

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

  // All findings resolved → the design leaves REVIEW_REQUIRED for REVIEWED.
  // Only from REVIEW_REQUIRED: resolving an old evaluation must never yank a
  // design out of REVISION/GENERATING/etc.
  const [evaluation] = await db
    .select()
    .from(evaluations)
    .where(eq(evaluations.id, finding.evaluationId));
  if (evaluation) {
    const open = await db.query.evaluationFindings.findMany({
      where: (f, { and, eq: e }) =>
        and(e(f.evaluationId, evaluation.id), e(f.resolved, false)),
      columns: { id: true },
    });
    if (open.length === 0) {
      const [version] = await db
        .select()
        .from(designVersions)
        .where(eq(designVersions.id, evaluation.designVersionId));
      if (version) {
        const [design] = await db.select().from(designs).where(eq(designs.id, version.designId));
        if (design && design.status === "REVIEW_REQUIRED") {
          await DesignService.setStatus(design.id, "REVIEWED");
        }
      }
    }
  }
  return NextResponse.json({ ok: true, data: updated });
}
