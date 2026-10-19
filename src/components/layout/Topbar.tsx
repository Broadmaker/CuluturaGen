"use client";

import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/auth/navigation";
import { NavIcons } from "@/components/layout/icons";

// Desktop topbar (reference admin style): breadcrumb, pill search, review
// bell, user chip. Rendered inside the protected app layout.
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
    <div className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/95 backdrop-blur">
      <div className="flex w-full items-center gap-3 px-6 py-3.5">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
          <span className="text-brand-500">{NavIcons[current.icon]}</span>
          <span className="hidden text-ink-500 sm:inline">AttireLab</span>
          <span aria-hidden="true" className="hidden text-ink-300 sm:inline">/</span>
          <span aria-current="page" className="truncate font-display font-semibold text-ink-950">
            {current.label}
          </span>
        </nav>

        <form
          action="/culture"
          method="get"
          role="search"
          className="ml-auto hidden min-w-0 flex-1 max-w-xs items-center md:flex"
        >
          <label htmlFor="topbar-search" className="sr-only">
            Search cultural knowledge
          </label>
          <div className="relative w-full">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500"
            >
              {NavIcons.search}
            </span>
            <input
              id="topbar-search"
              name="q"
              type="search"
              placeholder="Search motifs, textiles…"
              className="w-full rounded-full border border-stone-200 bg-paper/70 py-2 pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </div>
        </form>

        {bell}

        <div className="hidden items-center gap-2.5 rounded-full border border-stone-200/80 py-1 pl-1 pr-3 sm:flex">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 font-display text-sm font-bold text-brand-700"
          >
            {userName.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block max-w-32 truncate text-sm font-semibold text-ink-900">{userName}</span>
            <span className="block max-w-32 truncate text-xs text-ink-500">{userRoles}</span>
          </span>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 text-ink-500">
            <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
