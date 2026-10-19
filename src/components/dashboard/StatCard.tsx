import Link from "next/link";
import { NavIcons, type NavIconName } from "@/components/layout/icons";

// Reference-style metric card: icon tile, big value, label, honest caption
// (e.g. "+3 this week" — real counts, never invented deltas).
export default function StatCard({
  label,
  value,
  caption,
  icon,
  tone,
  href,
  featured = false,
}: {
  label: string;
  value: React.ReactNode;
  caption?: string;
  icon: NavIconName;
  tone: "ink" | "brass" | "green" | "red";
  href?: string;
  featured?: boolean;
}) {
  const tiles: Record<string, string> = {
    ink: "bg-ink-50 text-ink-700",
    brass: "bg-brand-50 text-brand-700",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
  };
  const body = (
    <div
      className={`flex items-start justify-between gap-3 rounded-2xl border p-5 shadow-card transition-shadow hover:shadow-pop ${
        featured ? "border-brand-200 bg-gradient-to-br from-brand-50 to-brand-100/60" : "border-stone-200/80 bg-white"
      }`}
    >
      <div className="min-w-0">
        <p className={`text-xs font-semibold uppercase tracking-widest ${featured ? "text-brand-700" : "text-ink-500"}`}>
          {label}
        </p>
        <p className="mt-1.5 font-display text-3xl font-bold text-ink-950">{value}</p>
        {caption && <p className={`mt-1.5 truncate text-xs ${featured ? "text-brand-700/80" : "text-ink-500"}`}>{caption}</p>}
      </div>
      <span
        aria-hidden="true"
        className={`rounded-xl p-2.5 ${featured ? "bg-brand-500 text-white shadow-sm shadow-brand-500/40" : tiles[tone]}`}
      >
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
