// Role-filtered navigation — md/08 §94 (Navigation by User Role).
export interface NavItem {
  href: string;
  label: string;
  roles?: string[];
  section?: "main" | "admin";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  {
    href: "/culture",
    label: "Cultural Knowledge",
    roles: ["ADMIN", "DESIGNER", "CULTURAL_EXPERT", "RESEARCHER"],
  },
  { href: "/design-studio", label: "Design Studio", roles: ["ADMIN", "DESIGNER"] },
  { href: "/materials", label: "Materials & Cost", roles: ["ADMIN", "DESIGNER"] },
  {
    href: "/evaluations",
    label: "Evaluations",
    roles: ["ADMIN", "DESIGNER", "CULTURAL_EXPERT", "RESEARCHER"],
  },
  { href: "/reports", label: "Reports" },
  { href: "/admin/users", label: "Administration", roles: ["ADMIN"], section: "admin" },
];

export function visibleNav(roles: string[]): NavItem[] {
  return NAV_ITEMS.filter(
    (i) => !i.roles || i.roles.some((r) => roles.includes(r)),
  );
}
