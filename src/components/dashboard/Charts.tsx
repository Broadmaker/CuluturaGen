// Pure-SVG dashboard charts (no chart library): activity trend, goal gauge,
// ranking bars, horizontal status bars and a design-pipeline donut. Values are
// real DB counts passed as props — never invented (md/06 honesty rule).
import Link from "next/link";
import StatusBadge from "@/components/status/StatusBadge";

export function StatusBars({
  rows,
  total,
}: {
  rows: Array<{ status: string; count: number }>;
  total: number;
}) {
  if (total === 0) return <p className="text-sm text-ink-500">No data yet.</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.status}>
          <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
            <StatusBadge value={r.status} />
            <span className="font-display font-semibold text-ink-950">
              {r.count}{" "}
              <span className="font-sans font-normal text-ink-500">
                · {Math.round((r.count / total) * 100)}%
              </span>
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-brand-50"
            role="img"
            aria-label={`${r.status}: ${r.count} of ${total}`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
              style={{ width: `${Math.max(2, (r.count / total) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

const DONUT_COLORS = ["#f97316", "#fb923c", "#fdba74", "#c2410c", "#fed7aa", "#a8a29e"];

export function PipelineDonut({
  rows,
  total,
}: {
  rows: Array<{ status: string; count: number }>;
  total: number;
}) {
  if (total === 0) return <p className="text-sm text-ink-500">No designs yet.</p>;
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
        <circle cx="60" cy="60" r={R} fill="none" stroke="#f6ede1" strokeWidth="18" />
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
        <text x="60" y="58" textAnchor="middle" className="fill-ink-950 font-display" fontSize="24" fontWeight="700">
          {total}
        </text>
        <text x="60" y="74" textAnchor="middle" className="fill-ink-500" fontSize="10">
          designs
        </text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
        {segs.map((s) => (
          <li key={s.status} className="flex items-center gap-2">
            <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <StatusBadge value={s.status} />
            <span className="ml-auto font-display font-semibold text-ink-950">{s.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AreaTrend({
  labels,
  series,
  summary,
}: {
  labels: string[];
  series: Array<{ name: string; color: string; dashed?: boolean; points: number[] }>;
  summary: string;
}) {
  const W = 640;
  const H = 200;
  const PAD_X = 10;
  const PAD_TOP = 14;
  const PAD_BOTTOM = 26;
  const innerH = H - PAD_TOP - PAD_BOTTOM;
  const n = Math.max(labels.length, 2);
  const max = Math.max(1, ...series.flatMap((s) => s.points));
  const xAt = (i: number) => PAD_X + (i / (n - 1)) * (W - PAD_X * 2);
  const yAt = (v: number) => PAD_TOP + innerH - (v / max) * innerH;
  const line = (pts: number[]) =>
    pts.map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(" ");
  const area = (pts: number[]) =>
    `${line(pts)} L${xAt(pts.length - 1).toFixed(1)} ${PAD_TOP + innerH} L${xAt(0).toFixed(1)} ${PAD_TOP + innerH} Z`;
  const fill = series[0]?.color ?? "#f97316";

  return (
    <figure className="mt-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={summary}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} stopOpacity="0.22" />
            <stop offset="100%" stopColor={fill} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={PAD_TOP + innerH * g}
            y2={PAD_TOP + innerH * g}
            stroke="#ece5db"
            strokeWidth="1"
          />
        ))}
        {series[0] && <path d={area(series[0].points)} fill="url(#trend-fill)" />}
        {series.map((s) => (
          <path
            key={s.name}
            d={line(s.points)}
            fill="none"
            stroke={s.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={s.dashed ? "1 7" : undefined}
          />
        ))}
        {labels.map((l, i) => (
          <text key={`${l}-${i}`} x={xAt(i)} y={H - 6} textAnchor="middle" className="fill-ink-500" fontSize="11">
            {l}
          </text>
        ))}
      </svg>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        {series.map((s) => (
          <li key={s.name} className="flex items-center gap-2 text-xs text-ink-600">
            <span
              aria-hidden="true"
              className="inline-block w-5 border-t-2"
              style={{ borderColor: s.color, borderStyle: s.dashed ? "dashed" : "solid" }}
            />
            {s.name}
          </li>
        ))}
      </ul>
      <ul className="sr-only">
        {labels.map((l, i) => (
          <li key={l}>
            {l}: {series.map((s) => `${s.name} ${s.points[i] ?? 0}`).join(", ")}
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function GoalGauge({
  value,
  total,
  label,
  caption,
}: {
  value: number;
  total: number;
  label: string;
  caption?: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const R = 78;
  const C = Math.PI * R;
  const dash = (pct / 100) * C;
  return (
    <div className="mt-1 flex flex-col items-center">
      <svg
        viewBox="0 0 200 118"
        className="w-full max-w-[240px]"
        role="img"
        aria-label={`${label}: ${pct}% (${value} of ${total})`}
      >
        <path d="M22 100 A78 78 0 0 1 178 100" fill="none" stroke="#f6ede1" strokeWidth="16" strokeLinecap="round" />
        <path
          d="M22 100 A78 78 0 0 1 178 100"
          fill="none"
          stroke="#f97316"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
        />
        <text x="100" y="84" textAnchor="middle" className="fill-ink-950 font-display" fontSize="34" fontWeight="700">
          {pct}%
        </text>
        <text x="100" y="106" textAnchor="middle" className="fill-ink-500" fontSize="12">
          {value} of {total}
        </text>
      </svg>
      <p className="mt-1 text-center text-sm font-medium text-ink-700">{label}</p>
      {caption && <p className="mt-0.5 text-center text-xs text-ink-500">{caption}</p>}
    </div>
  );
}

export function RankBars({
  rows,
}: {
  rows: Array<{ label: string; value: number; href?: string; meta?: string }>;
}) {
  if (rows.length === 0) return <p className="text-sm text-ink-500">No data yet.</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3.5">
      {rows.map((r) => {
        const pct = Math.max(4, (r.value / max) * 100);
        const inner = (
          <>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium text-ink-800">{r.label}</span>
              <span className="shrink-0 font-display font-semibold text-ink-950">{r.value}</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-brand-50"
              role="img"
              aria-label={`${r.label}: ${r.value}${r.meta ? ` ${r.meta}` : ""}`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        );
        return (
          <li key={r.label}>
            {r.href ? (
              <Link href={r.href} className="block rounded-lg px-1 py-0.5 transition-colors hover:bg-brand-50/50">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}
