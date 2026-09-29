import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { visibleNav } from "@/lib/auth/navigation";
import LogoutButton from "@/components/layout/LogoutButton";

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
    <div className="min-h-screen bg-neutral-50 md:flex">
      <aside className="hidden w-60 shrink-0 flex-col bg-neutral-900 text-neutral-100 md:flex">
        <div className="px-5 py-4 text-lg font-bold tracking-tight">
          AttireLab
        </div>
        <nav className="flex-1 space-y-1 px-3" aria-label="Main">
          {main.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className="block rounded px-3 py-2 text-sm hover:bg-neutral-800"
            >
              {i.label}
            </Link>
          ))}
          {admin.length > 0 && (
            <div className="pt-4">
              <p className="px-3 pb-1 text-xs uppercase tracking-widest text-neutral-400">
                Admin
              </p>
              {admin.map((i) => (
                <Link
                  key={i.href}
                  href={i.href}
                  className="block rounded px-3 py-2 text-sm hover:bg-neutral-800"
                >
                  {i.label}
                </Link>
              ))}
            </div>
          )}
        </nav>
        <div className="border-t border-neutral-700 p-4 text-sm">
          <p className="truncate font-medium">{name}</p>
          <p className="truncate text-xs text-neutral-400">
            {user.roles.join(", ")}
          </p>
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b bg-white px-4 py-3 md:hidden">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-bold">AttireLab</span>
            <LogoutButton />
          </div>
          <nav
            className="flex gap-1 overflow-x-auto text-sm"
            aria-label="Main mobile"
          >
            {[...main, ...admin].map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className="whitespace-nowrap rounded border px-3 py-1"
              >
                {i.label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
