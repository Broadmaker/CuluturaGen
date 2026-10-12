import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { aiJobs, auditLogs, bodyProfiles, fileAssets, projects } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { checkRateLimitAsync, rateLimitDefaults } from "@/lib/rate-limit";
import { saveBodyReferenceImage } from "@/lib/storage";
import { getVisionProvider } from "@/lib/vision/provider";
import { sha256Hex, validateBodyImage } from "@/lib/vision/validate";
import { BODY_FIELDS } from "@/lib/brief/constants";

// Computer-vision body analysis (md/01 §15, md/02 §28, md/09 §30–32).
// Upload → consent → mock landmark estimation → ESTIMATED snapshot.
// Estimates are labeled COMPUTER_VISION and never authoritative: the designer
// must accept/correct/reject, and evaluation flags non-MANUAL sources.
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const rl = await checkRateLimitAsync(
    `vision:${user.id}`,
    rateLimitDefaults().visionAnalyzePerHour,
    3_600_000,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Analysis rate limit exceeded. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, params.id), isNull(projects.deletedAt)),
    columns: { id: true },
  });
  if (!project) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  let provider;
  try {
    provider = getVisionProvider();
  } catch {
    // Fail loudly but with a JSON envelope, never an unhandled 500 page:
    // the deploy has VISION_PROVIDER=openai/live without a key.
    return NextResponse.json(
      { ok: false, code: "VISION_MISCONFIGURED", error: "Vision provider is misconfigured." },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Expected multipart form data." }, { status: 400 });
  }

  // Explicit consent is required before a body photo may be processed
  // (md/02 §33 privacy, md/08 §30).
  if (form.get("consent") !== "yes") {
    return NextResponse.json(
      { ok: false, code: "BODY_CONSENT_REQUIRED", error: "Photo consent is required before analysis." },
      { status: 422 },
    );
  }

  const clientIdRaw = form.get("clientId");
  const clientId = typeof clientIdRaw === "string" && clientIdRaw.length > 0 ? clientIdRaw : null;
  if (clientId && !z.string().uuid().safeParse(clientId).success) {
    return NextResponse.json({ ok: false, error: "Invalid client." }, { status: 400 });
  }
  const notesRaw = form.get("notes");
  const notes = typeof notesRaw === "string" ? notesRaw.slice(0, 4000) : undefined;

  const file = form.get("photo");
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { ok: false, code: "BODY_IMAGE_REQUIRED", error: "A reference photo is required." },
      { status: 400 },
    );
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const checked = validateBodyImage(bytes, file.type || null);
  if (!checked.ok) {
    const status = checked.error.code === "FILE_TOO_LARGE" ? 413 : 400;
    return NextResponse.json(
      { ok: false, code: checked.error.code, error: checked.error.message },
      { status },
    );
  }

  const [job] = await db
    .insert(aiJobs)
    .values({
      projectId: params.id,
      jobType: "BODY_ANALYSIS",
      provider: provider.name,
      status: "PROCESSING",
      startedAt: new Date(),
      inputPayload: { clientId, consent: true },
    })
    .returning();

  try {
    const { url } = await saveBodyReferenceImage(params.id, bytes, checked.ext);
    const checksum = sha256Hex(bytes);
    const [asset] = await db
      .insert(fileAssets)
      .values({
        projectId: params.id,
        fileType: "BODY_IMAGE",
        fileName: `body-reference.${checked.ext}`,
        storageUrl: url,
        mimeType: checked.mime,
        fileSize: bytes.length,
        checksum,
        uploadedBy: user.id,
      })
      .returning();

    const estimate = await provider.analyze(bytes);
    const values: Record<string, string | null> = {};
    for (const f of BODY_FIELDS) {
      const v = estimate.measurements[f.key];
      values[f.key] =
        v !== undefined && Number.isFinite(v) && v > 0 ? String(v) : null;
    }
    const [profile] = await db
      .insert(bodyProfiles)
      .values({
        projectId: params.id,
        clientId,
        ...values,
        measurementSource: "COMPUTER_VISION",
        confidenceLevel: String(estimate.confidence),
        designerVerified: false,
        notes,
      })
      .returning();

    await db
      .update(aiJobs)
      .set({
        status: "COMPLETED",
        completedAt: new Date(),
        outputPayload: {
          profileId: profile.id,
          assetId: asset.id,
          imageUrl: url,
          provider: provider.name,
          landmarks: estimate.landmarks,
          confidence: estimate.confidence,
        },
      })
      .where(eq(aiJobs.id, job.id));
    await db.insert(auditLogs).values([
      {
        userId: user.id,
        action: "AI_JOB_COMPLETED",
        entityType: "BodyAnalysis",
        entityId: job.id,
      },
      {
        userId: user.id,
        action: "PROJECT_UPDATED",
        entityType: "BodyProfile",
        entityId: profile.id,
      },
    ]);
    return NextResponse.json(
      {
        ok: true,
        data: {
          jobId: job.id,
          profile,
          imageUrl: url,
          landmarks: estimate.landmarks,
          confidence: estimate.confidence,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    await db
      .update(aiJobs)
      .set({
        status: "FAILED",
        completedAt: new Date(),
        errorMessage: err instanceof Error ? err.message : "Analysis failed.",
      })
      .where(eq(aiJobs.id, job.id));
    return NextResponse.json(
      { ok: false, code: "VISION_FAILED", error: "Body analysis failed. Your project data was preserved — try again." },
      { status: 502 },
    );
  }
}

// Recent vision jobs for this project (traceability: estimate → job → image).
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, params.id), isNull(projects.deletedAt)),
    columns: { id: true },
  });
  if (!project) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  const jobs = await db.query.aiJobs.findMany({
    where: and(eq(aiJobs.projectId, params.id), eq(aiJobs.jobType, "BODY_ANALYSIS")),
    orderBy: desc(aiJobs.createdAt),
    limit: 20,
  });
  return NextResponse.json({ ok: true, data: jobs });
}
