import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, user });
}
