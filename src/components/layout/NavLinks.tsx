"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/auth/navigation";
import { NavIcons } from "@/components/layout/icons";

// Active-section navigation (md/08 §5). The current section is highlighted
// with background + aria-current — never position or color alone.
export default function NavLinks({
  items,
  variant,
}: {
  items: NavItem[];
  variant: "desktop" | "mobile";
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  if (variant === "mobile") {
    return (
      <>
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={isActive(i.href) ? "page" : undefined}
            className={`whitespace-nowrap rounded-lg border px-3 py-1 ${
              isActive(i.href)
                ? "border-brass-400 bg-brass-500 text-ink-950"
                : "border-ink-700 text-stone-200"
            }`}
          >
            {i.label}
          </Link>
        ))}
      </>
    );
  }

  return (
    <>
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={isActive(i.href) ? "page" : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-ink-800 hover:text-white ${
            isActive(i.href)
              ? "bg-ink-800 font-medium text-white shadow-[inset_2px_0_0_0_#d2a93b]"
              : "text-stone-300"
          }`}
        >
          <span aria-hidden="true" className={isActive(i.href) ? "text-brass-400" : "text-stone-400"}>
            {NavIcons[i.icon]}
          </span>
          {i.label}
        </Link>
      ))}
    </>
  );
}
