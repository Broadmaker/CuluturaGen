// Reusable page skeleton: title bar, stat cards, and table rows.
export default function PageSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="h-8 w-56 rounded-lg bg-stone-200" />
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card">
            <div className="h-3 w-20 rounded bg-stone-200" />
            <div className="mt-3 h-7 w-12 rounded bg-stone-200" />
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 border-b border-stone-100 py-3 last:border-0">
            <div className="h-4 flex-1 rounded bg-stone-200" />
            <div className="h-4 w-24 rounded bg-stone-200" />
            <div className="h-4 w-20 rounded bg-stone-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
