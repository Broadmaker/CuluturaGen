import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { getSessionUser, hasRole } from "@/lib/auth/session";
import StatusBadge from "@/components/status/StatusBadge";

// MVP 1 admin: user list with roles + status (md/01 §36).
export default async function AdminUsersPage() {
  const user = await getSessionUser();
  if (!user || !hasRole(user, "ADMIN")) redirect("/dashboard");

  const userList = await db.query.users.findMany({
    orderBy: asc(users.createdAt),
    with: { userRoles: { with: { role: true } } },
  });

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">Administration — Users</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Role editing UI is out of MVP 1 scope; use the seed or DB for now.
      </p>
      <table className="mt-4 w-full rounded border bg-white text-sm">
        <thead>
          <tr className="border-b text-left text-neutral-500">
            <th className="px-3 py-2">Email</th>
            <th>Name</th>
            <th>Roles</th>
            <th>Status</th>
            <th className="px-3">Last login</th>
          </tr>
        </thead>
        <tbody>
          {userList.map((u) => (
            <tr key={u.id} className="border-b">
              <td className="px-3 py-2 font-medium">{u.email}</td>
              <td>{u.displayName ?? "—"}</td>
              <td>{u.userRoles.map((r) => r.role.code).join(", ") || "—"}</td>
              <td>
                <StatusBadge value={u.status} />
              </td>
              <td className="px-3 text-neutral-500">
                {u.lastLoginAt ? u.lastLoginAt.toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
