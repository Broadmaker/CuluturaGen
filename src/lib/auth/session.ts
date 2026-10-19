import { createHmac, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
// React's request-scoped `cache` ships in the Next server runtime but is absent
// in plain Node (unit tests, scripts) — fall back to the identity function so
// this module stays importable there instead of throwing at load time.
const memoize = <F extends (...args: never[]) => unknown>(fn: F): F =>
  typeof cache === "function" ? (cache(fn) as F) : fn;
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export const SESSION_COOKIE = "attirelab_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  uid: string;
  roles: string[];
  exp: number;
}

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

// Token format: base64url(payload).base64url(hmac-sha256)
export function signSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySessionToken(
  token: string | undefined | null,
): SessionPayload | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret())
    .update(body)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(
      Buffer.from(body, "base64url").toString("utf-8"),
    ) as SessionPayload;
    if (!p.uid || typeof p.exp !== "number" || p.exp <= Date.now())
      return null;
    if (!Array.isArray(p.roles)) return null;
    return p;
  } catch {
    return null;
  }
}

export function createSessionToken(uid: string, roles: string[]): string {
  return signSession({ uid, roles, exp: Date.now() + SESSION_MAX_AGE * 1000 });
}

export function setSessionCookie(token: string): void {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearSessionCookie(): void {
  cookies().set(SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
}

export interface SessionUser {
  id: string;
  email: string;
  displayName: string | null;
  roles: string[];
}

// Memoized per request: the (app) layout and the page each call this, and
// several components call it again — React `cache` collapses them into a
// single DB round trip so tab navigation stays snappy.
export const getSessionUser = memoize(async (): Promise<SessionUser | null> => {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const payload = verifySessionToken(token);
  if (!payload) return null;
  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.uid),
    with: { userRoles: { with: { role: true } } },
  });
  if (!user || user.status !== "ACTIVE") return null;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    roles: user.userRoles.map((r) => r.role.code),
  };
});

export function hasRole(user: SessionUser | null, ...allowed: string[]): boolean {
  if (!user) return false;
  return allowed.some((r) => user.roles.includes(r));
}
