import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { auditLogs, users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { clientIp, checkRateLimitAsync, rateLimitDefaults } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation/schemas";

export async function POST(req: Request) {
  // md/09 §116: brute-force protection on the mutation class.
  const rl = await checkRateLimitAsync(`auth:${clientIp(req)}`, rateLimitDefaults().authPerMin, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid email or password." },
      { status: 400 },
    );
  }
  const { email, password } = parsed.data;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
    with: { userRoles: { with: { role: true } } },
  });

  const valid =
    user?.passwordHash &&
    user.status === "ACTIVE" &&
    (await verifyPassword(password, user.passwordHash));

  if (!user || !valid) {
    return NextResponse.json(
      { ok: false, error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const roleCodes = user.userRoles.map((r) => r.role.code);
  setSessionCookie(createSessionToken(user.id, roleCodes));
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "LOGIN",
    entityType: "User",
    entityId: user.id,
  });

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, displayName: user.displayName, roles: roleCodes },
  });
}
