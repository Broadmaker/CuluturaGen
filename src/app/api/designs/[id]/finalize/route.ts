import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { auditLogs, designs, evaluationFindings, evaluations, humanReviews } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

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

  const openCritical = await db.query.evaluationFindings.findMany({
    where: (f, { and, eq: e }) =>
      and(e(f.evaluationId, evaluation.id), e(f.severity, "CRITICAL"), e(f.resolved, false)),
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
      comments: "Final approval.",
      culturalReview: true,
      bodyReview: true,
      costReview: true,
      finalApproval: true,
    })
    .returning();
  const [final] = await db
    .update(designs)
    .set({ status: "FINAL" })
    .where(eq(designs.id, design.id))
    .returning();
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "DESIGN_ACCEPTED",
    entityType: "Design",
    entityId: design.id,
    newValue: { status: "FINAL", evaluationId: evaluation.id },
  });
  return NextResponse.json({ ok: true, data: final, review, finalized: true }, { status: 201 });
}
