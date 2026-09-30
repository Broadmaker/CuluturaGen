// §122: AuditService against the real DB. Skips gracefully when DATABASE_URL
// is unreachable (unit suite still runs). Creates its own project row and
// removes it afterwards — never touches seed/demo data.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { auditLogs, projects, users } from "@/lib/db/schema";
import { AuditService } from "@/server/services/audit/AuditService";

let reachable = false;
let projectId = "";

async function dbOk(): Promise<boolean> {
  try {
    await db.execute("select 1");
    return true;
  } catch {
    return false;
  }
}

beforeAll(async () => {
  reachable = await dbOk();
  if (!reachable) return;
  const admin = await db.query.users.findFirst({
    where: eq(users.email, "admin@attirelab.local"),
    columns: { id: true },
  });
  if (!admin) return; // seeded admin missing — tests below skip via projectId guard
  const code = `TST-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const [p] = await db
    .insert(projects)
    .values({ projectCode: code, name: "Audit integration probe", createdBy: admin.id })
    .returning({ id: projects.id });
  projectId = p.id;
});

afterAll(async () => {
  if (!reachable || !projectId) return;
  await db.delete(auditLogs).where(eq(auditLogs.entityId, projectId));
  await db.delete(projects).where(eq(projects.id, projectId));
});

describe("audit trail integration", () => {
  it("log() writes and forProject() finds the row", async () => {
    if (!reachable || !projectId) return;
    await AuditService.log({
      userId: null,
      action: "PROJECT_CREATED",
      entityType: "Project",
      entityId: projectId,
      newValue: { probe: true },
    });
    const trail = await AuditService.forProject(projectId, 10);
    expect(trail.some((a) => a.action === "PROJECT_CREATED")).toBe(true);
  });

  it("log() never throws — audit failure cannot break callers", async () => {
    // entityId column is uuid; a garbage id must be swallowed, not raised.
    await expect(
      AuditService.log({ action: "PROJECT_UPDATED", entityType: "Project", entityId: "not-a-uuid" }),
    ).resolves.toBeUndefined();
  });

  it("forEntity() scopes to one entity", async () => {
    if (!reachable || !projectId) return;
    const rows = await AuditService.forEntity("Project", projectId, 10);
    expect(rows.every((r) => r.entityId === projectId)).toBe(true);
  });
});
