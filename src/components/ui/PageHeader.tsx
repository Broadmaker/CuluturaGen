import type { ReactNode } from "react";

// Page header: eyebrow kicker, serif title, description, action buttons.
export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-widest text-brass-700">{eyebrow}</p>
        )}
        <h1 className="mt-1 font-display text-3xl text-ink-950">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-stone-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
