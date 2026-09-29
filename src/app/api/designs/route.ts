import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, designVersions, designs } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

const schema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
});

function makeCode(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

// Designer-created (non-AI) design shell. AI-assisted concepts come from
// POST /api/designs/generate and POST /api/designs/[id]/regenerate.
export async function POST(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "projectId is required." }, { status: 400 });
  }
  let design = null;
  for (let i = 0; i < 2 && !design; i++) {
    try {
      [design] = await db
        .insert(designs)
        .values({
          projectId: parsed.data.projectId,
          designCode: makeCode("DES"),
          name: parsed.data.name ?? "Untitled design",
          status: "DRAFT",
          currentVersion: 1,
          createdBy: user.id,
        })
        .returning();
    } catch (e) {
      if (i === 1) throw e;
    }
  }
  await db.insert(designVersions).values({
    designId: design!.id,
    versionNumber: 1,
    generationSource: "MANUAL",
    status: "DRAFT",
    createdBy: user.id,
  });
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "DESIGN_CREATED",
    entityType: "Design",
    entityId: design!.id,
  });
  return NextResponse.json({ ok: true, data: design }, { status: 201 });
}
