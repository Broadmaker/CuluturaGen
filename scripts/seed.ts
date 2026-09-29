import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db/client";
import { roles, userRoles, users } from "../src/lib/db/schema";
import { hashPassword } from "../src/lib/auth/password";

const ROLES = ["ADMIN", "DESIGNER", "CULTURAL_EXPERT", "RESEARCHER", "VIEWER"];

async function main() {
  for (const code of ROLES) {
    await db.insert(roles).values({ code, name: code }).onConflictDoNothing({ target: roles.code });
  }
  console.log("Seeded roles:", ROLES.join(", "));

  // Default admin for local development (MVP 1). Change after first login.
  const adminEmail = "admin@attirelab.local";
  const passwordHash = await hashPassword("Admin123!");
  const existing = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  });

  const adminId = existing
    ? (
        await db
          .update(users)
          .set({ passwordHash, status: "ACTIVE" })
          .where(eq(users.id, existing.id))
          .returning({ id: users.id })
      )[0].id
    : (
        await db
          .insert(users)
          .values({
            email: adminEmail,
            passwordHash,
            firstName: "Admin",
            displayName: "Administrator",
            status: "ACTIVE",
          })
          .returning({ id: users.id })
      )[0].id;

  for (const code of ["ADMIN", "DESIGNER"]) {
    const [role] = await db.select().from(roles).where(eq(roles.code, code));
    await db
      .insert(userRoles)
      .values({ userId: adminId, roleId: role.id })
      .onConflictDoNothing();
  }
  console.log(`Seeded admin: ${adminEmail} (ADMIN, DESIGNER)`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
