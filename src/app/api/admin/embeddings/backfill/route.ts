import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs } from "@/lib/db/schema";
import { getSessionUser, hasRole } from "@/lib/auth/session";
import { EmbeddingService } from "@/server/services/embeddings/EmbeddingService";

// Admin embedding maintenance (md/04 §72–74): explicit backfill of
// cultural-element vectors, plus a status probe. ADMIN-gated; every run is
// audit-logged. Search never backfills implicitly — it degrades to
// text-only when embeddings are missing.
const schema = z.object({
  limit: z.number().int().min(1).max(500).optional(),
  batchSize: z.number().int().min(1).max(100).optional(),
});

export async function GET() {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!hasRole(user, "ADMIN")) return NextResponse.json({ ok: false }, { status: 403 });
  return NextResponse.json({ ok: true, data: await EmbeddingService.status() });
}

export async function POST(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!hasRole(user, "ADMIN")) return NextResponse.json({ ok: false }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid limit/batchSize." }, { status: 400 });
  }
  try {
    const result = await EmbeddingService.backfill(parsed.data);
    await db.insert(auditLogs).values({
      userId: user.id,
      action: "EMBEDDINGS_BACKFILLED",
      entityType: "CulturalElement",
      entityId: null,
      newValue: {
        embedded: result.embedded,
        failed: result.failed,
        provider: result.provider,
      },
    });
    return NextResponse.json({ ok: true, data: result });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    const code = (e as { code?: string })?.code;
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Backfill failed.", ...(code ? { code } : {}) },
      { status },
    );
  }
}
