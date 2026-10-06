import Link from "next/link";
import { NavIcons, type NavIconName } from "@/components/layout/icons";

// NextAdmin-style metric card: icon tile, big value, label, honest caption
// (e.g. "+3 this week" — real counts, never invented deltas).
export default function StatCard({
  label,
  value,
  caption,
  icon,
  tone,
  href,
}: {
  label: string;
  value: React.ReactNode;
  caption?: string;
  icon: NavIconName;
  tone: "ink" | "brass" | "green" | "red";
  href?: string;
}) {
  const tiles: Record<string, string> = {
    ink: "bg-ink-900 text-brass-400",
    brass: "bg-brass-100 text-brass-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
  };
  const body = (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-card transition-shadow hover:shadow-pop">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">{label}</p>
        <p className="mt-1 font-display text-3xl text-ink-950">{value}</p>
        {caption && <p className="mt-1 truncate text-xs text-stone-500">{caption}</p>}
      </div>
      <span aria-hidden="true" className={`rounded-lg p-2.5 ${tiles[tone]}`}>
        {NavIcons[icon]}
      </span>
    </div>
  );
  return href ? (
    <Link href={href} aria-label={`${label}: ${caption ?? ""}`}>
      {body}
    </Link>
  ) : (
    body
  );
}
