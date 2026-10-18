import Link from "next/link";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { getSessionUser, hasRole } from "@/lib/auth/session";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Pagination, { PAGE_SIZE } from "@/components/ui/Pagination";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/status/StatusBadge";
import DistributionList, {
  type DistributionItem,
} from "@/components/admin/DistributionList";
import { ROLE_ORDER, roleMeta } from "@/components/admin/roleMeta";

// Admin — user directory (md/01 §36, md/08 §89). Role distribution, search,
// account health. Role editing stays out of scope (seed/DB).
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; role?: string; page?: string };
}) {
  const user = await getSessionUser();
  if (!user || !hasRole(user, "ADMIN")) redirect("/dashboard");

  const q = (searchParams.q ?? "").trim();
  const activeRole = (searchParams.role ?? "").trim().toUpperCase();
  const page = Math.max(1, Number(searchParams.page) || 1);

  const userList = await db.query.users.findMany({
    orderBy: asc(users.createdAt),
    with: { userRoles: { with: { role: true } } },
  });
  const roleOf = (u: (typeof userList)[number]) => u.userRoles.map((r) => r.role.code);

  const counts: Record<string, number> = {};
  for (const u of userList)
    for (const code of roleOf(u)) counts[code] = (counts[code] ?? 0) + 1;
  const roleAssignments = Object.values(counts).reduce((s, n) => s + n, 0);

  const statusCounts: Record<string, number> = {};
  for (const u of userList) statusCounts[u.status] = (statusCounts[u.status] ?? 0) + 1;

  const needle = q.toLowerCase();
  const rows = userList.filter((u) => {
    const matchesRole = !activeRole || roleOf(u).includes(activeRole);
    const matchesQuery =
      !needle ||
      u.email.toLowerCase().includes(needle) ||
      (u.displayName ?? "").toLowerCase().includes(needle);
    return matchesRole && matchesQuery;
  });
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const extraRoles = Object.keys(counts).filter(
    (c) => !(ROLE_ORDER as readonly string[]).includes(c),
  );
  const roleItems: DistributionItem[] = [...ROLE_ORDER, ...extraRoles]
    .filter((code) => (counts[code] ?? 0) > 0)
    .map((code) => {
      const meta = roleMeta(code);
      return { key: code, label: meta.label, value: counts[code], dot: meta.dot, bar: meta.bar };
    });

  const STATUS_META: Record<string, { label: string; dot: string; bar: string }> = {
    ACTIVE: { label: "Active", dot: "bg-emerald-600", bar: "bg-emerald-500" },
    INACTIVE: { label: "Inactive", dot: "bg-stone-400", bar: "bg-stone-400" },
    SUSPENDED: { label: "Suspended", dot: "bg-red-600", bar: "bg-red-500" },
  };
  const statusOrder = ["ACTIVE", "INACTIVE", "SUSPENDED"];
  const extraStatuses = Object.keys(statusCounts).filter((s) => !statusOrder.includes(s));
  const statusItems: DistributionItem[] = [...statusOrder, ...extraStatuses]
    .filter((s) => (statusCounts[s] ?? 0) > 0)
    .map((s) => {
      const meta = STATUS_META[s] ?? { label: s, dot: "bg-stone-400", bar: "bg-stone-400" };
      return { key: s, label: meta.label, value: statusCounts[s], dot: meta.dot, bar: meta.bar };
    });

  const expertCount = (counts.CULTURAL_EXPERT ?? 0) + (counts.RESEARCHER ?? 0);
  const qParam = q ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <main className="w-full space-y-6 p-6">
      <PageHeader
        eyebrow="Administration"
        title="Users & roles"
        description="Who can access the atelier, and with which responsibilities. Role editing is out of scope — manage assignments through the seed or database."
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={userList.length}
          caption={`${roleAssignments} role assignment${roleAssignments === 1 ? "" : "s"}`}
          icon="admin"
          tone="ink"
        />
        <StatCard
          label="Administrators"
          value={counts.ADMIN ?? 0}
          caption="Full system access"
          icon="admin"
          tone="brass"
        />
        <StatCard
          label="Designers"
          value={counts.DESIGNER ?? 0}
          caption="Studio & costing"
          icon="studio"
          tone="green"
        />
        <StatCard
          label="Experts & Researchers"
          value={expertCount}
          caption="Knowledge stewards"
          icon="culture"
          tone="ink"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          eyebrow="Directory"
          title={`${rows.length} account${rows.length === 1 ? "" : "s"}`}
          className="lg:col-span-2"
          action={
            <form
              action="/admin/users"
              method="get"
              role="search"
              className="flex items-center gap-2"
            >
              {activeRole && <input type="hidden" name="role" value={activeRole} />}
              <label htmlFor="user-search" className="sr-only">
                Search users
              </label>
              <input
                id="user-search"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Search email or name…"
                className="input max-w-56 py-1.5"
              />
              <button
                type="submit"
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-paper"
              >
                Search
              </button>
            </form>
          }
        >
          <div className="mb-3 flex flex-wrap gap-1.5">
            <FilterPill
              href={q ? `/admin/users?q=${encodeURIComponent(q)}` : "/admin/users"}
              active={!activeRole}
              label="All"
            />
            {ROLE_ORDER.map((code) => (
              <FilterPill
                key={code}
                href={`/admin/users?role=${code}${qParam}`}
                active={activeRole === code}
                label={roleMeta(code).label}
              />
            ))}
          </div>

          {rows.length === 0 ? (
            <div className="mt-2 rounded-lg border border-dashed border-stone-300 bg-paper px-4 py-12 text-center">
              <p className="text-sm font-medium text-ink-900">No accounts found</p>
              <p className="mt-1 text-sm text-ink-500">
                Try a different search term or clear the role filter.
              </p>
            </div>
          ) : (
            <table className="mt-1 w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th>Account</th>
                  <th>Roles</th>
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Last login</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((u) => {
                  const name = u.displayName ?? u.email;
                  const codes = roleOf(u);
                  return (
                    <tr key={u.id} className="align-middle">
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={name} src={u.profileImageUrl} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink-900">{name}</p>
                            {u.displayName && (
                              <p className="truncate text-xs text-ink-500">{u.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="flex flex-wrap gap-1">
                          {codes.length > 0 ? (
                            codes.map((code) => (
                              <span
                                key={code}
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${roleMeta(code).chip}`}
                              >
                                {roleMeta(code).label}
                              </span>
                            ))
                          ) : (
                            <span className="text-ink-400">—</span>
                          )}
                        </span>
                      </td>
                      <td>
                        <StatusBadge value={u.status} />
                      </td>
                      <td className="hidden whitespace-nowrap text-ink-500 sm:table-cell">
                        {u.lastLoginAt
                          ? u.lastLoginAt.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Never"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {rows.length > 0 && (
            <Pagination
              page={page}
              total={rows.length}
              basePath="/admin/users"
              query={{ q, role: activeRole }}
            />
          )}
        </Card>

        <div className="space-y-4">
          <Card eyebrow="Access" title="Role distribution">
            <DistributionList
              items={roleItems}
              total={roleAssignments}
              emptyText="No roles assigned yet."
            />
          </Card>
          <Card eyebrow="Health" title="Account status">
            <DistributionList
              items={statusItems}
              total={userList.length}
              emptyText="No accounts yet."
            />
          </Card>
        </div>
      </div>
    </main>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-brass-500 bg-brass-500 text-ink-950 shadow-sm"
          : "border-stone-200 bg-white text-ink-600 hover:border-brass-300 hover:text-ink-900"
      }`}
    >
      {label}
    </Link>
  );
}
