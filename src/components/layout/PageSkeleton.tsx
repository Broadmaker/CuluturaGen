// Reusable page skeleton: title bar, stat cards, and table rows.
export default function PageSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="h-8 w-56 rounded bg-neutral-200" />
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded border bg-white p-4">
            <div className="h-3 w-20 rounded bg-neutral-200" />
            <div className="mt-2 h-7 w-12 rounded bg-neutral-200" />
          </div>
        ))}
      </div>
      <div className="mt-6 rounded border bg-white p-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 border-b py-3 last:border-0">
            <div className="h-4 flex-1 rounded bg-neutral-200" />
            <div className="h-4 w-24 rounded bg-neutral-200" />
            <div className="h-4 w-20 rounded bg-neutral-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
