import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { auditLogs, designs, evaluationFindings, evaluations, humanReviews } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { DesignService } from "@/server/services/design/DesignService";

// Deliberate final approval (md/08 §64–65). Gated exactly like review
// approval: a signed-in human, a latest evaluation, zero unresolved CRITICAL.
// Sets the design FINAL; the project itself still closes via its own flow.
export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const [design] = await db.select().from(designs).where(eq(designs.id, params.id));
  if (!design) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  if (design.status === "FINAL") {
    return NextResponse.json({ ok: true, data: design, finalized: false });
  }

  // Latest evaluation across this design's versions.
  const versionIds = (
    await db.query.designVersions.findMany({
      where: (v, { eq: e }) => e(v.designId, params.id),
      columns: { id: true },
    })
  ).map((v) => v.id);
  const [evaluation] =
    versionIds.length > 0
      ? await db.query.evaluations.findMany({
          where: (e, { inArray }) => inArray(e.designVersionId, versionIds),
          orderBy: desc(evaluations.createdAt),
          limit: 1,
        })
      : [];
  if (!evaluation) {
    return NextResponse.json(
      { ok: false, error: "Run an evaluation before final approval." },
      { status: 422 },
    );
  }

  const blocking = await db.query.evaluationFindings.findMany({
    where: (f, { and, eq: e, inArray: ia }) =>
      and(
        e(f.evaluationId, evaluation.id),
        ia(f.severity, ["CRITICAL", "HIGH"]),
        e(f.resolved, false),
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
      comments: "Final approval.",
      culturalReview: true,
      bodyReview: true,
      costReview: true,
      finalApproval: true,
    })
    .returning();
  // Guarded FINAL transition (APPROVED/REVIEWED/REVIEW_REQUIRED → FINAL).
  // Stays inside try so an illegal jump surfaces as 409, not 500.
  try {
    await DesignService.setStatus(design.id, "FINAL");
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Final approval failed." },
      { status },
    );
  }
  const [final] = await db.select().from(designs).where(eq(designs.id, design.id));
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "DESIGN_ACCEPTED",
    entityType: "Design",
    entityId: design.id,
    newValue: { status: "FINAL", evaluationId: evaluation.id },
  });
  return NextResponse.json({ ok: true, data: final, review, finalized: true }, { status: 201 });
}
