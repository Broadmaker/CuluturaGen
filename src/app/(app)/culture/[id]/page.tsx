import { notFound } from "next/navigation";
import { asc, desc, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { communities, culturalReferences, cultures, projects } from "@/lib/db/schema";
import { getSessionUser, hasRole } from "@/lib/auth/session";
import { CultureService } from "@/server/services/culture/CultureService";
import ValidationBadge from "@/components/culture/ValidationBadge";
import StatusActions from "@/components/culture/StatusActions";
import AddToProject from "@/components/culture/AddToProject";
import AttachReference from "@/components/culture/AttachReference";
import AddRestriction from "@/components/culture/AddRestriction";
import AddRelationship from "@/components/culture/AddRelationship";
import ElementCard from "@/components/culture/ElementCard";

// md/08 §20 cultural detail page.
export default async function ElementDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [detail, user] = await Promise.all([
    CultureService.getElementDetail(params.id),
    getSessionUser(),
  ]);
  if (!detail) notFound();

  const expert = hasRole(user, "ADMIN", "CULTURAL_EXPERT");
  const [projectList, referenceList, cultureList, communityList] = await Promise.all([
    db.query.projects.findMany({
      where: isNull(projects.deletedAt),
      orderBy: desc(projects.updatedAt),
      columns: { id: true, name: true },
      limit: 50,
    }),
    db.query.culturalReferences.findMany({
      orderBy: asc(culturalReferences.referenceCode),
      columns: { id: true, title: true, referenceCode: true },
      limit: 200,
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

  const sections: [string, string | null | undefined][] = [
    ["Description", detail.description],
    ["Historical context", detail.historicalContext],
    ["Symbolism", detail.symbolism],
    ["Traditional usage", detail.traditionalUsage],
    ["Modern usage", detail.modernUsage],
    ["Appropriate contexts", detail.appropriateContext],
    ["Restricted contexts", detail.restrictedContext],
  ];

  return (
    <main className="mx-auto max-w-6xl p-6">
      <p className="text-sm text-neutral-500">
        <a href="/culture" className="underline">Cultural Knowledge</a> / {detail.elementCode}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{detail.name}</h1>
        <ValidationBadge status={detail.validationStatus} />
        <span className="rounded border bg-white px-2 py-0.5 text-xs">{detail.category}</span>
      </div>
      {detail.alternativeNames && detail.alternativeNames.length > 0 && (
        <p className="mt-1 text-sm text-neutral-500">
          Also known as: {detail.alternativeNames.join(", ")}
        </p>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded border bg-white p-4">
          <h2 className="font-semibold">Knowledge</h2>
          {sections.map(([label, value]) =>
            value ? (
              <div key={label} className="mt-3">
                <p className="text-xs uppercase tracking-widest text-neutral-500">{label}</p>
                <p className="mt-1 text-sm">{value}</p>
              </div>
            ) : null,
          )}
          {expert && detail.expertNotes && (
            <div className="mt-3 rounded bg-amber-50 p-2">
              <p className="text-xs uppercase tracking-widest text-amber-700">Expert notes</p>
              <p className="mt-1 text-sm">{detail.expertNotes}</p>
            </div>
          )}
          <StatusActions
            elementId={detail.id}
            current={detail.validationStatus}
            roles={user?.roles ?? []}
          />
        </section>

        <div className="space-y-6">
          <section className="rounded border bg-white p-4">
            <h2 className="font-semibold">Associations</h2>
            {detail.outgoingLinks.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">No associations yet.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {detail.outgoingLinks.map((l) => (
                  <li key={l.id}>
                    <span className="rounded border px-1.5 py-0.5 text-xs">{l.relationshipType}</span>{" "}
                    {l.target ? (
                      <a href={`/culture/${l.target.id}`} className="underline">{l.target.name}</a>
                    ) : l.culture ? (
                      <span>{l.culture.name} (culture)</span>
                    ) : l.community ? (
                      <span>{l.community.name} (community)</span>
                    ) : (
                      <span className="text-neutral-500">unresolved</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer underline">Add association</summary>
              <AddRelationship elementId={detail.id} cultures={cultureList} communities={communityList} />
            </details>
          </section>

          <section className="rounded border bg-white p-4">
            <h2 className="font-semibold">Sources ({detail.references.length})</h2>
            {detail.references.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">
                ⚠ No supporting source — evaluation will flag this for review.
              </p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {detail.references.map((r) => (
                  <li key={r.referenceId}>
                    <span className="font-mono text-xs">{r.reference.referenceCode}</span>{" "}
                    {r.reference.title}
                    {r.reference.author && (
                      <span className="text-neutral-500"> — {r.reference.author}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer underline">Attach source</summary>
              <AttachReference elementId={detail.id} references={referenceList} />
            </details>
          </section>

          <section className="rounded border bg-white p-4">
            <h2 className="font-semibold">Restrictions ({detail.restrictions.length})</h2>
            {detail.restrictions.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">No recorded restrictions.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {detail.restrictions.map((r) => (
                  <li key={r.id} className="rounded border border-red-200 bg-red-50 px-2 py-1">
                    <span className="font-medium">{r.restrictionType}</span>
                    {r.severity && (
                      <span className="ml-2 rounded border px-1 text-xs">{r.severity}</span>
                    )}
                    <p className="mt-1">{r.description}</p>
                  </li>
                ))}
              </ul>
            )}
            {expert && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer underline">Manage restrictions</summary>
                <AddRestriction
                  elementId={detail.id}
                  cultures={cultureList}
                  communities={communityList}
                  references={referenceList}
                />
              </details>
            )}
          </section>

          <section className="rounded border bg-white p-4">
            <h2 className="font-semibold">Use in a project</h2>
            <AddToProject elementId={detail.id} projects={projectList} />
          </section>
        </div>
      </div>

      {detail.related.length > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold">Related elements</h2>
          <div className="mt-2 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {detail.related.map((r) => (
              <ElementCard
                key={r.id}
                element={{ id: r.id, name: r.name, category: r.category, description: null, validationStatus: null }}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
