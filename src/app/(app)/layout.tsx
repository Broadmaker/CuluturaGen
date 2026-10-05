import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { visibleNav } from "@/lib/auth/navigation";
import LogoutButton from "@/components/layout/LogoutButton";
import NavLinks from "@/components/layout/NavLinks";

// Protected shell — md/08 §5 Main Navigation. Signature is re-verified here
// (middleware only checks cookie presence on the edge).
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const nav = visibleNav(user.roles);
  const main = nav.filter((i) => i.section !== "admin");
  const admin = nav.filter((i) => i.section === "admin");
  const name = user.displayName || user.email;

  return (
    <div className="min-h-screen bg-paper md:flex">
      <aside className="hidden w-60 shrink-0 flex-col bg-ink-950 text-stone-200 md:flex">
        <div className="flex items-center gap-2.5 px-5 py-4">
          <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-lg bg-brass-500 font-display text-lg text-ink-950">
            A
          </span>
          <span>
            <span className="block font-display text-lg leading-none text-white">AttireLab</span>
            <span className="mt-0.5 block text-[11px] uppercase tracking-widest text-brass-200">
              Heritage design lab
            </span>
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-3" aria-label="Main">
          <NavLinks items={main} variant="desktop" />
          {admin.length > 0 && (
            <div className="pt-4">
              <p className="px-3 pb-1 text-xs uppercase tracking-widest text-neutral-400">
                Admin
              </p>
              <NavLinks items={admin} variant="desktop" />
            </div>
          )}
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
            <NavLinks items={[...main, ...admin]} variant="mobile" />
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
