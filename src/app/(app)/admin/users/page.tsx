import { redirect } from "next/navigation";
import { asc, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { getSessionUser, hasRole } from "@/lib/auth/session";
import StatusBadge from "@/components/status/StatusBadge";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/dashboard/StatCard";

// Admin — user directory (md/01 §36): role distribution stats, search,
// role pills. Role editing stays out of scope (seed/DB).
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const user = await getSessionUser();
  if (!user || !hasRole(user, "ADMIN")) redirect("/dashboard");

  const q = (searchParams.q ?? "").trim();
  const userList = await db.query.users.findMany({
    where: q ? or(ilike(users.email, `%${q}%`), ilike(users.displayName, `%${q}%`)) : undefined,
    orderBy: asc(users.createdAt),
    with: { userRoles: { with: { role: true } } },
  });
  const counts: Record<string, number> = {};
  for (const u of userList)
    for (const r of u.userRoles) counts[r.role.code] = (counts[r.role.code] ?? 0) + 1;
  const roleOf = (u: (typeof userList)[number]) => u.userRoles.map((r) => r.role.code);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        eyebrow="Administration"
        title="Users & roles"
        description="Who can access the atelier, and with which responsibilities. Role editing UI is out of scope — use the seed or DB for now."
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Total Users" value={userList.length} icon="admin" tone="ink" />
        <StatCard label="Admins" value={counts["ADMIN"] ?? 0} caption="Full access" icon="admin" tone="brass" />
        <StatCard label="Designers" value={counts["DESIGNER"] ?? 0} caption="Studio + costing" icon="studio" tone="green" />
        <StatCard
          label="Experts & Researchers"
          value={(counts["CULTURAL_EXPERT"] ?? 0) + (counts["RESEARCHER"] ?? 0)}
          caption="Knowledge stewards"
          icon="culture"
          tone="ink"
        />
      </div>

      <Card
        eyebrow="Directory"
        title={`${userList.length} account${userList.length === 1 ? "" : "s"}`}
        action={
          <form action="/admin/users" method="get" role="search" className="flex items-center gap-2">
            <label htmlFor="user-search" className="sr-only">Search users</label>
            <input
              id="user-search"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search email or name…"
              className="input max-w-56 py-1.5"
            />
            <button type="submit" className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-paper">
              Search
            </button>
          </form>
        }
      >
        {userList.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">No accounts match{q ? ` “${q}”` : ""}.</p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200">
                <th>Account</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Last login</th>
              </tr>
            </thead>
            <tbody>
              {userList.map((u) => (
                <tr key={u.id}>
                  <td>
                    <p className="font-medium text-ink-900">{u.displayName ?? u.email}</p>
                    {u.displayName && <p className="text-xs text-stone-500">{u.email}</p>}
                  </td>
                  <td>
                    <span className="flex flex-wrap gap-1">
                      {roleOf(u).map((code) => (
                        <span key={code} className="rounded-full bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink-800 ring-1 ring-inset ring-ink-100">
                          {code}
                        </span>
                      )) || <span className="text-stone-400">—</span>}
                    </span>
                  </td>
                  <td>
                    <StatusBadge value={u.status} />
                  </td>
                  <td className="whitespace-nowrap text-stone-500">
                    {u.lastLoginAt ? u.lastLoginAt.toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </main>
  );
}
