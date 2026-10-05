import { statusTone } from "./statusTone";

// Shared status badge (md/08 §113). Icon + label, never color alone.
export default function StatusBadge({
  value,
  title,
}: {
  value: string | null | undefined;
  title?: string;
}) {
  const s = statusTone(value);
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${s.className}`}
      title={title ?? `Status: ${s.label}`}
    >
      {s.icon} {s.label}
    </span>
  );
}
