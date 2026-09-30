import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, designVersions, evaluations, humanReviews } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { DesignService } from "@/server/services/design/DesignService";

const schema = z.object({
  comment: z.string().min(1).max(2000),
  findingIds: z.array(z.string().uuid()).max(50).optional(),
});

// Sends the design back for another version cycle (md/07 §75–76).
export async function POST(
  req: Request,
  { params }: { params: { evalId: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Revision instructions are required." }, { status: 400 });
  }
  const [evaluation] = await db.select().from(evaluations).where(eq(evaluations.id, params.evalId));
  if (!evaluation) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  try {
    const [version] = await db
      .select()
      .from(designVersions)
      .where(eq(designVersions.id, evaluation.designVersionId));
    if (version) await DesignService.setStatus(version.designId, "REVISION");
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Revision request failed." },
      { status },
    );
  }

  const [review] = await db
    .insert(humanReviews)
    .values({
      designVersionId: evaluation.designVersionId,
      reviewerId: user.id,
      decision: "REQUEST_REVISION",
      comments: parsed.data.comment,
      finalApproval: false,
    })
    .returning();
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "DESIGN_MODIFIED",
    entityType: "Evaluation",
    entityId: evaluation.id,
    newValue: { revisionRequested: true, findings: parsed.data.findingIds ?? [] },
  });
  return NextResponse.json({ ok: true, data: review }, { status: 201 });
}
