import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth/session";
import { NAV_GROUPS, visibleNav } from "@/lib/auth/navigation";
import LogoutButton from "@/components/layout/LogoutButton";
import NavLinks from "@/components/layout/NavLinks";
import ReviewBell, { ReviewBellFallback } from "@/components/layout/ReviewBell";
import Topbar from "@/components/layout/Topbar";

// Protected shell — md/08 §5 Main Navigation. Signature is re-verified here
// (middleware only checks cookie presence on the edge). The shell streams:
// nothing here awaits the database except the session check, and the review
// count loads as an isolated Suspense island.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const nav = visibleNav(user.roles);
  const groups = (Object.keys(NAV_GROUPS) as Array<"workspace" | "admin">)
    .map((g) => ({ key: g, items: nav.filter((i) => (i.group ?? "workspace") === g) }))
    .filter((g) => g.items.length > 0);
  const name = user.displayName || user.email;

  return (
    <div className="min-h-screen bg-paper md:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-ink-950 text-stone-200 md:flex">
        <div className="flex items-center gap-2.5 px-5 py-4">
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-lg bg-brass-500 font-display text-xl text-ink-950">
            A
          </span>
          <span>
            <span className="block font-display text-xl leading-none text-white">AttireLab</span>
            <span className="mt-0.5 block text-[11px] uppercase tracking-widest text-brass-200">
              Heritage design lab
            </span>
          </span>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="Main">
          {groups.map((g) => (
            <div key={g.key}>
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                {NAV_GROUPS[g.key]}
              </p>
              <div className="space-y-1">
                <NavLinks items={g.items} variant="desktop" />
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-ink-800 p-4 text-sm">
          <p className="truncate font-medium text-white">{name}</p>
          <p className="truncate text-xs text-stone-400">
            {user.roles.join(", ")}
          </p>
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-stone-200 bg-ink-950 px-4 py-3 text-white md:hidden">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display text-lg">AttireLab</span>
            <LogoutButton />
          </div>
          <nav
            className="flex gap-1 overflow-x-auto text-sm"
            aria-label="Main mobile"
          >
            <NavLinks items={nav} variant="mobile" />
          </nav>
        </header>
        <div className="hidden md:block">
          <Topbar
            userName={name}
            userRoles={user.roles.join(", ")}
            bell={
              <Suspense fallback={<ReviewBellFallback />}>
                <ReviewBell />
              </Suspense>
            }
          />
        </div>
        {children}
      </div>
    </div>
  );
}
