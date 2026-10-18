import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { aiJobs, designCulturalElements, designVersions, designs, projects } from "@/lib/db/schema";
import StatusBadge from "@/components/status/StatusBadge";
import ValidationBadge from "@/components/culture/ValidationBadge";
import RegenerateForm from "@/components/design/RegenerateForm";
import CostPanel from "@/components/cost/CostPanel";
import EvaluationPanel from "@/components/evaluation/EvaluationPanel";
import FinalizeButton from "@/components/design/FinalizeButton";
import GenerateReportButton from "@/components/reports/GenerateReportButton";
import type { DesignSpec } from "@/lib/ai/spec-schema";

// md/08 §36–37 three-panel studio: Context | Canvas | Analysis.
export default async function DesignStudioPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { v?: string };
}) {
  const [design] = await db.select().from(designs).where(eq(designs.id, params.id));
  if (!design) notFound();

  const versions = await db.query.designVersions.findMany({
    where: eq(designVersions.designId, params.id),
    orderBy: desc(designVersions.versionNumber),
  });
  if (versions.length === 0) notFound();

  const wanted = searchParams.v ? Number(searchParams.v) : design.currentVersion;
  const version = versions.find((v) => v.versionNumber === wanted) ?? versions[0];
  const spec = version.designSpecification as unknown as DesignSpec | null;
  const ascVersions = [...versions].reverse();
  const versionIndex = ascVersions.findIndex((v) => v.id === version.id);
  const prevVersion = versionIndex > 0 ? ascVersions[versionIndex - 1] : null;
  const nextVersion = versionIndex < ascVersions.length - 1 ? ascVersions[versionIndex + 1] : null;

  const [project] = await db.select().from(projects).where(eq(projects.id, design.projectId));

  const [usedElements, jobs] = await Promise.all([
    db.query.designCulturalElements.findMany({
      where: eq(designCulturalElements.designVersionId, version.id),
      with: { element: true },
    }),
    db.query.aiJobs.findMany({
      where: eq(aiJobs.designVersionId, version.id),
      orderBy: desc(aiJobs.createdAt),
    }),
  ]);

  const verifiedCount = usedElements.filter((u) => u.element.validationStatus === "VERIFIED").length;
  const flaggedCount = usedElements.filter((u) =>
    ["RESTRICTED", "UNVERIFIED", "DEPRECATED"].includes(u.element.validationStatus ?? ""),
  ).length;

  return (
    <main className="w-full p-6">
      <p className="text-sm font-medium text-ink-500">
        <Link href="/projects" className="text-ink-700 transition hover:text-brand-600">Projects</Link>
        {" / "}
        {project ? (
          <Link href={`/projects/${project.id}`} className="text-ink-700 transition hover:text-brand-600">{project.name}</Link>
        ) : (
          "?"
        )}
        {" / "}
        <Link href="/design-studio" className="text-ink-700 transition hover:text-brand-600">Design Studio</Link>
        {" / "}{design.designCode} / V{version.versionNumber}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl text-ink-950">{design.name ?? design.designCode}</h1>
        <StatusBadge value={design.status} />
        <StatusBadge value={`DESIGN V${version.versionNumber}`} title={`Design version ${version.versionNumber}`} />
        {prevVersion && (
          <Link
            href={`/design-studio/${design.id}?v=${prevVersion.versionNumber}`}
            className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-700 ring-1 ring-inset ring-ink-100 transition hover:text-brand-600"
            aria-label={`Previous version V${prevVersion.versionNumber}`}
          >
            ← V{prevVersion.versionNumber}
          </Link>
        )}
        {nextVersion && (
          <Link
            href={`/design-studio/${design.id}?v=${nextVersion.versionNumber}`}
            className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-700 ring-1 ring-inset ring-ink-100 transition hover:text-brand-600"
            aria-label={`Next version V${nextVersion.versionNumber}`}
          >
            V{nextVersion.versionNumber} →
          </Link>
        )}
        {versions.length > 1 && (
          <form action={`/design-studio/${design.id}/compare`} method="get" className="flex items-center gap-1.5 text-xs">
            <label htmlFor="cmp-a" className="text-ink-500">Compare</label>
            <select id="cmp-a" name="a" defaultValue={ascVersions[0].versionNumber} className="input w-auto px-2 py-1 text-xs">
              {ascVersions.map((v) => (
                <option key={v.id} value={v.versionNumber}>V{v.versionNumber}</option>
              ))}
            </select>
            <span className="text-ink-500">vs</span>
            <select name="b" defaultValue={version.versionNumber} aria-label="Compare to version" className="input w-auto px-2 py-1 text-xs">
              {ascVersions.map((v) => (
                <option key={v.id} value={v.versionNumber}>V{v.versionNumber}</option>
              ))}
            </select>
            <button type="submit" className="rounded-full bg-ink-50 px-2.5 py-1 font-medium text-ink-700 ring-1 ring-inset ring-ink-100 transition hover:text-brand-600">
              Compare
            </button>
          </form>
        )}
        <FinalizeButton designId={design.id} designStatus={design.status} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr_280px]">
        {/* LEFT — context */}
        <aside className="rounded-2xl border border-stone-200/80 bg-white p-5 text-sm shadow-card">
          <h2 className="font-display text-lg font-bold text-ink-950">CONTEXT</h2>
          <div className="mt-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Versions</p>
            <ul className="mt-1 space-y-1">
              {ascVersions.map((v) => (
                <li key={v.id} className="flex items-center gap-2">
                  <Link
                    href={`/design-studio/${design.id}?v=${v.versionNumber}`}
                    className={`underline-offset-2 hover:text-brand-600 hover:underline ${v.id === version.id ? "font-bold text-brand-700" : "text-ink-700"}`}
                    aria-current={v.id === version.id ? "page" : undefined}
                  >
                    V{v.versionNumber}
                  </Link>{" "}
                  <StatusBadge value={v.status} />
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Generation</p>
            <ul className="mt-1 space-y-1 text-xs">
              {jobs.map((j) => (
                <li key={j.id} className="flex flex-wrap items-center gap-1">
                  <span>{j.jobType}</span>
                  <StatusBadge value={j.status} />
                  <span className="text-ink-500">
                    {[j.provider, j.model].filter(Boolean).join(" / ") || "provider pending"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <RegenerateForm designId={design.id} />
        </aside>

        {/* CENTER — canvas */}
        <section className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card">
          {version.generatedImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={version.generatedImageUrl}
              alt={`Generated concept V${version.versionNumber}`}
              className="mx-auto max-h-[560px] rounded-xl border border-stone-200"
            />
          ) : (
            <p className="py-16 text-center text-sm text-ink-500">
              No visual for this version{version.status === "FAILED" ? " (generation failed — see jobs)." : "."}
            </p>
          )}
          <p className="mt-2 text-xs text-ink-500">
            AI GENERATED · {version.generationSource} · {version.aiModel} ·{" "}
            {version.createdAt?.toLocaleString()}
          </p>

          {spec ? (
            <div className="mt-4 text-sm">
              <h2 className="font-display text-lg font-bold text-ink-950">DESIGN SPECIFICATION</h2>
              <dl className="mt-2 space-y-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-ink-400">Silhouette</dt>
                  <dd>{spec.silhouette.type} — {spec.silhouette.description}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-ink-400">Garments</dt>
                  <dd>
                    <ul className="list-disc pl-5">
                      {spec.garmentComponents.map((g) => (
                        <li key={g.name}>{g.name}{g.description ? ` — ${g.description}` : ""}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                {spec.textiles.length > 0 && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-widest text-ink-400">Textiles</dt>
                    <dd>{spec.textiles.join(", ")}</dd>
                  </div>
                )}
                {spec.colors.length > 0 && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-widest text-ink-400">Colors</dt>
                    <dd>{spec.colors.map((c) => c.name).join(", ")}</dd>
                  </div>
                )}
                {spec.constructionNotes.length > 0 && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-widest text-ink-400">Construction</dt>
                    <dd>
                      <ul className="list-disc pl-5">
                        {spec.constructionNotes.map((n, i) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
                {spec.bodyConsiderations.length > 0 && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-widest text-ink-400">Body considerations</dt>
                    <dd>
                      <ul className="list-disc pl-5">
                        {spec.bodyConsiderations.map((n, i) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-500">No specification stored for this version.</p>
          )}
        </section>

        {/* RIGHT — analysis */}
        <aside className="space-y-4 text-sm">
          <section className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card">
            <h2 className="font-display text-lg font-bold text-ink-950">CULTURAL</h2>
            {usedElements.length === 0 ? (
              <p className="mt-1 text-ink-500">No cultural elements recorded.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {usedElements.map((u) => (
                  <li key={u.culturalElementId}>
                    <Link href={`/culture/${u.element.id}`} className="font-medium text-ink-800 underline-offset-2 hover:text-brand-600 hover:underline">
                      {u.element.name}
                    </Link>
                    <div className="mt-1 flex gap-1">
                      <ValidationBadge status={u.element.validationStatus} />
                      {u.approvedByHuman && (
                        <StatusBadge value="HUMAN_APPROVED" />
                      )}
                    </div>
                    {u.usageDescription && (
                      <p className="mt-1 text-xs text-ink-500">{u.usageDescription}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-ink-500">
              {verifiedCount} verified · {flaggedCount} need review — cost breakdown
              and full evaluation follow below.
            </p>
          </section>

          {spec?.aiExplanation && (
            <section className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card">
              <h2 className="font-display text-lg font-bold text-ink-950">WHY THIS DESIGN</h2>
              <p className="mt-1">{spec.aiExplanation.summary}</p>
              {spec.aiExplanation.elementReasons.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-ink-600">
                  {spec.aiExplanation.elementReasons.map((r) => (
                    <li key={r.elementId}>
                      {r.reason} <span className="font-mono">[{r.source || "NO SOURCE"}]</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </aside>
      </div>

      <section className="mt-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card">
        <h2 className="font-display text-lg font-bold text-ink-950">COST ESTIMATE — V{version.versionNumber}</h2>
        <p className="text-xs text-ink-500">
          Deterministic engine only — the AI suggests materials, the engine does the math (md/06 §2).
        </p>
        <CostPanel versionId={version.id} designId={design.id} />
      </section>

      <section className="mt-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card">
        <h2 className="font-display text-lg font-bold text-ink-950">DESIGN EVALUATION — V{version.versionNumber}</h2>
        <p className="text-xs text-ink-500">
          Evidence-based findings for human review — never an authenticity verdict (md/07 §3).
        </p>
        <div className="mt-2">
          <EvaluationPanel designId={design.id} versionId={version.id} versionNumber={version.versionNumber} />
        </div>
      </section>
      <section className="mt-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card">
        <h2 className="font-display text-lg font-bold text-ink-950">REPORTS</h2>
        <div className="mt-2">
          <GenerateReportButton projectId={design.projectId} designId={design.id} />
        </div>
      </section>
    </main>
  );
}
