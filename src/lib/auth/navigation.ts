// Role-filtered navigation — md/08 §94 (Navigation by User Role).
// `icon` keys into NavIcons; `group` renders NextAdmin-style sidebar sections.
import type { NavIconName } from "@/components/layout/icons";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconName;
  roles?: string[];
  group?: "workspace" | "admin";
}

export const NAV_GROUPS: Record<string, string> = {
  workspace: "Workspace",
  admin: "Administration",
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", group: "workspace" },
  { href: "/projects", label: "Projects", icon: "projects", group: "workspace" },
  {
    href: "/culture",
    label: "Cultural Knowledge",
    icon: "culture",
    roles: ["ADMIN", "DESIGNER", "CULTURAL_EXPERT", "RESEARCHER"],
    group: "workspace",
  },
  { href: "/design-studio", label: "Design Studio", icon: "studio", roles: ["ADMIN", "DESIGNER"], group: "workspace" },
  { href: "/materials", label: "Materials & Cost", icon: "materials", roles: ["ADMIN", "DESIGNER"], group: "workspace" },
  {
    href: "/evaluations",
    label: "Evaluations",
    icon: "evaluations",
    roles: ["ADMIN", "DESIGNER", "CULTURAL_EXPERT", "RESEARCHER"],
    group: "workspace",
  },
  { href: "/reports", label: "Reports", icon: "reports", group: "workspace" },
  { href: "/admin/users", label: "Administration", icon: "admin", roles: ["ADMIN"], group: "admin" },
];

export function visibleNav(roles: string[]): NavItem[] {
  return NAV_ITEMS.filter(
    (i) => !i.roles || i.roles.some((r) => roles.includes(r)),
  );
}
