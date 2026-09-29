import type { BuiltContext } from "./context-builder";
import type { DesignSpec } from "./spec-schema";

export interface Constraints {
  mandatory: string[];
  preferred: string[];
  restricted: string[];
  mustAvoidElements: { elementId: string; name: string; reason: string }[];
  budget: { amount: number; currency: string } | null;
  style: string | null;
  silhouette: string | null;
}

// md/02 §11 — requirements become machine-readable constraints.
export function buildConstraints(ctx: BuiltContext): Constraints {
  const mandatory = ctx.requirements
    .filter((r) => r.priority === "MANDATORY")
    .map((r) => `[${r.category}] ${r.requirement}`);
  const preferred = ctx.requirements
    .filter((r) => r.priority === "PREFERRED")
    .map((r) => `[${r.category}] ${r.requirement}`);
  const restricted = ctx.requirements
    .filter((r) => r.priority === "RESTRICTED")
    .map((r) => `[${r.category}] ${r.requirement}`);

  const mustAvoidElements = ctx.cultural.restricted.map((e) => ({
    elementId: e.elementId,
    name: e.name,
    reason:
      e.restrictions.map((r) => `${r.type}: ${r.description}`).join("; ") ||
      "Record marked RESTRICTED",
  }));

  return {
    mandatory,
    preferred,
    restricted,
    mustAvoidElements,
    budget: ctx.brief?.budget
      ? { amount: Number(ctx.brief.budget), currency: ctx.brief.currency ?? "PHP" }
      : null,
    style: ctx.brief?.style ?? null,
    silhouette: ctx.brief?.silhouette ?? null,
  };
}

// md/04 §63 — injected into every generation prompt. This is the cultural
// guardrail: verified context only, no invented facts, restricted excluded,
// uncertainty flagged for human review.
export const CULTURAL_GUARDRAIL_INSTRUCTIONS = `Cultural ground rules (non-negotiable):
- Use ONLY the verified cultural elements provided in the context. Never invent cultural facts, meanings, or associations.
- NEVER use the elements listed under must-avoid, even if requested. If the designer's instruction conflicts with a restriction, follow the restriction and note the conflict in aiExplanation.summary.
- Do not present AI-inferred symbolism as documented fact. Every culturalElements entry must reference a provided elementId, and every elementReasons entry must cite a provided source code.
- If the context lacks the information needed for a good design, say so in aiExplanation.summary and flag human review instead of filling gaps with invention.`;

export function buildSpecPrompt(ctx: BuiltContext, c: Constraints): { system: string; user: string } {
  const system = `You are the design-specification stage of a cultural attire design assistant. Output ONLY a JSON object matching the design_specification schema. No prose, no markdown fences.\n\n${CULTURAL_GUARDRAIL_INSTRUCTIONS}`;

  const lines: string[] = [
    `Project: ${ctx.project.name}`,
    ctx.brief?.occasion ? `Occasion: ${ctx.brief.occasion}` : null,
    ctx.brief?.garmentType ? `Garment type: ${ctx.brief.garmentType}` : null,
    c.silhouette ? `Silhouette: ${c.silhouette}` : null,
    c.style ? `Style direction: ${c.style}` : null,
    ctx.brief?.modernTraditionalBalance ? `Traditional/contemporary balance: ${ctx.brief.modernTraditionalBalance}` : null,
    c.budget ? `Budget: ${c.budget.amount} ${c.budget.currency}` : null,
    ctx.body
      ? `Wearer: source=${ctx.body.source}, verified=${ctx.body.verified}, measurements=${JSON.stringify(ctx.body.measurements)}`
      : `Wearer: no body profile available — note fit uncertainty in bodyConsiderations.`,
    "",
    "MANDATORY requirements:",
    ...c.mandatory.map((m) => `- ${m}`),
    "",
    "PREFERRED requirements:",
    ...c.preferred.map((m) => `- ${m}`),
    "",
    "RESTRICTED (must not appear in the design):",
    ...c.restricted.map((m) => `- ${m}`),
    "",
    "APPROVED cultural elements (use these; cite sources):",
    ...ctx.cultural.approved.map(
      (e) =>
        `- ${e.elementCode} | ${e.name} [${e.category}] status=${e.validationStatus} role=${e.basketRole} sources=${e.sources.join(",") || "NONE — flag review"}${e.basketNotes ? ` note=${e.basketNotes}` : ""}`,
    ),
    "",
    "MUST-AVOID elements:",
    ...c.mustAvoidElements.map((e) => `- ${e.name}: ${e.reason}`),
  ].filter((l): l is string => l !== null);

  if (ctx.instruction) lines.push("", `Designer revision instruction: ${ctx.instruction}`);
  if (ctx.previousSpec) {
    lines.push("", `Previous specification to revise (keep what still satisfies constraints): ${JSON.stringify(ctx.previousSpec).slice(0, 4000)}`);
  }

  return { system, user: lines.join("\n") };
}

// Stage 2 prompt is constructed FROM the validated spec — never from free
// user text (md/02 §21). Deterministic template keeps generations comparable.
export function buildImagePrompt(spec: DesignSpec, ctx: BuiltContext): string {
  const garments = spec.garmentComponents.map((g) => `${g.name} (${g.description})`).join("; ");
  const colors = spec.colors.map((c) => c.name).join(", ");
  return [
    "Single full-length fashion illustration on a neutral studio background, no person face focus, no text, no watermark.",
    `Attire: ${garments}.`,
    `Silhouette: ${spec.silhouette.type} — ${spec.silhouette.description}.`,
    spec.textiles.length > 0 ? `Textiles: ${spec.textiles.join(", ")}.` : null,
    colors ? `Palette: ${colors}.` : null,
    spec.accessories.length > 0 ? `Accessories: ${spec.accessories.join(", ")}.` : null,
    ctx.brief?.occasion ? `Occasion context: ${ctx.brief.occasion}.` : null,
    ctx.brief?.style ? `Style: ${ctx.brief.style}.` : null,
    "Respectful, wearable garment construction; culturally grounded, not costume caricature.",
  ]
    .filter(Boolean)
    .join(" ");
}
