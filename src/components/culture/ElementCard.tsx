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

export default function ElementCard({ element }: { element: ElementSummary }) {
  return (
    <div className="rounded border bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href={`/culture/${element.id}`} className="font-medium underline">
            {element.name}
          </Link>
          <p className="text-xs text-neutral-500">{element.category ?? "—"}</p>
        </div>
        <ValidationBadge status={element.validationStatus} />
      </div>
      {element.description && (
        <p className="mt-2 line-clamp-3 text-sm text-neutral-600">{element.description}</p>
      )}
      <Link href={`/culture/${element.id}`} className="mt-3 inline-block text-sm underline">
        View Details
      </Link>
    </div>
  );
}
