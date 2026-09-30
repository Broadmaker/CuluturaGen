import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { auditLogs, roles, userRoles, users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { clientIp, checkRateLimit, rateLimitDefaults } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation/schemas";

// Open registration for the prototype; new users get DESIGNER.
// Role elevation is ADMIN-only via /admin/users (MVP 1 scope).
export async function POST(req: Request) {
  const rl = checkRateLimit(`auth:${clientIp(req)}`, rateLimitDefaults().authPerMin, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Valid email and password (min 8 chars) required." },
      { status: 400 },
    );
  }
  const { email, password, firstName, lastName } = parsed.data;
  const normalized = email.toLowerCase();

  const existing = await db.query.users.findFirst({
    where: eq(users.email, normalized),
    columns: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const [designer] = await db.select().from(roles).where(eq(roles.code, "DESIGNER"));
  if (!designer) {
    return NextResponse.json(
      { ok: false, error: "Server misconfigured: roles not seeded." },
      { status: 500 },
    );
  }

  const [user] = await db
    .insert(users)
    .values({
      email: normalized,
      passwordHash: await hashPassword(password),
      firstName,
      lastName,
      displayName: [firstName, lastName].filter(Boolean).join(" ") || null,
    })
    .returning();
  await db.insert(userRoles).values({ userId: user.id, roleId: designer.id });

  const roleCodes = ["DESIGNER"];
  setSessionCookie(createSessionToken(user.id, roleCodes));
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "REGISTER",
    entityType: "User",
    entityId: user.id,
  });

  return NextResponse.json(
    {
      ok: true,
      user: { id: user.id, email: user.email, displayName: user.displayName, roles: roleCodes },
    },
    { status: 201 },
  );
}
