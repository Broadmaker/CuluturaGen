import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  bodyProfiles,
  communities,
  costEstimates,
  culturalElementRelationships,
  designBriefs,
  designCulturalElements,
  designMaterials,
  designs,
  designVersions,
  evaluations,
  evaluationFindings,
  explanations,
} from "@/lib/db/schema";
import type { DesignSpec } from "@/lib/ai/spec-schema";

export type DomainStatus =
  | "PASS"
  | "PASS_WITH_WARNINGS"
  | "REVIEW_REQUIRED"
  | "FAIL"
  | "NOT_EVALUATED"
  | "INSUFFICIENT_EVIDENCE";

type Severity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface DraftFinding {
  category: string;
  severity: Severity;
  title: string;
  finding: string;
  evidence: string;
  recommendation: string;
  relatedCulturalElement?: string;
}

// Transparent keyword-overlap heuristic for requirement coverage. Deliberately
// simple: matched/missing terms are reported as evidence so the designer sees
// exactly what the engine saw. This is evidence, not NLP understanding.
const STOP = new Set(
  "the,and,for,with,from,that,this,into,onto,per,via,use,using,used,should,must,not,no,any,all,each,more,most,than,then,are,was,were,has,have,our,your,their,will,shall,may,can,design,attire,garment,create,made,make,traditional,modern,contemporary,festival,wear,wearing".split(
    ",",
  ),
);

export function terms(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !STOP.has(w)),
    ),
  );
}

// Exported for §121 unit tests — same functions the engine runs.
export function requirementCoverage(requirement: string, specText: string) {
  const t = terms(requirement);
  if (t.length === 0) return { ratio: 1, matched: [] as string[], missing: [] as string[] };
  const s = specText.toLowerCase();
  const matched = t.filter((w) => s.includes(w));
  return { ratio: matched.length / t.length, matched, missing: t.filter((w) => !s.includes(w)) };
}

export function domainFromFindings(severities: Severity[]): DomainStatus {
  if (severities.includes("CRITICAL")) return "FAIL";
  if (severities.includes("HIGH")) return "REVIEW_REQUIRED";
  if (severities.includes("MEDIUM")) return "PASS_WITH_WARNINGS";
  return "PASS";
}

// md/07 — rule → evidence → finding → explanation → human review. The engine
// produces evidence-based findings; it never declares authenticity, beauty, or
// final approval. No single score anywhere (md/07 §69).
export class EvaluationService {
  static async evaluateDesign(opts: { designVersionId: string; userId: string }) {
    const [version] = await db
      .select()
      .from(designVersions)
      .where(eq(designVersions.id, opts.designVersionId));
    if (!version) throw Object.assign(new Error("Design version not found."), { status: 404 });

    const spec = version.designSpecification as unknown as DesignSpec | null;
    const specText = spec ? JSON.stringify(spec) : "";

    const used = await db.query.designCulturalElements.findMany({
      where: eq(designCulturalElements.designVersionId, version.id),
      with: {
        element: {
          with: {
            references: { with: { reference: true } },
            restrictions: true,
          },
        },
      },
    });

    const design = await db.query.designs.findFirst({
      where: eq(designs.id, version.designId),
      columns: { projectId: true },
    });

    const briefs = design
      ? await db.query.designBriefs.findMany({
          where: eq(designBriefs.projectId, design.projectId),
          orderBy: desc(designBriefs.createdAt),
          limit: 1,
          with: { requirements: true },
        })
      : [];
    const brief = briefs[0] ?? null;
    const requirements = (brief?.requirements ?? []).filter((r) => r.isActive !== false);

    const bodies = design
      ? await db.query.bodyProfiles.findMany({
          where: eq(bodyProfiles.projectId, design.projectId),
          orderBy: desc(bodyProfiles.createdAt),
          limit: 1,
        })
      : [];
    const bodyProfile = bodies[0] ?? null;

    const estimates = await db.query.costEstimates.findMany({
      where: eq(costEstimates.designVersionId, version.id),
      orderBy: desc(costEstimates.calculatedAt),
      limit: 1,
      with: { items: true },
    });
    const estimate = estimates[0] ?? null;

    const linkedMaterials = await db.query.designMaterials.findMany({
      where: eq(designMaterials.designVersionId, version.id),
      with: { material: true },
    });

    // Element → culture scope map for association checks.
    const usedIds = used.map((u) => u.culturalElementId);
    const linkRows =
      usedIds.length > 0
        ? await db.query.culturalElementRelationships.findMany({
            where: inArray(culturalElementRelationships.sourceElementId, usedIds),
          })
        : [];
    // Communities from links plus communities named on restriction rows, so
    // scoped restrictions can be compared against the brief's culture below.
    const restrCommIds = Array.from(
      new Set(
        used.flatMap((u) =>
          (u.element.restrictions ?? []).map((r) => r.communityId).filter(Boolean),
        ) as string[],
      ),
    );
    const commIds = Array.from(
      new Set([
        ...linkRows.map((l) => l.communityId).filter(Boolean),
        ...restrCommIds,
      ] as string[]),
    );
    const commRows =
      commIds.length > 0
        ? await db.query.communities.findMany({
            where: inArray(communities.id, commIds),
            columns: { id: true, cultureId: true },
          })
        : [];
    const commCulture = new Map(commRows.map((c) => [c.id, c.cultureId]));
    const elementCultures = new Map<string, Set<string>>();
    for (const l of linkRows) {
      const set = elementCultures.get(l.sourceElementId) ?? new Set<string>();
      if (l.cultureId) set.add(l.cultureId);
      const cc = l.communityId ? commCulture.get(l.communityId) : null;
      if (cc) set.add(cc);
      elementCultures.set(l.sourceElementId, set);
    }

    const findings: DraftFinding[] = [];

    // ---------- CULTURAL ----------
    const culturalSev: Severity[] = [];
    let referencedCount = 0;
    for (const u of used) {
      const el = u.element;
      const refs = u.element.references.map((r) => r.reference.referenceCode);
      if (refs.length > 0) referencedCount++;

      const st = el.validationStatus ?? "UNVERIFIED";
      if (st === "RESTRICTED" && !u.approvedByHuman) {
        culturalSev.push("CRITICAL");
        findings.push({
          category: "CULTURAL",
          severity: "CRITICAL",
          title: "Restricted element used without approval",
          finding: `${el.name} is marked RESTRICTED and has not been human-approved for this design.`,
          evidence: JSON.stringify({ rule: "CULTURAL_RESTRICTION", elementId: el.id, status: st }),
          recommendation: "Remove the element or obtain expert approval, then re-evaluate.",
          relatedCulturalElement: el.id,
        });
        continue;
      }
      if (st === "RESTRICTED") {
        culturalSev.push("LOW");
        findings.push({
          category: "CULTURAL",
          severity: "LOW",
          title: "Restricted element used with approval",
          finding: `${el.name} is RESTRICTED but was human-approved for this design.`,
          evidence: JSON.stringify({ rule: "CULTURAL_RESTRICTION", elementId: el.id, approvedByHuman: true }),
          recommendation: "No action — approval recorded.",
          relatedCulturalElement: el.id,
        });
      }
      if (st === "DEPRECATED") {
        culturalSev.push("HIGH");
        findings.push({
          category: "CULTURAL",
          severity: "HIGH",
          title: "Deprecated knowledge used",
          finding: `${el.name} refers to a deprecated record and should not represent current knowledge.`,
          evidence: JSON.stringify({ rule: "CULTURAL_SOURCE", elementId: el.id, status: st }),
          recommendation: "Replace with the current record or verify with an expert.",
          relatedCulturalElement: el.id,
        });
      }
      if (st === "UNVERIFIED") {
        culturalSev.push("MEDIUM");
        findings.push({
          category: "CULTURAL",
          severity: "MEDIUM",
          title: "Unverified element used",
          finding: `${el.name} has not completed expert review.`,
          evidence: JSON.stringify({ rule: "CULTURAL_SOURCE", elementId: el.id, status: st }),
          recommendation: "Submit the record for review or replace with a VERIFIED element.",
          relatedCulturalElement: el.id,
        });
      }
      if (refs.length === 0) {
        culturalSev.push("MEDIUM");
        findings.push({
          category: "CULTURAL",
          severity: "MEDIUM",
          title: "Element has no supporting source",
          finding: `${el.name} has no attached cultural reference.`,
          evidence: JSON.stringify({ rule: "CULTURAL_SOURCE", elementId: el.id, references: [] }),
          recommendation: "Attach a source on the element page, then re-evaluate.",
          relatedCulturalElement: el.id,
        });
      }
      // Contextual restrictions (md/04 §22-24, md/07 §18-20). These rows
      // were loaded but never read — a recorded restriction must never be
      // silently ignored when its element is used in a design.
      for (const r of u.element.restrictions ?? []) {
        const rType = r.restrictionType ?? "UNKNOWN";
        const rSev = (r.severity ?? "").toUpperCase();
        const rCulture = r.cultureId ?? (r.communityId ? commCulture.get(r.communityId) : null) ?? null;
        const scopeMismatch =
          !!brief?.cultureId && !!rCulture && rCulture !== brief.cultureId;
        const base = {
          category: "CULTURAL",
          title: "",
          finding: "",
          evidence: JSON.stringify({
            rule: "CULTURAL_CONTEXT",
            elementId: el.id,
            restrictionType: rType,
            description: r.description,
            severity: r.severity ?? null,
            occasion: brief?.occasion ?? null,
          }),
          recommendation: "",
          relatedCulturalElement: el.id,
        };
        if (rSev === "CRITICAL" && !u.approvedByHuman) {
          culturalSev.push("CRITICAL");
          findings.push({
            ...base,
            severity: "CRITICAL",
            title: "Critical context restriction applies",
            finding: `${el.name} carries a CRITICAL ${rType} restriction: ${r.description}`,
            recommendation: "Remove the element or obtain expert approval, then re-evaluate.",
          });
        } else if (scopeMismatch) {
          culturalSev.push("HIGH");
          findings.push({
            ...base,
            severity: "HIGH",
            title: "Restriction scoped to another culture",
            finding: `${el.name} carries a ${rType} restriction scoped outside the project's culture: ${r.description}`,
            recommendation: "Verify the cross-context use with an expert or replace the element.",
          });
        } else if ((rType === "SACRED" || rType === "CEREMONIAL_ONLY") && !u.approvedByHuman) {
          culturalSev.push("HIGH");
          findings.push({
            ...base,
            severity: "HIGH",
            title: "Sacred/ceremonial element needs occasion review",
            finding: `${el.name} is marked ${rType} — confirm the occasion "${brief?.occasion ?? "unspecified"}" is appropriate: ${r.description}`,
            recommendation: "Confirm occasion fit with a cultural expert or choose another element.",
          });
        } else {
          culturalSev.push("MEDIUM");
          findings.push({
            ...base,
            severity: "MEDIUM",
            title: "Contextual restriction on record",
            finding: `${el.name} carries a ${rType} restriction: ${r.description}`,
            recommendation: "Review the restriction with the designer/expert before approval.",
          });
        }
      }
      // Association with the brief's culture.
      if (brief?.cultureId) {
        const scopes = elementCultures.get(el.id);
        if (!scopes || scopes.size === 0) {
          culturalSev.push("MEDIUM");
          findings.push({
            category: "CULTURAL",
            severity: "MEDIUM",
            title: "No documented cultural association",
            finding: `${el.name} has no documented link to any culture.`,
            evidence: JSON.stringify({ rule: "CULTURAL_ASSOCIATION", elementId: el.id }),
            recommendation: "Link the element to its culture/community, then re-evaluate.",
            relatedCulturalElement: el.id,
          });
        } else if (!scopes.has(brief.cultureId)) {
          culturalSev.push("HIGH");
          findings.push({
            category: "CULTURAL",
            severity: "HIGH",
            title: "Element outside project culture",
            finding: `${el.name} is not documented for the project's selected culture.`,
            evidence: JSON.stringify({ rule: "CULTURAL_ASSOCIATION", elementId: el.id, linkedCultures: Array.from(scopes) }),
            recommendation: "Verify the cross-cultural use with an expert or replace the element.",
            relatedCulturalElement: el.id,
          });
        }
      }
    }
    // Unsupported AI claims (md/07 §46).
    const unsupported = (spec?.aiExplanation?.elementReasons ?? []).filter(
      (r) => !r.source || r.source === "NO_SOURCE",
    );
    for (const r of unsupported) {
      culturalSev.push("MEDIUM");
      findings.push({
        category: "CULTURAL",
        severity: "MEDIUM",
        title: "Unsupported cultural statement",
        finding: `AI explanation cites no source: "${r.reason.slice(0, 160)}"`,
        evidence: JSON.stringify({ rule: "SOURCE_EVIDENCE", elementId: r.elementId }),
        recommendation: "Verify the statement against a reference or remove it.",
        relatedCulturalElement: r.elementId,
      });
    }
    const cultural: DomainStatus =
      used.length === 0 ? "NOT_EVALUATED" : domainFromFindings(culturalSev);

    // ---------- REQUIREMENTS ----------
    const reqSev: Severity[] = [];
    let mandatorySatisfied = 0;
    let mandatoryTotal = 0;
    let preferredSatisfied = 0;
    let preferredTotal = 0;
    let restrictedViolations = 0;
    for (const r of requirements) {
      const cov = requirementCoverage(r.requirement, specText);
      const ev = JSON.stringify({
        rule: "REQUIREMENT_COVERAGE",
        requirement: r.requirement,
        matched: cov.matched,
        missing: cov.missing,
      });
      if (r.priority === "MANDATORY") {
        mandatoryTotal++;
        if (cov.ratio >= 0.4) {
          mandatorySatisfied++;
        } else {
          reqSev.push("HIGH");
          findings.push({
            category: "REQUIREMENT",
            severity: "HIGH",
            title: "Mandatory requirement not satisfied",
            finding: `Design does not address: "${r.requirement}"`,
            evidence: ev,
            recommendation: "Revise the design to address the requirement, then re-evaluate.",
          });
        }
      } else if (r.priority === "PREFERRED") {
        preferredTotal++;
        if (cov.ratio >= 0.4) {
          preferredSatisfied++;
        } else {
          reqSev.push("MEDIUM");
          findings.push({
            category: "REQUIREMENT",
            severity: "MEDIUM",
            title: "Preferred requirement unmet",
            finding: `Design does not clearly address: "${r.requirement}"`,
            evidence: ev,
            recommendation: "Consider addressing it in a revision; not blocking.",
          });
        }
      } else if (r.priority === "RESTRICTED") {
        if (cov.ratio >= 0.5) {
          restrictedViolations++;
          reqSev.push("HIGH");
          findings.push({
            category: "REQUIREMENT",
            severity: "HIGH",
            title: "Restricted requirement violated",
            finding: `Design appears to contain restricted content: "${r.requirement}"`,
            evidence: ev,
            recommendation: "Remove the restricted content and re-evaluate.",
          });
        }
      }
    }
    const requirementsStatus: DomainStatus =
      requirements.length === 0
        ? "NOT_EVALUATED"
        : spec
          ? domainFromFindings(reqSev)
          : "INSUFFICIENT_EVIDENCE";

    // ---------- BODY ----------
    const bodySev: Severity[] = [];
    let bodyStatus: DomainStatus;
    if (!bodyProfile) {
      bodyStatus = "INSUFFICIENT_EVIDENCE";
      bodySev.push("MEDIUM");
      findings.push({
        category: "BODY",
        severity: "MEDIUM",
        title: "No body profile",
        finding: "The design cannot be checked against wearer measurements.",
        evidence: JSON.stringify({ rule: "BODY_DATA" }),
        recommendation: "Add a body profile on the Body tab, then re-evaluate.",
      });
    } else {
      bodyStatus = "PASS";
      if (bodyProfile.measurementSource !== "MANUAL") {
        bodySev.push("MEDIUM");
        findings.push({
          category: "BODY",
          severity: "MEDIUM",
          title: "Measurements are estimates",
          finding: `Body data source is ${bodyProfile.measurementSource} — verify before construction.`,
          evidence: JSON.stringify({ rule: "BODY_DATA", source: bodyProfile.measurementSource }),
          recommendation: "Confirm measurements manually and mark designer-verified.",
        });
      } else if (!bodyProfile.designerVerified) {
        bodySev.push("MEDIUM");
        findings.push({
          category: "BODY",
          severity: "MEDIUM",
          title: "Measurements unverified",
          finding: "Manual measurements have not been designer-verified.",
          evidence: JSON.stringify({ rule: "BODY_DATA", verified: false }),
          recommendation: "Verify measurements on the Body tab.",
        });
      }
      if (!spec?.silhouette?.type) {
        bodySev.push("LOW");
        findings.push({
          category: "BODY",
          severity: "LOW",
          title: "Silhouette unspecified",
          finding: "Fit considerations need a defined silhouette.",
          evidence: JSON.stringify({ rule: "BODY_CONSIDERATION" }),
          recommendation: "Include silhouette in the next revision.",
        });
      }
      bodyStatus = domainFromFindings(bodySev);
    }

    // ---------- COST ----------
    const costSev: Severity[] = [];
    let costStatus: DomainStatus;
    if (!estimate) {
      costStatus = "NOT_EVALUATED";
      costSev.push("LOW");
      findings.push({
        category: "COST",
        severity: "LOW",
        title: "No cost calculation",
        finding: "No deterministic estimate exists for this version.",
        evidence: JSON.stringify({ rule: "BUDGET" }),
        recommendation: "Run the cost engine on the Cost tab, then re-evaluate.",
      });
    } else {
      const map: Record<string, { s: DomainStatus; sev: Severity; note: string }> = {
        UNDER_BUDGET: { s: "PASS", sev: "INFO", note: "Within budget." },
        AT_BUDGET: { s: "PASS", sev: "INFO", note: "At budget." },
        NEAR_BUDGET: { s: "PASS_WITH_WARNINGS", sev: "LOW", note: "Near budget limit." },
        OVER_BUDGET: { s: "REVIEW_REQUIRED", sev: "HIGH", note: "Exceeds budget." },
        INCOMPLETE: { s: "REVIEW_REQUIRED", sev: "MEDIUM", note: "Incomplete prices." },
        REVIEW_REQUIRED: { s: "REVIEW_REQUIRED", sev: "MEDIUM", note: "Price evidence needs review." },
      };
      const m = map[estimate.budgetStatus ?? ""] ?? {
        s: "NOT_EVALUATED" as DomainStatus,
        sev: "LOW" as Severity,
        note: "Unknown cost state.",
      };
      costStatus = m.s;
      if (m.sev !== "INFO") {
        costSev.push(m.sev);
        findings.push({
          category: "COST",
          severity: m.sev,
          title: `Cost: ${m.note}`,
          finding: `Estimated ${estimate.totalCost} vs budget ${estimate.budget ?? "none"} (${estimate.budgetStatus}).`,
          evidence: JSON.stringify({ rule: "BUDGET", estimateId: estimate.id, total: estimate.totalCost }),
          recommendation:
            estimate.budgetStatus === "OVER_BUDGET"
              ? "Reduce cost or revise the budget, then recalculate."
              : "Review price evidence on the Cost tab.",
        });
      }
    }

    // ---------- MATERIAL ----------
    const matSev: Severity[] = [];
    if (linkedMaterials.length === 0) {
      matSev.push("LOW");
      findings.push({
        category: "MATERIAL",
        severity: "LOW",
        title: "No materials linked",
        finding: "The version has no linked materials to check.",
        evidence: JSON.stringify({ rule: "MATERIAL_AVAILABILITY" }),
        recommendation: "Link materials on the Cost tab for availability checks.",
      });
    }
    for (const l of linkedMaterials) {
      const av = l.material.availabilityStatus ?? "UNKNOWN";
      if (av === "OUT_OF_STOCK") {
        matSev.push("HIGH");
        findings.push({
          category: "MATERIAL",
          severity: "HIGH",
          title: "Material out of stock",
          finding: `${l.material.name} is OUT_OF_STOCK.`,
          evidence: JSON.stringify({ rule: "MATERIAL_AVAILABILITY", materialId: l.materialId }),
          recommendation: "Substitute the material or confirm supply.",
        });
      } else if (av === "LIMITED" || av === "DISCONTINUED") {
        matSev.push("MEDIUM");
        findings.push({
          category: "MATERIAL",
          severity: "MEDIUM",
          title: `Material availability: ${av}`,
          finding: `${l.material.name} is ${av}.`,
          evidence: JSON.stringify({ rule: "MATERIAL_AVAILABILITY", materialId: l.materialId }),
          recommendation: "Verify supply before final approval.",
        });
      } else if (av === "UNKNOWN") {
        matSev.push("LOW");
        findings.push({
          category: "MATERIAL",
          severity: "LOW",
          title: "Material availability unknown",
          finding: `${l.material.name} has unknown availability.`,
          evidence: JSON.stringify({ rule: "MATERIAL_AVAILABILITY", materialId: l.materialId }),
          recommendation: "Confirm availability with the supplier.",
        });
      }
    }
    if (estimate) {
      for (const item of estimate.items.filter((i) => i.source === "MISSING")) {
        matSev.push("MEDIUM");
        findings.push({
          category: "MATERIAL",
          severity: "MEDIUM",
          title: "Material price missing",
          finding: `${item.description} has no price — estimate is incomplete.`,
          evidence: JSON.stringify({ rule: "MATERIAL_PRICE", estimateId: estimate.id }),
          recommendation: "Add a price in the materials library and recalculate.",
        });
      }
    }
    const material: DomainStatus = domainFromFindings(matSev);

    // ---------- EVIDENCE / COMPLETENESS ----------
    const evSev: Severity[] = [];
    if (!spec) {
      evSev.push("HIGH");
      findings.push({
        category: "DESIGN",
        severity: "HIGH",
        title: "No design specification",
        finding: "The version has no structured specification to evaluate.",
        evidence: JSON.stringify({ rule: "DESIGN_COMPLETENESS" }),
        recommendation: "Generate the design before evaluating.",
      });
    } else {
      if (!spec.designName || spec.garmentComponents.length === 0) {
        evSev.push("HIGH");
        findings.push({
          category: "DESIGN",
          severity: "HIGH",
          title: "Incomplete specification",
          finding: "Design name or garment components are missing.",
          evidence: JSON.stringify({ rule: "DESIGN_COMPLETENESS" }),
          recommendation: "Regenerate with complete requirements.",
        });
      }
    }
    const evidence: DomainStatus = domainFromFindings(evSev);

    // ---------- overall (worst domain wins; FAIL > REVIEW > WARNINGS > PASS) ----------
    const rank: Record<DomainStatus, number> = {
      FAIL: 5,
      REVIEW_REQUIRED: 4,
      PASS_WITH_WARNINGS: 3,
      INSUFFICIENT_EVIDENCE: 3,
      NOT_EVALUATED: 1,
      PASS: 0,
    };
    const domains = { cultural, requirements: requirementsStatus, body: bodyStatus, cost: costStatus, material, evidence };
    const keys = Object.keys(domains) as (keyof typeof domains)[];
    let overall = keys[0];
    for (const k of keys) {
      if (rank[domains[k]] > rank[domains[overall]]) overall = k;
    }
    const overallStatus =
      rank[domains[overall]] >= 4
        ? "REVIEW_REQUIRED"
        : rank[domains[overall]] >= 3
          ? "REVIEW_REQUIRED"
          : "PASSED_WITHOUT_CRITICAL_ISSUES";

    // Persist snapshot: evaluation row + findings (immutable; new runs insert).
    const [evaluation] = await db
      .insert(evaluations)
      .values({
        designVersionId: version.id,
        overallStatus,
        culturalStatus: cultural,
        bodyStatus: bodyStatus,
        costStatus: costStatus,
        requirementStatus: requirementsStatus,
        materialStatus: material,
        humanReviewRequired: overallStatus !== "PASSED_WITHOUT_CRITICAL_ISSUES",
        evaluatedBy: opts.userId,
      })
      .returning();

    for (const f of findings) {
      const [row] = await db
        .insert(evaluationFindings)
        .values({
          evaluationId: evaluation.id,
          category: f.category,
          severity: f.severity,
          finding: `${f.title} — ${f.finding}`,
          evidence: f.evidence,
          recommendation: f.recommendation,
          relatedCulturalElement: f.relatedCulturalElement ?? null,
        })
        .returning();
      // Explainability record per finding — what/why/source/constraint (md/01 §31).
      const ev = JSON.parse(f.evidence) as { rule?: string };
      await db.insert(explanations).values({
        designVersionId: version.id,
        explanationType: "EVALUATION",
        subjectType: "EVALUATION_FINDING",
        subjectId: row.id,
        what: f.title,
        why: f.finding,
        source: f.relatedCulturalElement ?? ev.rule ?? "evaluation-engine",
        constraint: f.recommendation,
        evidence: { severity: f.severity, category: f.category },
      });
    }

    const coverage = {
      mandatory: { satisfied: mandatorySatisfied, total: mandatoryTotal },
      preferred: { satisfied: preferredSatisfied, total: preferredTotal },
      restrictedViolations,
      cultural: { referenced: referencedCount, total: used.length },
    };

    return { evaluation, findingsCount: findings.length, coverage };
  }
}
