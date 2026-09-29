import { notFound } from "next/navigation";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { bodyProfiles, clients, projects } from "@/lib/db/schema";
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

  const [clientList, profileList] = await Promise.all([
    db.query.clients.findMany({
      where: eq(clients.projectId, params.id),
      orderBy: desc(clients.createdAt),
    }),
    db.query.bodyProfiles.findMany({
      where: eq(bodyProfiles.projectId, params.id),
      orderBy: desc(bodyProfiles.createdAt),
      limit: 20,
    }),
  ]);

  // Numeric strings → display strings; the form posts numbers back.
  const profiles = profileList.map((p) => ({
    id: p.id,
    clientId: p.clientId,
    measurementSource: p.measurementSource,
    designerVerified: p.designerVerified,
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
    <main className="mx-auto max-w-6xl p-6">
      <p className="text-sm text-neutral-500">
        <a href="/projects" className="underline">Projects</a> /{" "}
        <a href={`/projects/${project.id}`} className="underline">{project.name}</a> / Body
      </p>
      <h1 className="mt-1 text-2xl font-bold">Client & Body Profile</h1>
      <div className="mt-4">
        <BodySection projectId={project.id} clients={clientList} profiles={profiles} />
      </div>
    </main>
  );
}
