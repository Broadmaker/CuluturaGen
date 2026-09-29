// md/08 §21 — visually distinct states, never color alone.
const STYLES: Record<string, { icon: string; label: string; className: string }> = {
  VERIFIED: { icon: "✓", label: "VERIFIED", className: "border-green-700 bg-green-50 text-green-800" },
  UNDER_REVIEW: { icon: "◌", label: "UNDER REVIEW", className: "border-amber-600 bg-amber-50 text-amber-800" },
  UNVERIFIED: { icon: "?", label: "UNVERIFIED", className: "border-neutral-400 bg-neutral-100 text-neutral-700" },
  RESTRICTED: { icon: "⚠", label: "RESTRICTED", className: "border-red-600 bg-red-50 text-red-700" },
  DEPRECATED: { icon: "×", label: "DEPRECATED", className: "border-neutral-600 bg-neutral-200 text-neutral-600 line-through" },
};

export default function ValidationBadge({ status }: { status: string | null }) {
  const s = STYLES[status ?? ""] ?? STYLES.UNVERIFIED;
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${s.className}`}
      title={`Validation status: ${s.label}`}
    >
      {s.icon} {s.label}
    </span>
  );
}
