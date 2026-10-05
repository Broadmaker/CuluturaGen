import { NextResponse } from "next/server";

// Safe API error envelope (md/09 §87–88, §113). Internal details (stacks,
// driver messages, provider payloads) reach the client ONLY outside
// production. Every envelope carries the request ID when present (md/09 §7).

export function requestIdOf(req: Request): string | undefined {
  return req.headers.get("x-request-id") ?? undefined;
}

export function apiFail(
  req: Request,
  code: string,
  message: string,
  status: number,
  detail?: unknown,
): NextResponse {
  const body: Record<string, unknown> = {
    ok: false,
    code,
    error: message,
  };
  const requestId = requestIdOf(req);
  if (requestId) body.requestId = requestId;
  if (detail !== undefined && process.env.NODE_ENV !== "production") {
    body.detail = detail instanceof Error ? detail.message : detail;
  }
  return NextResponse.json(body, { status });
}

export function apiOk<T>(data: T, init?: { status?: number }): NextResponse {
  return NextResponse.json({ ok: true, data }, { status: init?.status ?? 200 });
}
