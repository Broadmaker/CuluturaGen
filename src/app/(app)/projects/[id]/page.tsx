import Link from "next/link";
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
import StatusBadge from "@/components/status/StatusBadge";
import Card from "@/components/ui/Card";
import { NavIcons } from "@/components/layout/icons";

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
    <main className="w-full space-y-5 p-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-ink-500">
        <Link href="/projects" className="hover:text-brand-600">Projects</Link>
        <span aria-hidden="true">/</span>
        <span className="font-mono text-xs text-ink-500">{project.projectCode}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink-950">{project.name}</h1>
        <StatusBadge value={project.status} />
      </div>
      {project.description && (
        <p className="max-w-3xl text-sm text-ink-500">{project.description}</p>
      )}

      <nav
        className="flex gap-1.5 overflow-x-auto rounded-2xl border border-stone-200/80 bg-white p-1.5 shadow-card"
        aria-label="Project"
      >
        {TABS.map((t, i) =>
          t.href ? (
            <Link
              key={t.label}
              href={
                t.href.startsWith("#") || t.href.startsWith("/")
                  ? t.href
                  : `/projects/${project.id}/${t.href}`
              }
              className="whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              {t.label}
            </Link>
          ) : (
            <span
              key={t.label}
              aria-current={i === 0 ? "page" : undefined}
              className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium ${
                i === 0 ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30" : "text-ink-500"
              }`}
            >
              {t.label}
            </span>
          ),
        )}
      </nav>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card eyebrow="Context" title="Project details">
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-500">Budget</dt>
              <dd className="font-medium text-ink-900">
                {brief?.budget ? `₱${Number(brief.budget).toLocaleString()}` : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-500">Occasion</dt>
              <dd className="font-medium text-ink-900">{brief?.occasion ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-500">Designs</dt>
              <dd className="font-medium text-ink-900">{project.designs.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-500">Target date</dt>
              <dd className="font-medium text-ink-900">
                {project.targetCompletionDate
                  ? project.targetCompletionDate.toLocaleDateString()
                  : "—"}
              </dd>
            </div>
          </dl>
          <div className="mt-4 border-t border-stone-100 pt-4">
            <StatusChanger projectId={project.id} current={project.status} />
          </div>
        </Card>

        <Card eyebrow="Generation" title="Designs" className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-end">
            <GenerateButton projectId={project.id} />
          </div>
          {project.designs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-300 bg-paper px-4 py-8 text-center text-sm text-ink-500">
              No designs yet — generate the first concept from the brief, basket, and body profile.
            </p>
          ) : (
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th>Design</th>
                    <th>Status</th>
                    <th>Version</th>
                    <th className="text-right">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {project.designs.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <Link
                          href={`/design-studio/${d.id}`}
                          className="font-medium text-ink-800 underline-offset-2 hover:text-brand-600 hover:underline"
                        >
                          {d.name ?? d.designCode}
                        </Link>
                      </td>
                      <td>
                        <StatusBadge value={d.status} />
                      </td>
                      <td className="text-ink-500">v{d.currentVersion}</td>
                      <td className="text-right">
                        <Link
                          href={`/design-studio/${d.id}`}
                          aria-label={`Open ${d.name ?? d.designCode}`}
                          className="inline-flex rounded-lg border border-stone-200 bg-white p-1.5 text-ink-500 shadow-sm transition-colors hover:border-brand-200 hover:text-brand-600"
                        >
                          {NavIcons.arrowRight}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card eyebrow="Research" title={`Basket (${project.basket.length})`} className="lg:col-span-3">
          {project.basket.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-300 bg-paper px-4 py-8 text-center text-sm text-ink-500">
              Collect cultural elements from the{" "}
              <Link href="/culture" className="font-medium text-brand-600 underline underline-offset-2">
                knowledge base
              </Link>
              .
            </p>
          ) : (
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th>Element</th>
                    <th>Validation</th>
                    <th>Role</th>
                    <th>Notes</th>
                    <th className="text-right">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {project.basket.map((b) => (
                    <tr key={b.culturalElementId}>
                      <td>
                        <Link
                          href={`/culture/${b.element.id}`}
                          className="font-medium text-ink-800 underline-offset-2 hover:text-brand-600 hover:underline"
                        >
                          {b.element.name}
                        </Link>
                      </td>
                      <td>
                        <ValidationBadge status={b.element.validationStatus} />
                      </td>
                      <td>
                        <span className="rounded-full bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink-700 ring-1 ring-inset ring-ink-100">
                          {b.role}
                        </span>
                      </td>
                      <td className="max-w-md text-ink-500">{b.notes ?? "—"}</td>
                      <td className="text-right">
                        <RemoveFromBasket projectId={project.id} elementId={b.element.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card eyebrow="Deliverables" title={`Reports (${project.reports.length})`} className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-end">
            <GenerateReportButton projectId={project.id} />
          </div>
          {project.reports.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-300 bg-paper px-4 py-8 text-center text-sm text-ink-500">
              No reports generated for this project yet.
            </p>
          ) : (
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th>Report</th>
                    <th>Generated</th>
                    <th className="text-right">File</th>
                  </tr>
                </thead>
                <tbody>
                  {project.reports.map((r) => (
                    <tr key={r.id}>
                      <td className="font-medium text-ink-800">
                        {r.reportType?.replace(/_/g, " ") ?? "Report"}
                      </td>
                      <td className="text-ink-500">{r.generatedAt?.toLocaleString() ?? "—"}</td>
                      <td className="text-right">
                        {r.fileUrl ? (
                          <a
                            href={r.fileUrl}
                            download
                            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                          >
                            Download PDF
                          </a>
                        ) : (
                          <span className="text-xs text-ink-500">Not available</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card eyebrow="Traceability" title={`History — audit trail (${history.length})`} className="lg:col-span-3">
          {history.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-300 bg-paper px-4 py-8 text-center text-sm text-ink-500">
              No audited events yet.
            </p>
          ) : (
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th>Action</th>
                    <th>Entity</th>
                    <th className="text-right">When</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((a) => (
                    <tr key={a.id}>
                      <td className="font-medium text-ink-800">{a.action}</td>
                      <td className="text-ink-500">{a.entityType ?? "—"}</td>
                      <td className="whitespace-nowrap text-right text-ink-500">
                        {a.createdAt?.toLocaleString() ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
