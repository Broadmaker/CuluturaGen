import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { projectCulturalElements } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; elementId: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  await db
    .delete(projectCulturalElements)
    .where(
      and(
        eq(projectCulturalElements.projectId, params.id),
        eq(projectCulturalElements.culturalElementId, params.elementId),
      ),
    );
  return NextResponse.json({ ok: true });
}
