// Pure-SVG dashboard charts (no chart library): horizontal status bars
// and a design-pipeline donut. Values are real DB counts passed as props.
import StatusBadge from "@/components/status/StatusBadge";

export function StatusBars({
  rows,
  total,
}: {
  rows: Array<{ status: string; count: number }>;
  total: number;
}) {
  if (total === 0) return <p className="text-sm text-stone-500">No data yet.</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.status}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <StatusBadge value={r.status} />
            <span className="font-medium text-ink-950">
              {r.count} <span className="font-normal text-stone-400">· {Math.round((r.count / total) * 100)}%</span>
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-stone-100"
            role="img"
            aria-label={`${r.status}: ${r.count} of ${total}`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-ink-800 to-brass-500"
              style={{ width: `${Math.max(2, (r.count / total) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

const DONUT_COLORS = ["#163734", "#b9861a", "#2a5f59", "#d2a93b", "#94a3b8", "#7d5510"];

export function PipelineDonut({
  rows,
  total,
}: {
  rows: Array<{ status: string; count: number }>;
  total: number;
}) {
  if (total === 0) return <p className="text-sm text-stone-500">No designs yet.</p>;
  const R = 44;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const segs = rows.map((r, i) => {
    const frac = r.count / total;
    const seg = { ...r, dash: frac * C, gap: C - frac * C, offset: -offset, color: DONUT_COLORS[i % DONUT_COLORS.length] };
    offset += frac * C;
    return seg;
  });
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0" role="img" aria-label={`${total} designs by status`}>
        <circle cx="60" cy="60" r={R} fill="none" stroke="#f0ebe0" strokeWidth="18" />
        {segs.map((s) => (
          <circle
            key={s.status}
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="18"
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={s.offset + C / 4}
            strokeLinecap="butt"
          />
        ))}
        <text x="60" y="58" textAnchor="middle" className="fill-ink-950 font-display" fontSize="24">
          {total}
        </text>
        <text x="60" y="74" textAnchor="middle" className="fill-stone-500" fontSize="10">
          designs
        </text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
        {segs.map((s) => (
          <li key={s.status} className="flex items-center gap-2">
            <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
            <StatusBadge value={s.status} />
            <span className="ml-auto font-medium text-ink-950">{s.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
