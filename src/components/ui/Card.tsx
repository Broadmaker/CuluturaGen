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
    <section className={`rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card ${className}`}>
      {(eyebrow || title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            {eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-700">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="mt-1 font-display text-lg font-bold text-ink-950">{title}</h2>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
