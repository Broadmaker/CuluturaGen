// Priority badge — descriptive state, not a score (md/07 §69 spirit).
// Now rendered through the shared status system (same output as before).
import StatusBadge from "@/components/status/StatusBadge";

export default function PriorityBadge({ priority }: { priority: string }) {
  return <StatusBadge value={priority} title={`Requirement priority: ${priority}`} />;
}
