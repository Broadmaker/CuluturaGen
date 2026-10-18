import { notFound } from "next/navigation";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { aiJobs, bodyProfiles, clients, projects } from "@/lib/db/schema";
import BodySection from "@/components/body/BodySection";

export default async function BodyPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, params.id), isNull(projects.deletedAt)),
    columns: { id: true, name: true },
  });
  if (!project) notFound();

  const [clientList, profileList, visionJobs] = await Promise.all([
    db.query.clients.findMany({
      where: eq(clients.projectId, params.id),
      orderBy: desc(clients.createdAt),
    }),
    db.query.bodyProfiles.findMany({
      where: eq(bodyProfiles.projectId, params.id),
      orderBy: desc(bodyProfiles.createdAt),
      limit: 20,
    }),
    db.query.aiJobs.findMany({
      where: and(eq(aiJobs.projectId, params.id), eq(aiJobs.jobType, "BODY_ANALYSIS")),
      orderBy: desc(aiJobs.createdAt),
      limit: 20,
    }),
  ]);

  // Link each vision estimate back to its reference photo via the job output.
  const imageByProfile = new Map<string, string>();
  for (const job of visionJobs) {
    const out = job.outputPayload as { profileId?: string; imageUrl?: string } | null;
    if (out?.profileId && out.imageUrl && !imageByProfile.has(out.profileId)) {
      imageByProfile.set(out.profileId, out.imageUrl);
    }
  }

  // Numeric strings → display strings; the form posts numbers back.
  const profiles = profileList.map((p) => ({
    id: p.id,
    clientId: p.clientId,
    measurementSource: p.measurementSource,
    designerVerified: p.designerVerified,
    confidenceLevel: p.confidenceLevel,
    imageUrl: imageByProfile.get(p.id) ?? null,
    notes: p.notes,
    createdAt: p.createdAt?.toISOString() ?? "",
    heightCm: p.heightCm,
    weightKg: p.weightKg,
    shoulderWidthCm: p.shoulderWidthCm,
    chestCm: p.chestCm,
    waistCm: p.waistCm,
    hipCm: p.hipCm,
    neckCm: p.neckCm,
    armLengthCm: p.armLengthCm,
    torsoLengthCm: p.torsoLengthCm,
    inseamCm: p.inseamCm,
    legLengthCm: p.legLengthCm,
  }));

  return (
    <main className="w-full p-6">
      <p className="text-sm font-medium text-ink-500">
        <a href="/projects" className="text-ink-700 transition hover:text-brand-600">Projects</a>
        <span className="mx-1.5 text-ink-300">/</span>
        <a href={`/projects/${project.id}`} className="text-ink-700 transition hover:text-brand-600">{project.name}</a>
        <span className="mx-1.5 text-ink-300">/</span> Body
      </p>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink-950">Client &amp; Body Profile</h1>
      <div className="mt-4">
        <BodySection projectId={project.id} clients={clientList} profiles={profiles} />
      </div>
    </main>
  );
}
