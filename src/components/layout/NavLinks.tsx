"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/auth/navigation";
import { NavIcons } from "@/components/layout/icons";

// Active-section navigation (md/08 §5). The current section is a filled
// orange pill (reference style) with aria-current — never color alone.
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
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm transition-colors ${
              isActive(i.href)
                ? "border-brand-500 bg-brand-500 font-semibold text-white"
                : "border-stone-200 text-ink-600 hover:border-brand-200 hover:text-brand-700"
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
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
            isActive(i.href)
              ? "bg-brand-500 font-semibold text-white shadow-sm shadow-brand-500/30"
              : "text-ink-600 hover:bg-brand-50 hover:text-brand-700"
          }`}
        >
          <span
            aria-hidden="true"
            className={
              isActive(i.href)
                ? "text-white"
                : "text-ink-500 transition-colors group-hover:text-brand-500"
            }
          >
            {NavIcons[i.icon]}
          </span>
          {i.label}
        </Link>
      ))}
    </>
  );
}
