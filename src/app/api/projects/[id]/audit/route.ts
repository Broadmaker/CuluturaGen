import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { AuditService } from "@/server/services/audit/AuditService";

// GET /api/projects/[id]/audit — Phase 18 project trail (md/10 §114–117).
// Returns the §116 traceability chain as audit rows: project + designs +
// versions + evaluations + cost estimates + reports, newest first.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, params.id), isNull(projects.deletedAt)),
    columns: { id: true },
  });
  if (!project) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const data = await AuditService.forProject(params.id, 100);
  return NextResponse.json({ ok: true, data });
}
