import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { auditLogs, designs, projects } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { projectUpdateSchema } from "@/lib/validation/schemas";
import {
  canTransitionProject,
  isValidProjectStatus,
} from "@/server/services/design/ProjectService";

async function requireUser() {
  return getSessionUser().catch(() => null);
}

async function findProject(id: string) {
  return db.query.projects.findFirst({
    where: and(eq(projects.id, id), isNull(projects.deletedAt)),
    with: {
      briefs: true,
      designs: { orderBy: desc(designs.updatedAt) },
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const project = await findProject(params.id);
  if (!project) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true, data: project });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const project = await findProject(params.id);
  if (!project) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = projectUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid update." }, { status: 400 });
  }

  const { status, ...rest } = parsed.data;
  if (status !== undefined) {
    if (!isValidProjectStatus(status)) {
      return NextResponse.json({ ok: false, error: `Unknown status: ${status}` }, { status: 400 });
    }
    if (!canTransitionProject(project.status ?? "", status)) {
      return NextResponse.json(
        { ok: false, error: `Cannot move project from ${project.status} to ${status}.` },
        { status: 422 },
      );
    }
  }

  const [updated] = await db
    .update(projects)
    .set({
      ...(rest.name !== undefined ? { name: rest.name } : {}),
      ...(rest.description !== undefined ? { description: rest.description ?? null } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(rest.assignedDesigner !== undefined
        ? { assignedDesigner: rest.assignedDesigner }
        : {}),
      ...(rest.targetCompletionDate !== undefined
        ? {
            targetCompletionDate: rest.targetCompletionDate
              ? new Date(rest.targetCompletionDate)
              : null,
          }
        : {}),
    })
    .where(eq(projects.id, project.id))
    .returning();

  await db.insert(auditLogs).values({
    userId: user.id,
    action:
      status !== undefined && status !== project.status
        ? "PROJECT_STATUS_CHANGED"
        : "PROJECT_UPDATED",
    entityType: "Project",
    entityId: project.id,
    oldValue: { status: project.status },
    newValue: { status: updated.status, name: updated.name },
  });

  return NextResponse.json({ ok: true, data: updated });
}

// Soft delete — md/03 §63.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const project = await findProject(params.id);
  if (!project) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  await db.update(projects).set({ deletedAt: new Date() }).where(eq(projects.id, project.id));
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "PROJECT_DELETED",
    entityType: "Project",
    entityId: project.id,
  });

  return NextResponse.json({ ok: true });
}
