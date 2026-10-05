// md/08 §21 — visually distinct states, never color alone.
// Now rendered through the shared status system (same output as before).
import StatusBadge from "@/components/status/StatusBadge";

export default function ValidationBadge({ status }: { status: string | null }) {
  return <StatusBadge value={status ?? "UNVERIFIED"} title={`Validation status: ${status ?? "UNVERIFIED"}`} />;
}
