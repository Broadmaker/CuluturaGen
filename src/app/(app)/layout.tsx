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
      <aside className="hidden w-64 shrink-0 flex-col border-r border-stone-200/80 bg-white md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 font-display text-xl font-bold text-white shadow-sm shadow-brand-500/40"
          >
            A
          </span>
          <span>
            <span className="block font-display text-xl font-bold leading-none text-ink-950">
              AttireLab
            </span>
            <span className="mt-1 block text-[11px] font-medium uppercase tracking-widest text-ink-400">
              Heritage design lab
            </span>
          </span>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4 pt-2" aria-label="Main">
          {groups.map((g) => (
            <div key={g.key}>
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-400">
                {NAV_GROUPS[g.key]}
              </p>
              <div className="space-y-1">
                <NavLinks items={g.items} variant="desktop" />
              </div>
            </div>
          ))}
        </nav>
        <div className="m-3 rounded-2xl border border-stone-200/80 bg-paper/60 p-3.5 text-sm">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 font-display text-sm font-bold text-brand-700"
            >
              {name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium text-ink-900">{name}</span>
              <span className="block truncate text-xs text-ink-500">
                {user.roles.join(", ")}
              </span>
            </span>
          </div>
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-stone-200/80 bg-white px-4 py-3 md:hidden">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-display text-base font-bold text-white"
              >
                A
              </span>
              <span className="font-display text-lg font-bold text-ink-950">AttireLab</span>
            </span>
            <LogoutButton />
          </div>
          <nav className="flex gap-1.5 overflow-x-auto text-sm" aria-label="Main mobile">
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
