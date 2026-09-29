import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { AIService } from "@/server/services/ai/AIService";

const schema = z.object({
  projectId: z.string().uuid(),
  instruction: z.string().max(2000).optional(),
});

// md/08 §123 — the UI confirms before calling; the API records everything.
export async function POST(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "projectId is required." }, { status: 400 });
  }
  try {
    const result = await AIService.generate({
      projectId: parsed.data.projectId,
      userId: user.id,
      instruction: parsed.data.instruction,
    });
    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 502;
    const message = e instanceof Error ? e.message : "Generation failed.";
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
