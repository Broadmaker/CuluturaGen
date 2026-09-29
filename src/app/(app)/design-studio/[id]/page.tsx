import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { aiJobs, designCulturalElements, designVersions, designs } from "@/lib/db/schema";
import ValidationBadge from "@/components/culture/ValidationBadge";
import RegenerateForm from "@/components/design/RegenerateForm";
import CostPanel from "@/components/cost/CostPanel";
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
    <main className="mx-auto max-w-7xl p-6">
      <p className="text-sm text-neutral-500">
        <Link href="/design-studio" className="underline">Design Studio</Link> / {design.designCode}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{design.name ?? design.designCode}</h1>
        <span className="rounded border bg-white px-2 py-0.5 text-xs">{design.status}</span>
        <span className="rounded border bg-white px-2 py-0.5 text-xs">DESIGN V{version.versionNumber}</span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr_280px]">
        {/* LEFT — context */}
        <aside className="rounded border bg-white p-4 text-sm">
          <h2 className="font-semibold">CONTEXT</h2>
          <div className="mt-2">
            <p className="text-xs uppercase tracking-widest text-neutral-500">Versions</p>
            <ul className="mt-1 space-y-1">
              {[...versions].reverse().map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/design-studio/${design.id}?v=${v.versionNumber}`}
                    className={`underline ${v.id === version.id ? "font-bold" : ""}`}
                  >
                    V{v.versionNumber}
                  </Link>{" "}
                  <span className="text-xs text-neutral-500">{v.status}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-3">
            <p className="text-xs uppercase tracking-widest text-neutral-500">Generation</p>
            <ul className="mt-1 space-y-1 text-xs">
              {jobs.map((j) => (
                <li key={j.id}>
                  {j.jobType}: {j.status} ({j.provider}/{j.model})
                </li>
              ))}
            </ul>
          </div>
          <RegenerateForm designId={design.id} />
        </aside>

        {/* CENTER — canvas */}
        <section className="rounded border bg-white p-4">
          {version.generatedImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={version.generatedImageUrl}
              alt={`Generated concept V${version.versionNumber}`}
              className="mx-auto max-h-[560px] rounded border"
            />
          ) : (
            <p className="py-16 text-center text-sm text-neutral-500">
              No visual for this version{version.status === "FAILED" ? " (generation failed — see jobs)." : "."}
            </p>
          )}
          <p className="mt-2 text-xs text-neutral-500">
            AI GENERATED · {version.generationSource} · {version.aiModel} ·{" "}
            {version.createdAt?.toLocaleString()}
          </p>

          {spec ? (
            <div className="mt-4 text-sm">
              <h2 className="font-semibold">DESIGN SPECIFICATION</h2>
              <dl className="mt-2 space-y-2">
                <div>
                  <dt className="text-xs uppercase tracking-widest text-neutral-500">Silhouette</dt>
                  <dd>{spec.silhouette.type} — {spec.silhouette.description}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-neutral-500">Garments</dt>
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
                    <dt className="text-xs uppercase tracking-widest text-neutral-500">Textiles</dt>
                    <dd>{spec.textiles.join(", ")}</dd>
                  </div>
                )}
                {spec.colors.length > 0 && (
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-neutral-500">Colors</dt>
                    <dd>{spec.colors.map((c) => c.name).join(", ")}</dd>
                  </div>
                )}
                {spec.constructionNotes.length > 0 && (
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-neutral-500">Construction</dt>
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
                    <dt className="text-xs uppercase tracking-widest text-neutral-500">Body considerations</dt>
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
            <p className="mt-4 text-sm text-neutral-500">No specification stored for this version.</p>
          )}
        </section>

        {/* RIGHT — analysis */}
        <aside className="space-y-4 text-sm">
          <section className="rounded border bg-white p-4">
            <h2 className="font-semibold">CULTURAL</h2>
            {usedElements.length === 0 ? (
              <p className="mt-1 text-neutral-500">No cultural elements recorded.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {usedElements.map((u) => (
                  <li key={u.culturalElementId}>
                    <Link href={`/culture/${u.element.id}`} className="underline">
                      {u.element.name}
                    </Link>
                    <div className="mt-1 flex gap-1">
                      <ValidationBadge status={u.element.validationStatus} />
                      {u.approvedByHuman && (
                        <span className="rounded border px-1.5 py-0.5 text-xs">HUMAN ✓</span>
                      )}
                    </div>
                    {u.usageDescription && (
                      <p className="mt-1 text-xs text-neutral-500">{u.usageDescription}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-neutral-500">
              {verifiedCount} verified · {flaggedCount} need review (cost + full
              evaluation arrive in MVP 5/6)
            </p>
          </section>

          {spec?.aiExplanation && (
            <section className="rounded border bg-white p-4">
              <h2 className="font-semibold">WHY THIS DESIGN</h2>
              <p className="mt-1">{spec.aiExplanation.summary}</p>
              {spec.aiExplanation.elementReasons.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-neutral-600">
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

      <section className="mt-4 rounded border bg-white p-4">
        <h2 className="font-semibold">COST ESTIMATE — V{version.versionNumber}</h2>
        <p className="text-xs text-neutral-500">
          Deterministic engine only — the AI suggests materials, the engine does the math (md/06 §2).
        </p>
        <CostPanel versionId={version.id} designId={design.id} />
      </section>
    </main>
  );
}
