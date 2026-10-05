import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { corsAllowHeaders, isOriginAllowed } from "@/lib/api/cors";

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

  // API boundary (md/09 §7, §113): request IDs, strict CORS, access log.
  // Never redirects API calls — routes own their auth responses.
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return handleApi(req);
  }

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

function handleApi(req: NextRequest) {
  const id = req.headers.get("x-request-id") || crypto.randomUUID();
  const origin = req.headers.get("origin");

  if (!isOriginAllowed(req.nextUrl.origin, origin)) {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: "warn",
        event: "api_origin_forbidden",
        requestId: id,
        method: req.method,
        path: req.nextUrl.pathname,
        origin,
      }),
    );
    return NextResponse.json(
      { ok: false, code: "ORIGIN_FORBIDDEN", error: "Cross-origin requests are not allowed.", requestId: id },
      { status: 403, headers: { "X-Request-ID": id } },
    );
  }

  if (req.method === "OPTIONS") {
    const headers: Record<string, string> = { "X-Request-ID": id };
    if (origin) Object.assign(headers, corsAllowHeaders(origin));
    return new NextResponse(null, { status: 204, headers });
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", id);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("X-Request-ID", id);
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "info",
      event: "api_request",
      requestId: id,
      method: req.method,
      path: req.nextUrl.pathname,
    }),
  );
  return res;
}

export const config = {
  matcher: [
    "/api/:path*",
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
