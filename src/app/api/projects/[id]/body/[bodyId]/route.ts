import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { aiJobs, auditLogs, bodyProfiles, fileAssets } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { deleteStorageFile } from "@/lib/storage";
import { BODY_FIELDS } from "@/lib/brief/constants";

const measure = z.number().positive().max(500).nullable().optional();
const patchSchema = z.object({
  clientId: z.string().uuid().nullable().optional(),
  heightCm: measure,
  weightKg: measure,
  shoulderWidthCm: measure,
  chestCm: measure,
  waistCm: measure,
  hipCm: measure,
  neckCm: measure,
  armLengthCm: measure,
  torsoLengthCm: measure,
  inseamCm: measure,
  legLengthCm: measure,
  designerVerified: z.boolean().optional(),
  notes: z.string().max(4000).nullable().optional(),
});

// Corrections to the latest profile. New measurement sessions POST a new row.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; bodyId: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Measurements must be positive numbers." }, { status: 400 });
  }
  const { designerVerified, notes, clientId, ...measures } = parsed.data;
  const values: Record<string, string | null | boolean | undefined> = {};
  for (const f of BODY_FIELDS) {
    if (f.key in measures) {
      const v = (measures as Record<string, number | null | undefined>)[f.key];
      values[f.key] = v === undefined || v === null ? null : String(v);
    }
  }
  if (designerVerified !== undefined) values.designerVerified = designerVerified;
  if (notes !== undefined) values.notes = notes;
  if (clientId !== undefined) values.clientId = clientId;

  const [updated] = await db
    .update(bodyProfiles)
    .set(values)
    .where(and(eq(bodyProfiles.id, params.bodyId), eq(bodyProfiles.projectId, params.id)))
    .returning();
  if (!updated) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "PROJECT_UPDATED",
    entityType: "BodyProfile",
    entityId: updated.id,
  });
  return NextResponse.json({ ok: true, data: updated });
}

// Reject a vision estimate: removes the ESTIMATED snapshot and its reference
// photo (privacy: deletion capability, md/02 §33). Manual measurement history
// is preserved and cannot be deleted here.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; bodyId: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const existing = await db.query.bodyProfiles.findFirst({
    where: and(eq(bodyProfiles.id, params.bodyId), eq(bodyProfiles.projectId, params.id)),
  });
  if (!existing) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  if (existing.measurementSource !== "COMPUTER_VISION" && existing.measurementSource !== "ESTIMATED") {
    return NextResponse.json(
      { ok: false, code: "ESTIMATE_DELETE_FORBIDDEN", error: "Only vision estimates can be deleted here — manual history is preserved." },
      { status: 422 },
    );
  }

  // Trace the estimate back to its analysis job for the linked reference photo.
  const jobs = await db.query.aiJobs.findMany({
    where: and(eq(aiJobs.projectId, params.id), eq(aiJobs.jobType, "BODY_ANALYSIS")),
    orderBy: desc(aiJobs.createdAt),
    limit: 50,
  });
  for (const job of jobs) {
    const out = job.outputPayload as { profileId?: string; assetId?: string } | null;
    if (out?.profileId !== existing.id || !out.assetId) continue;
    const [asset] = await db
      .delete(fileAssets)
      .where(and(eq(fileAssets.id, out.assetId), eq(fileAssets.projectId, params.id)))
      .returning();
    if (asset?.storageUrl?.startsWith("/api/files/")) {
      await deleteStorageFile(asset.storageUrl.slice("/api/files/".length));
    }
    break;
  }

  await db
    .delete(bodyProfiles)
    .where(and(eq(bodyProfiles.id, existing.id), eq(bodyProfiles.projectId, params.id)));
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "PROJECT_UPDATED",
    entityType: "BodyProfile",
    entityId: existing.id,
  });
  return NextResponse.json({ ok: true });
}
