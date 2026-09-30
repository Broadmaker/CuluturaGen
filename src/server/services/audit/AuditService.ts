import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  auditLogs,
  costEstimates,
  designVersions,
  designs,
  evaluations,
  reports,
} from "@/lib/db/schema";

// Phase 18 — Audit & traceability (md/10 §114–117).
//
// Writes already exist scattered across routes; this central helper makes them
// consistent and guarantees an audit failure never breaks the primary
// operation. Reads power the project History view and the §116
// traceability chain (Final Design → Version → Job → Context → Requirements
// → Elements → Sources → Body → Materials → Cost → Evaluation → Review →
// Approval — each step leaves audit rows pointing at its entity).
export const AUDIT_ACTIONS = [
  "LOGIN",
  "PROJECT_CREATED",
  "PROJECT_UPDATED",
  "CULTURAL_RECORD_VIEWED",
  "CULTURAL_RECORD_CREATED",
  "CULTURAL_RECORD_VERIFIED",
  "DESIGN_CREATED",
  "DESIGN_GENERATED",
  "DESIGN_MODIFIED",
  "AI_CONTEXT_CREATED",
  "AI_JOB_STARTED",
  "AI_JOB_COMPLETED",
  "COST_CALCULATED",
  "EVALUATION_RUN",
  "DESIGN_ACCEPTED",
  "DESIGN_REJECTED",
  "REVISION_REQUESTED",
  "DESIGN_APPROVED",
  "REPORT_GENERATED",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface AuditEntry {
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;
  ipAddress?: string | null;
}

export class AuditService {
  // Fire-and-forget safe: audit must never throw into the caller.
  static async log(entry: AuditEntry): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        userId: entry.userId ?? null,
        action: entry.action,
        entityType: entry.entityType ?? null,
        entityId: entry.entityId ?? null,
        oldValue: (entry.oldValue ?? null) as never,
        newValue: (entry.newValue ?? null) as never,
        metadata: (entry.metadata ?? null) as never,
        ipAddress: (entry.ipAddress ?? null) as never,
      });
    } catch {
      // Intentionally swallowed — see above.
    }
  }

  // Full project trail: the project row itself plus every design, version,
  // evaluation, cost estimate, and report reachable from it. Mirrors the
  // filtering ReportService already uses, extended to the §116 chain.
  static async forProject(projectId: string, limit = 100) {
    const projectDesigns = await db.query.designs.findMany({
      where: eq(designs.projectId, projectId),
      columns: { id: true },
    });
    const designIds = projectDesigns.map((d) => d.id);

    const versions =
      designIds.length > 0
        ? await db.query.designVersions.findMany({
            where: (v, { inArray }) => inArray(v.designId, designIds),
            columns: { id: true, designId: true },
          })
        : [];
    const versionIds = versions.map((v) => v.id);

    const [evals, estimates, projectReports] = await Promise.all([
      versionIds.length > 0
        ? db.query.evaluations.findMany({
            where: (e, { inArray }) => inArray(e.designVersionId, versionIds),
            columns: { id: true },
          })
        : [],
      versionIds.length > 0
        ? db.query.costEstimates.findMany({
            where: (c, { inArray }) => inArray(c.designVersionId, versionIds),
            columns: { id: true },
          })
        : [],
      db.query.reports.findMany({
        where: eq(reports.projectId, projectId),
        columns: { id: true },
      }),
    ]);
    const known: Record<string, true> = {};
    for (const id of designIds) known[`Design:${id}`] = true;
    for (const id of versionIds) known[`DesignVersion:${id}`] = true;
    for (const e of evals) known[`Evaluation:${e.id}`] = true;
    for (const e of estimates) known[`CostEstimate:${e.id}`] = true;
    for (const r of projectReports) known[`Report:${r.id}`] = true;

    const recent = await db.query.auditLogs.findMany({
      orderBy: desc(auditLogs.createdAt),
      limit: 500,
    });
    return recent
      .filter(
        (a) =>
          (a.entityType === "Project" && a.entityId === projectId) ||
          (a.entityType !== null &&
            a.entityId !== null &&
            known[`${a.entityType}:${a.entityId}`] === true),
      )
      .slice(0, limit);
  }

  static async forEntity(entityType: string, entityId: string, limit = 50) {
    return db.query.auditLogs.findMany({
      where: (a, { and, eq: e }) => and(e(a.entityType, entityType), e(a.entityId, entityId)),
      orderBy: desc(auditLogs.createdAt),
      limit,
    });
  }
}
