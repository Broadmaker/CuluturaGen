import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { DesignService } from "@/server/services/design/DesignService";

const schema = z.object({
  a: z.number().int().positive(),
  b: z.number().int().positive(),
});

// Side-by-side version bundles: spec, cultural elements, latest cost,
// latest evaluation. One call so the comparison reads consistent snapshots.
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = schema.safeParse({
    a: Number(new URL(req.url).searchParams.get("a")),
    b: Number(new URL(req.url).searchParams.get("b")),
  });
  if (!parsed.success || parsed.data.a === parsed.data.b) {
    return NextResponse.json({ ok: false, error: "Two different versions (a, b) are required." }, { status: 400 });
  }
  const data = await DesignService.compare(params.id, parsed.data.a, parsed.data.b);
  if (!data) {
    return NextResponse.json({ ok: false, error: "Design or versions not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, data });
}
