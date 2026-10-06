"use client";

import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/auth/navigation";
import { NavIcons } from "@/components/layout/icons";

// Desktop topbar (NextAdmin-style): breadcrumb, global knowledge search,
// review-queue bell, user chip. Rendered inside the protected app layout.
export default function Topbar({
  userName,
  userRoles,
  bell,
}: {
  userName: string;
  userRoles: string;
  bell: React.ReactNode;
}) {
  const pathname = usePathname();
  const current =
    [...NAV_ITEMS].sort((a, b) => b.href.length - a.href.length).find(
      (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
    ) ?? NAV_ITEMS[0];

  return (
    <div className="sticky top-0 z-20 border-b border-stone-200 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
          <span className="text-brass-600">{NavIcons[current.icon]}</span>
          <span className="hidden text-stone-400 sm:inline">AttireLab</span>
          <span aria-hidden="true" className="hidden text-stone-300 sm:inline">/</span>
          <span aria-current="page" className="truncate font-medium text-ink-950">
            {current.label}
          </span>
        </nav>

        <form action="/culture" method="get" role="search" className="ml-auto hidden min-w-0 flex-1 max-w-xs items-center md:flex">
          <label htmlFor="topbar-search" className="sr-only">
            Search cultural knowledge
          </label>
          <div className="relative w-full">
            <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
              {NavIcons.search}
            </span>
            <input
              id="topbar-search"
              name="q"
              type="search"
              placeholder="Search motifs, textiles…"
              className="w-full rounded-lg border border-stone-200 bg-white py-1.5 pl-9 pr-3 text-sm shadow-sm placeholder:text-stone-400 focus:border-brass-500 focus:outline-none focus:ring-2 focus:ring-brass-200"
            />
          </div>
        </form>

        {bell}

        <div className="hidden items-center gap-2.5 border-l border-stone-200 pl-3 sm:flex">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 font-display text-sm text-brass-400"
          >
            {userName.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block max-w-32 truncate text-sm font-medium text-ink-950">{userName}</span>
            <span className="block max-w-32 truncate text-xs text-stone-500">{userRoles}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
