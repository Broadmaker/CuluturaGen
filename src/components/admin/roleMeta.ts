// Presentation metadata for the four atelier roles — label, description and
// the color tokens used by role pills and distribution bars. Unknown role
// codes degrade to a neutral style instead of crashing.
export interface RoleMeta {
  label: string;
  description: string;
  chip: string;
  dot: string;
  bar: string;
}

export const ROLE_ORDER = ["ADMIN", "DESIGNER", "CULTURAL_EXPERT", "RESEARCHER"] as const;

const ROLE_META: Record<string, RoleMeta> = {
  ADMIN: {
    label: "Administrator",
    description: "Full system access",
    chip: "bg-brass-50 text-brass-700 ring-brass-200",
    dot: "bg-brass-500",
    bar: "bg-brass-500",
  },
  DESIGNER: {
    label: "Designer",
    description: "Studio & costing",
    chip: "bg-ink-50 text-ink-800 ring-ink-100",
    dot: "bg-ink-700",
    bar: "bg-ink-700",
  },
  CULTURAL_EXPERT: {
    label: "Cultural Expert",
    description: "Knowledge verification",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-600",
    bar: "bg-emerald-500",
  },
  RESEARCHER: {
    label: "Researcher",
    description: "Research & records",
    chip: "bg-blue-50 text-blue-700 ring-blue-200",
    dot: "bg-blue-600",
    bar: "bg-blue-500",
  },
};

export function roleMeta(code: string): RoleMeta {
  return (
    ROLE_META[code] ?? {
      label: code.replace(/_/g, " "),
      description: "Additional role",
      chip: "bg-stone-100 text-stone-600 ring-stone-200",
      dot: "bg-stone-400",
      bar: "bg-stone-400",
    }
  );
}
