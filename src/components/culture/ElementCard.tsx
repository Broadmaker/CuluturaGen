import Link from "next/link";
import ValidationBadge from "./ValidationBadge";

// md/08 §19 element card.
export interface ElementSummary {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  validationStatus: string | null;
}

export default function ElementCard({
  element,
  match,
}: {
  element: ElementSummary;
  match?: { via: string[] } | null;
}) {
  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card transition-shadow hover:shadow-pop">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href={`/culture/${element.id}`} className="font-display text-lg leading-snug text-ink-950 transition hover:text-brand-600">
            {element.name}
          </Link>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-brass-700">{element.category ?? "—"}</p>
        </div>
        <ValidationBadge status={element.validationStatus} />
      </div>
      {element.description && (
        <p className="mt-2 line-clamp-3 text-sm text-ink-500">{element.description}</p>
      )}
      {match && match.via.length > 0 && (
        <p className="mt-2 text-xs text-ink-500" title="Why this result was returned (md/04 §73)">
          Matched via {match.via.join(" + ")}
        </p>
      )}
      <Link href={`/culture/${element.id}`} className="mt-3 inline-block text-sm font-medium text-ink-800 underline-offset-2 hover:text-brand-600 hover:underline">
        View Details
      </Link>
    </div>
  );
}
