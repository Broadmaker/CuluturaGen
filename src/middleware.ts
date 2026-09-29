import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// NOTE: cookie name duplicated from src/lib/auth/session.ts — middleware runs
// on the edge runtime where node:crypto is unavailable, so it only checks
// presence. Signature verification happens in the (app) layout + API routes.
const COOKIE = "attirelab_session";

const PROTECTED = [
  "/dashboard",
  "/projects",
  "/culture",
  "/design-studio",
  "/materials",
  "/evaluations",
  "/reports",
  "/admin",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const has = req.cookies.has(COOKIE);

  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (!has) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if ((pathname === "/login" || pathname === "/register") && has) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/culture/:path*",
    "/design-studio/:path*",
    "/materials/:path*",
    "/evaluations/:path*",
    "/reports/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
