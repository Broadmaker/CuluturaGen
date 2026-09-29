import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { designs } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { AIService } from "@/server/services/ai/AIService";

const schema = z.object({ instruction: z.string().max(2000).optional() });

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid instruction." }, { status: 400 });
  }
  const [design] = await db.select().from(designs).where(eq(designs.id, params.id));
  if (!design) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  try {
    const result = await AIService.generate({
      projectId: design.projectId,
      userId: user.id,
      instruction: parsed.data.instruction,
      baseDesignId: design.id,
    });
    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 502;
    const message = e instanceof Error ? e.message : "Regeneration failed.";
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
