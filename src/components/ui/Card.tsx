import type { ReactNode } from "react";

// Themed panel card: eyebrow + title + optional action row + body.
export default function Card({
  eyebrow,
  title,
  action,
  children,
  className = "",
}: {
  eyebrow?: string;
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-stone-200 bg-white p-5 shadow-card ${className}`}>
      {(eyebrow || title || action) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-widest text-brass-700">{eyebrow}</p>
            )}
            {title && <h2 className="mt-0.5 font-display text-lg text-ink-950">{title}</h2>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
