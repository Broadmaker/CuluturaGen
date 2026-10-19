// Legend + proportional bars for a small categorical breakdown (role mix,
// account status). Values are real counts; percentages are share of total.
export interface DistributionItem {
  key: string;
  label: string;
  value: number;
  dot: string;
  bar: string;
}

export default function DistributionList({
  items,
  total,
  emptyText = "Nothing to show yet.",
}: {
  items: DistributionItem[];
  total: number;
  emptyText?: string;
}) {
  if (items.length === 0 || total === 0) {
    return <p className="mt-2 text-sm text-ink-500">{emptyText}</p>;
  }

  return (
    <ul className="mt-1 space-y-3.5">
      {items.map((item) => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <li key={item.key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 font-medium text-ink-900">
                <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                {item.label}
              </span>
              <span className="tabular-nums text-ink-600">
                {item.value}
                <span className="ml-1.5 text-xs text-ink-500">{pct}%</span>
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100">
              <div
                className={`h-full rounded-full ${item.bar}`}
                style={{ width: `${item.value > 0 ? Math.max(pct, 3) : 0}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
