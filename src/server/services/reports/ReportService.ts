import { promises as fs } from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import SVGtoPDF from "svg-to-pdfkit";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  auditLogs,
  bodyProfiles,
  clients,
  costEstimates,
  designBriefs,
  designCulturalElements,
  designMaterials,
  designVersions,
  designs,
  evaluationFindings,
  evaluations,
  fileAssets,
  humanReviews,
  projectCulturalElements,
  projects,
  designFeedback,
  reports,
  users,
} from "@/lib/db/schema";
import { saveReportFile } from "@/lib/storage";
import { REPORT_TYPES, type ReportType } from "@/lib/reports/constants";
import type { DesignSpec } from "@/lib/ai/spec-schema";

export { REPORT_TYPES };
export type { ReportType };

// Sections per type (md/01 §35). FINAL_REPORT is the full dossier.
const SECTIONS: Record<ReportType, string[]> = {
  CULTURAL_REPORT: ["project", "cultural"],
  DESIGN_REPORT: ["project", "brief", "cultural", "designs"],
  COST_REPORT: ["project", "cost"],
  EVALUATION_REPORT: ["project", "designs", "evaluation"],
  FINAL_REPORT: ["project", "brief", "body", "cultural", "designs", "cost", "evaluation", "reviews", "history"],
};

function storagePathFor(url: string | null): string | null {
  if (!url || !url.startsWith("/api/files/")) return null;
  return url.slice("/api/files/".length);
}

async function readLocalImage(url: string | null): Promise<{ bytes: Buffer; ext: string } | null> {
  const rel = storagePathFor(url);
  if (!rel || rel.includes("..")) return null;
  try {
    const root = process.env.STORAGE_DIR || path.join(process.cwd(), "storage");
    const full = path.normalize(path.join(root, rel));
    if (!full.startsWith(root)) return null;
    const bytes = await fs.readFile(full);
    return { bytes, ext: path.extname(rel).toLowerCase() };
  } catch {
    return null;
  }
}

class Pdf {
  doc: InstanceType<typeof PDFDocument>;
  constructor(title: string) {
    this.doc = new PDFDocument({ size: "A4", margins: { top: 56, bottom: 56, left: 56, right: 56 }, info: { Title: title } });
  }
  h1(t: string) {
    this.doc.moveDown(0.6).font("Helvetica-Bold").fontSize(16).text(t).moveDown(0.2);
  }
  h2(t: string) {
    this.doc.moveDown(0.4).font("Helvetica-Bold").fontSize(12).text(t).moveDown(0.1);
  }
  p(t: string) {
    this.doc.font("Helvetica").fontSize(10).text(t || "—", { align: "left" });
  }
  bullets(items: string[]) {
    if (items.length === 0) {
      this.p("—");
      return;
    }
    this.doc.font("Helvetica").fontSize(10);
    for (const it of items) this.doc.text(`• ${it}`);
  }
  kv(label: string, value: string) {
    this.doc.font("Helvetica").fontSize(10).text(`${label}: ${value || "—"}`);
  }
  async imageFromUrl(url: string | null, caption: string) {
    const file = await readLocalImage(url);
    if (!file) {
      this.p(`[Image unavailable: ${caption}]`);
      return;
    }
    try {
      const maxW = 440;
      if (file.ext === ".svg") {
        SVGtoPDF(this.doc, file.bytes.toString("utf-8"), 56, this.doc.y, { width: maxW });
        this.doc.moveDown(1);
        // Advance past the rendered graphic (aspect from viewBox 768x1024).
        this.doc.y += (maxW * 1024) / 768 + 12;
      } else {
        this.doc.image(file.bytes, { fit: [maxW, 560] });
        this.doc.moveDown(0.5);
      }
      this.doc.font("Helvetica-Oblique").fontSize(9).text(caption);
    } catch {
      this.p(`[Image could not be embedded: ${caption}]`);
    }
  }
}

// md/01 §35 + md/03 reports table. Assembles the dossier from preserved
// snapshots (never re-resolved values) and renders a PDF file.
export class ReportService {
  static async generate(opts: {
    projectId: string;
    userId: string;
    reportType: ReportType;
    designId?: string;
  }) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, opts.projectId),
      with: {
        briefs: { orderBy: desc(designBriefs.createdAt), limit: 1, with: { requirements: true } },
        designs: { orderBy: desc(designs.updatedAt) },
      },
    });
    if (!project) throw Object.assign(new Error("Project not found."), { status: 404 });

    const [creator] = await db.select().from(users).where(eq(users.id, project.createdBy));
    const clientList = await db.query.clients.findMany({
      where: eq(clients.projectId, opts.projectId),
    });
    const bodyList = await db.query.bodyProfiles.findMany({
      where: eq(bodyProfiles.projectId, opts.projectId),
      orderBy: desc(bodyProfiles.createdAt),
      limit: 1,
    });
    const basket = await db.query.projectCulturalElements.findMany({
      where: eq(projectCulturalElements.projectId, opts.projectId),
      with: { element: { with: { references: { with: { reference: true } } } } },
    });

    const targetDesigns = opts.designId
      ? project.designs.filter((d) => d.id === opts.designId)
      : project.designs;
    if (opts.designId && targetDesigns.length === 0) {
      throw Object.assign(new Error("Design not found in this project."), { status: 404 });
    }

    interface DesignBundle {
      design: (typeof targetDesigns)[number];
      versions: { id: string; versionNumber: number; status: string | null; spec: DesignSpec | null; imageUrl: string | null; createdAt: Date | null }[];
      materials: { name: string; quantity: string | null; unit: string | null }[];
      estimates: { versionNumber: number | null; total: string | null; status: string | null }[];
      evaluations: { versionNumber: number | null; overall: string | null; domains: string; open: number }[];
      reviews: { decision: string | null; comments: string | null; final: boolean | null; createdAt: Date | null }[];
      notes: { type: string | null; comment: string | null }[];
    }
    const bundles: DesignBundle[] = [];
    for (const d of targetDesigns) {
      const versions = await db.query.designVersions.findMany({
        where: eq(designVersions.designId, d.id),
        orderBy: desc(designVersions.versionNumber),
      });
      const versionIds = versions.map((v) => v.id);
      const [mats, estimates, evals, reviews, notes] = await Promise.all([
        versionIds.length > 0
          ? db.query.designMaterials.findMany({
              where: (m, { inArray }) => inArray(m.designVersionId, versionIds),
              with: { material: { columns: { name: true } } },
            })
          : [],
        versionIds.length > 0
          ? db.query.costEstimates.findMany({
              where: (c, { inArray }) => inArray(c.designVersionId, versionIds),
              orderBy: desc(costEstimates.calculatedAt),
            })
          : [],
        versionIds.length > 0
          ? db.query.evaluations.findMany({
              where: (e, { inArray }) => inArray(e.designVersionId, versionIds),
              orderBy: desc(evaluations.createdAt),
            })
          : [],
        versionIds.length > 0
          ? db.query.humanReviews.findMany({
              where: (r, { inArray }) => inArray(r.designVersionId, versionIds),
              orderBy: desc(humanReviews.createdAt),
            })
          : [],
        versionIds.length > 0
          ? db.query.designFeedback.findMany({
              where: (f, { inArray }) => inArray(f.designVersionId, versionIds),
              orderBy: desc(designFeedback.createdAt),
            })
          : [],
      ]);
      const vnum = new Map(versions.map((v) => [v.id, v.versionNumber]));
      const findingsCount = new Map<string, number>();
      for (const e of evals) {
        const fs = await db.query.evaluationFindings.findMany({
          where: eq(evaluationFindings.evaluationId, e.id),
          columns: { id: true, resolved: true },
        });
        findingsCount.set(e.id, fs.filter((f) => !f.resolved).length);
      }
      bundles.push({
        design: d,
        versions: versions.map((v) => ({
          id: v.id,
          versionNumber: v.versionNumber,
          status: v.status,
          spec: v.designSpecification as unknown as DesignSpec | null,
          imageUrl: v.generatedImageUrl,
          createdAt: v.createdAt,
        })),
        materials: mats.map((m) => ({ name: m.material.name, quantity: m.quantity, unit: m.unit })),
        estimates: estimates.map((e) => ({
          versionNumber: vnum.get(e.designVersionId) ?? null,
          total: e.totalCost,
          status: e.budgetStatus,
        })),
        evaluations: evals.map((e) => ({
          versionNumber: vnum.get(e.designVersionId) ?? null,
          overall: e.overallStatus,
          domains: `C:${e.culturalStatus} R:${e.requirementStatus} B:${e.bodyStatus} $:${e.costStatus} M:${e.materialStatus}`,
          open: findingsCount.get(e.id) ?? 0,
        })),
        reviews: reviews.map((r) => ({
          decision: r.decision,
          comments: r.comments,
          final: r.finalApproval,
          createdAt: r.createdAt,
        })),
        notes: notes.map((n) => ({ type: n.feedbackType, comment: n.comment })),
      });
    }

    const audits = await db.query.auditLogs.findMany({
      orderBy: desc(auditLogs.createdAt),
      limit: 200,
    });
    const history = audits.filter(
      (a) =>
        (a.entityType === "Project" && a.entityId === opts.projectId) ||
        (a.entityType === "Design" && targetDesigns.some((d) => d.id === a.entityId)),
    );

    const sections = SECTIONS[opts.reportType];
    const title = `${opts.reportType.replace(/_/g, " ")} — ${project.name}`;
    const pdf = new Pdf(title);
    const stamp = new Date().toLocaleString();

    pdf.h1(title);
    pdf.p(`Generated ${stamp} · AttireLab thesis prototype (mock AI unless noted)`);

    if (sections.includes("project")) {
      pdf.h1("1 · Project information");
      pdf.kv("Project", `${project.name} (${project.projectCode})`);
      pdf.kv("Status", project.status ?? "—");
      pdf.kv("Designer", creator?.displayName || creator?.email || "—");
      if (project.description) pdf.p(project.description);
    }

    const brief = project.briefs[0] ?? null;
    if (sections.includes("brief")) {
      pdf.h1("2 · Design requirements");
      if (!brief) {
        pdf.p("No design brief recorded.");
      } else {
        const parts = [
          brief.occasion && `Occasion: ${brief.occasion}`,
          brief.garmentType && `Garment: ${brief.garmentType}`,
          brief.silhouette && `Silhouette: ${brief.silhouette}`,
          brief.style && `Style: ${brief.style}`,
          brief.budget && `Budget: ${brief.budget} ${brief.currency ?? ""}`,
        ].filter(Boolean) as string[];
        pdf.bullets(parts);
        pdf.h2("Requirements");
        pdf.bullets(
          (brief.requirements ?? [])
            .filter((r) => r.isActive !== false)
            .map((r) => `[${r.priority}] (${r.category}) ${r.requirement}`),
        );
      }
      const client = clientList[0];
      if (client) {
        pdf.h2("Client");
        pdf.kv("Name / alias", client.name ?? "—");
        pdf.kv("Consent", client.consentStatus ?? "—");
      }
    }

    if (sections.includes("body")) {
      pdf.h1("3 · Body profile");
      const b = bodyList[0];
      if (!b) {
        pdf.p("No body profile recorded.");
      } else {
        pdf.kv("Source", `${b.measurementSource ?? "—"} · verified: ${b.designerVerified ? "yes" : "no"}`);
        const m: [string, string | null][] = [
          ["Height (cm)", b.heightCm],
          ["Chest (cm)", b.chestCm],
          ["Waist (cm)", b.waistCm],
          ["Hip (cm)", b.hipCm],
          ["Shoulder (cm)", b.shoulderWidthCm],
          ["Arm (cm)", b.armLengthCm],
        ];
        pdf.bullets(m.map(([k, v]) => `${k}: ${v ?? "—"}`));
      }
    }

    if (sections.includes("cultural")) {
      pdf.h1("4 · Cultural research");
      if (basket.length === 0) {
        pdf.p("No cultural elements collected.");
      } else {
        for (const item of basket) {
          const el = item.element;
          pdf.h2(`${el.name} [${el.category}] — ${el.validationStatus}`);
          if (el.description) pdf.p(el.description);
          const refs = item.element.references.map((r) => r.reference.referenceCode);
          pdf.p(`Sources: ${refs.length > 0 ? refs.join(", ") : "NONE — human review required"}`);
          pdf.p(`Basket role: ${item.role}${item.notes ? ` · ${item.notes}` : ""}`);
        }
      }
    }

    if (sections.includes("designs")) {
      pdf.h1("5 · Design concepts");
      if (bundles.length === 0) {
        pdf.p("No designs generated.");
      }
      for (const bundle of bundles) {
        pdf.h2(`${bundle.design.name ?? bundle.design.designCode} [${bundle.design.status}]`);
        for (const v of bundle.versions) {
          pdf.p(`Version ${v.versionNumber} — ${v.status} (${v.createdAt?.toLocaleString() ?? "—"})`);
          if (v.spec) {
            pdf.p(`Silhouette: ${v.spec.silhouette.type}`);
            pdf.bullets(v.spec.garmentComponents.map((g) => `${g.name}${g.description ? ` — ${g.description}` : ""}`));
            if (v.spec.aiExplanation?.summary) pdf.p(`Why: ${v.spec.aiExplanation.summary}`);
          }
          await pdf.imageFromUrl(v.imageUrl, `Concept V${v.versionNumber}`);
        }
        if (bundle.materials.length > 0) {
          pdf.h2("Materials");
          pdf.bullets(bundle.materials.map((m) => `${m.name} — ${m.quantity ?? "?"} ${m.unit ?? ""}`));
        }
      }
    }

    if (sections.includes("cost")) {
      pdf.h1("6 · Cost estimates");
      const rows = bundles.flatMap((b) =>
        b.estimates.map((e) => `V${e.versionNumber ?? "?"}: ${e.total ?? "—"} (${e.status})`),
      );
      pdf.bullets(rows.length > 0 ? rows : ["No cost calculations recorded."]);
    }

    if (sections.includes("evaluation")) {
      pdf.h1("7 · Evaluation");
      const rows = bundles.flatMap((b) =>
        b.evaluations.map(
          (e) => `V${e.versionNumber ?? "?"}: ${e.overall} — ${e.domains} — ${e.open} open finding(s)`,
        ),
      );
      pdf.bullets(rows.length > 0 ? rows : ["No evaluations recorded."]);
    }

    if (sections.includes("reviews")) {
      pdf.h1("8 · Human review & approval");
      const rows = bundles.flatMap((b) =>
        b.reviews.map(
          (r) => `${r.decision}${r.final ? " (FINAL)" : ""} — ${r.comments ?? "no comment"}`,
        ),
      );
      const notes = bundles.flatMap((b) =>
        b.notes.map((n) => `[${n.type}] ${n.comment}`),
      );
      pdf.bullets(rows.length > 0 ? rows : ["No human reviews recorded."]);
      if (notes.length > 0) {
        pdf.h2("Designer notes");
        pdf.bullets(notes);
      }
    }

    if (sections.includes("history")) {
      pdf.h1("9 · Revision history (audit)");
      pdf.bullets(
        history.slice(0, 60).map(
          (a) => `${a.createdAt?.toLocaleString() ?? ""} — ${a.action} ${a.entityType ?? ""}`,
        ),
      );
    }

    pdf.p("");
    pdf.p("End of report. AI-generated content is labeled in-app; verify before production use.");

    const bytes: Buffer = await new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdf.doc.on("data", (c: Buffer) => chunks.push(c));
      pdf.doc.on("end", () => resolve(Buffer.concat(chunks)));
      pdf.doc.on("error", reject);
      pdf.doc.end();
    });

    const stamp2 = new Date().toISOString().slice(0, 10);
    const fileName = `${opts.reportType.toLowerCase()}-${stamp2}-${Math.random().toString(36).slice(2, 6)}.pdf`;
    const saved = await saveReportFile(opts.projectId, fileName, bytes);

    const firstDesign = bundles[0]?.design;
    const [report] = await db
      .insert(reports)
      .values({
        projectId: opts.projectId,
        designVersionId: null,
        reportType: opts.reportType,
        fileUrl: saved.url,
        generatedBy: opts.userId,
      })
      .returning();
    await db.insert(fileAssets).values({
      projectId: opts.projectId,
      designVersionId: firstDesign
        ? bundles[0].versions.find((v) => v.versionNumber === firstDesign.currentVersion)?.id ?? null
        : null,
      fileType: "REPORT",
      fileName,
      storageUrl: saved.url,
      mimeType: "application/pdf",
      fileSize: bytes.length,
      uploadedBy: opts.userId,
    });
    await db.insert(auditLogs).values({
      userId: opts.userId,
      action: "REPORT_GENERATED",
      entityType: "Report",
      entityId: report.id,
      newValue: { type: opts.reportType },
    });

    return { report, url: saved.url, bytes: bytes.length };
  }
}
