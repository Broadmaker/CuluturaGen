// Priority badge — descriptive state, not a score (md/07 §69 spirit).
const STYLES: Record<string, string> = {
  MANDATORY: "border-red-700 bg-red-50 text-red-800",
  PREFERRED: "border-blue-600 bg-blue-50 text-blue-800",
  OPTIONAL: "border-neutral-400 bg-neutral-100 text-neutral-600",
  RESTRICTED: "border-neutral-800 bg-neutral-800 text-white",
};

export default function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${STYLES[priority] ?? STYLES.OPTIONAL}`}
    >
      {priority}
    </span>
  );
}
