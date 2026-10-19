import Link from "next/link";

// Rows per page for the list tables. Kept small so every table behaves the
// same; the server pages clamp `page` and compute offset from it.
export const PAGE_SIZE = 10;

// Server-rendered pagination: builds query-string links that preserve the
// active filters so paging never drops the current search/selection.
export default function Pagination({
  page,
  total,
  pageSize = PAGE_SIZE,
  basePath,
  query = {},
}: {
  page: number;
  total: number;
  pageSize?: number;
  basePath: string;
  query?: Record<string, string | number | undefined | null>;
}) {
  if (total === 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const from = (current - 1) * pageSize + 1;
  const to = Math.min(total, current * pageSize);

  const hrefFor = (p: number) => {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (key === "page") continue;
      if (value === undefined || value === null || value === "") continue;
      sp.set(key, String(value));
    }
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const base =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-sm font-medium transition-colors";
  const enabled = `${base} border-stone-200 bg-white text-ink-700 shadow-sm hover:border-brand-200 hover:text-brand-700`;
  const disabled = `${base} border-stone-200 bg-white text-ink-300`;
  const activeCls = `${base} border-brand-500 bg-brand-500 font-semibold text-white shadow-sm shadow-brand-500/25`;

  const pages = pageWindow(current, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-stone-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-ink-500">
        Showing <span className="font-medium text-ink-700">{from}</span>–
        <span className="font-medium text-ink-700">{to}</span> of{" "}
        <span className="font-medium text-ink-700">{total}</span>
      </p>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        {current > 1 ? (
          <Link href={hrefFor(current - 1)} className={enabled} aria-label="Previous page" rel="prev">
            ‹ Prev
          </Link>
        ) : (
          <span className={disabled} aria-disabled="true">
            ‹ Prev
          </span>
        )}
        {pages.map((p, i) =>
          p === -1 ? (
            <span key={`gap-${i}`} className="px-1 text-ink-500">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={hrefFor(p)}
              aria-current={p === current ? "page" : undefined}
              className={p === current ? activeCls : enabled}
            >
              {p}
            </Link>
          ),
        )}
        {current < totalPages ? (
          <Link href={hrefFor(current + 1)} className={enabled} aria-label="Next page" rel="next">
            Next ›
          </Link>
        ) : (
          <span className={disabled} aria-disabled="true">
            Next ›
          </span>
        )}
      </nav>
    </div>
  );
}

// Compact page-number window: always shows first/last, ellipses for gaps.
function pageWindow(current: number, totalPages: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const out: number[] = [1];
  if (current > 3) out.push(-1);
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  for (let i = start; i <= end; i++) out.push(i);
  if (current < totalPages - 2) out.push(-1);
  out.push(totalPages);
  return out;
}
