import { notFound } from "next/navigation";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { communities, cultures, designBriefs, projects } from "@/lib/db/schema";
import BriefForm from "@/components/brief/BriefForm";
import RequirementManager from "@/components/brief/RequirementManager";

export default async function RequirementsPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, params.id), isNull(projects.deletedAt)),
    columns: { id: true, name: true, projectCode: true },
  });
  if (!project) notFound();

  const [briefs, cultureList, communityList] = await Promise.all([
    db.query.designBriefs.findMany({
      where: eq(designBriefs.projectId, params.id),
      orderBy: desc(designBriefs.createdAt),
      limit: 1,
      with: { requirements: true },
    }),
    db.query.cultures.findMany({
      orderBy: asc(cultures.name),
      columns: { id: true, name: true },
    }),
    db.query.communities.findMany({
      orderBy: asc(communities.name),
      columns: { id: true, name: true },
    }),
  ]);
  const brief = briefs[0] ?? null;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <p className="text-sm text-neutral-500">
        <a href="/projects" className="underline">Projects</a> /{" "}
        <a href={`/projects/${project.id}`} className="underline">{project.name}</a> / Requirements
      </p>
      <h1 className="mt-1 text-2xl font-bold">Design Requirements</h1>
      <section className="rounded border bg-white p-4">
        <BriefForm
          projectId={project.id}
          brief={brief}
          cultures={cultureList}
          communities={communityList}
        />
      </section>
      <RequirementManager briefId={brief?.id ?? null} initial={brief?.requirements ?? []} />
    </main>
  );
}
