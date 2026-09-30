import { notFound } from "next/navigation";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { designs, projects, reports as reportsTable } from "@/lib/db/schema";
import { AuditService } from "@/server/services/audit/AuditService";
import StatusChanger from "@/components/projects/StatusChanger";
import RemoveFromBasket from "@/components/projects/RemoveFromBasket";
import GenerateButton from "@/components/design/GenerateButton";
import GenerateReportButton from "@/components/reports/GenerateReportButton";
import ValidationBadge from "@/components/culture/ValidationBadge";

// md/08 §15 project overview. All tabs resolve: sub-pages where a workflow
// lives (requirements, body), anchors to sections below, or the global
// library/index pages (materials, evaluations).
const TABS: { label: string; href: string | null }[] = [
  { label: "Overview", href: null },
  { label: "Research ✓", href: "#research" },
  { label: "Requirements ✓", href: "requirements" },
  { label: "Body ✓", href: "body" },
  { label: "Materials ✓", href: "/materials" },
  { label: "Designs ✓", href: "#designs" },
  { label: "Evaluation ✓", href: "/evaluations" },
  { label: "Reports ✓", href: "#reports" },
  { label: "History ✓", href: "#history" },
];

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, params.id), isNull(projects.deletedAt)),
    with: {
      briefs: true,
      designs: { orderBy: desc(designs.updatedAt) },
      basket: { with: { element: true } },
      reports: { orderBy: desc(reportsTable.generatedAt), limit: 10 },
    },
  });
  if (!project) notFound();

  const brief = project.briefs[0] ?? null;
  // Phase 18 traceability chain (§116): newest audit events across the
  // project and everything reachable from it.
  const history = await AuditService.forProject(project.id, 30);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <p className="text-sm text-neutral-500">
        <a href="/projects" className="underline">
          Projects
        </a>{" "}
        / {project.projectCode}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <span className="rounded border bg-white px-2 py-0.5 text-xs">{project.status}</span>
      </div>
      {project.description && (
        <p className="mt-2 max-w-2xl text-neutral-600">{project.description}</p>
      )}

      <nav className="mt-4 flex gap-1 overflow-x-auto border-b text-sm" aria-label="Project">
        {TABS.map((t, i) => (
          t.href ? (
            <a
              key={t.label}
              href={t.href.startsWith("#") ? t.href : `/projects/${project.id}/${t.href}`}
              className="whitespace-nowrap px-3 py-2 text-neutral-600 underline"
            >
              {t.label}
            </a>
          ) : (
            <span
              key={t.label}
              className={`whitespace-nowrap px-3 py-2 ${
                i === 0 ? "border-b-2 border-black font-medium" : "text-neutral-400"
              }`}
            >
              {t.label}
            </span>
          )
        ))}
      </nav>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded border bg-white p-4">
          <h2 className="font-semibold">Context</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Budget</dt>
              <dd>{brief?.budget ? `₱${Number(brief.budget).toLocaleString()}` : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Occasion</dt>
              <dd>{brief?.occasion ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Designs</dt>
              <dd>{project.designs.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Target date</dt>
              <dd>
                {project.targetCompletionDate
                  ? project.targetCompletionDate.toLocaleDateString()
                  : "—"}
              </dd>
            </div>
          </dl>
          <StatusChanger projectId={project.id} current={project.status} />
        </section>

        <section id="designs" className="rounded border bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Designs</h2>
            <GenerateButton projectId={project.id} />
          </div>
          {project.designs.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">
              No designs yet — generate the first concept from the brief,
              basket, and body profile.
            </p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {project.designs.map((d) => (
                <li key={d.id} className="flex justify-between border-b py-1">
                  <a href={`/design-studio/${d.id}`} className="underline">
                    {d.name ?? d.designCode}
                  </a>
                  <span className="text-neutral-500">
                    {d.status} · v{d.currentVersion}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="research" className="rounded border bg-white p-4 md:col-span-2">
          <h2 className="font-semibold">
            Research basket ({project.basket.length})
          </h2>
          {project.basket.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">
              Collect cultural elements from the{" "}
              <a href="/culture" className="underline">knowledge base</a>.
            </p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {project.basket.map((b) => (
                <li key={b.culturalElementId} className="flex flex-wrap items-center gap-2 border-b py-1">
                  <a href={`/culture/${b.element.id}`} className="font-medium underline">
                    {b.element.name}
                  </a>
                  <ValidationBadge status={b.element.validationStatus} />
                  <span className="rounded border px-1.5 py-0.5 text-xs">{b.role}</span>
                  {b.notes && <span className="text-neutral-500">— {b.notes}</span>}
                  <span className="ml-auto">
                    <RemoveFromBasket projectId={project.id} elementId={b.element.id} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="reports" className="rounded border bg-white p-4 md:col-span-2">
          <h2 className="font-semibold">Reports ({project.reports.length})</h2>
          {project.reports.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm">
              {project.reports.map((r) => (
                <li key={r.id}>
                  {r.reportType?.replace(/_/g, " ")} — {r.generatedAt?.toLocaleString()}{" "}
                  {r.fileUrl && (
                    <a href={r.fileUrl} className="underline" download>
                      Download PDF
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2">
            <GenerateReportButton projectId={project.id} />
          </div>
        </section>

        <section id="history" className="rounded border bg-white p-4 md:col-span-2">
          <h2 className="font-semibold">History — audit trail ({history.length})</h2>
          {history.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">
              No audited events yet.
            </p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {history.map((a) => (
                <li key={a.id} className="flex flex-wrap gap-2 border-b py-1">
                  <span className="font-medium">{a.action}</span>
                  <span className="text-neutral-500">
                    {a.entityType ?? "—"}
                  </span>
                  <span className="ml-auto text-neutral-500">
                    {a.createdAt?.toLocaleString() ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
