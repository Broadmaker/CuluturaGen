import type { BuiltContext } from "../context-builder";
import type { Constraints } from "../constraint-engine";
import { designSpecSchema, type DesignSpec } from "../spec-schema";
import type { DesignProvider, ImageResult, SpecResult } from "../provider";

// Deterministic offline provider for development and tests. Builds the spec
// from the REAL context (verified basket elements, brief, body) with fixed
// rules, and renders a labeled SVG placeholder — the full pipeline
// (context → jobs → versions → studio) is genuinely exercised with $0 spend.
export class MockProvider implements DesignProvider {
  readonly name = "mock";

  async generateSpec(ctx: BuiltContext, c: Constraints): Promise<SpecResult> {
    const approved = ctx.cultural.approved;
    const textile = approved.find((e) => e.category === "TEXTILE");

    // Use the whole approved basket (guardrails already partitioned out the
    // must-avoid elements into ctx.cultural.restricted).

    // Explicit designer overrides: if the revision instruction names a
    // must-avoid element, include it flagged for human approval. This models
    // a designer consciously overriding a guardrail — evaluation must then
    // fire CRITICAL until approval. Guardrails still exclude the rest.
    const instructionLower = (ctx.instruction ?? "").toLowerCase();
    const overrides = ctx.cultural.restricted.filter((e) =>
      instructionLower.includes(e.name.toLowerCase()),
    );
    const overriddenIds = new Set(overrides.map((e) => e.elementId));
    const used = [...approved, ...overrides];

    const spec: DesignSpec = designSpecSchema.parse({
      designName: `${ctx.project.name} — Concept ${ctx.brief?.occasion ?? "Study"}`,
      silhouette: {
        type: c.silhouette ?? "A-line",
        description: ctx.brief?.modernTraditionalBalance
          ? `Cut for ${ctx.brief.modernTraditionalBalance}.`
          : "Balanced contemporary cut with traditional references.",
      },
      garmentComponents: [
        {
          name: ctx.brief?.garmentType ?? "Upper garment",
          description: `Primary piece${textile ? ` in ${textile.name}` : ""}.`,
        },
        { name: "Lower garment", description: "Coordinated lower piece." },
      ],
      culturalElements: used.map((e) => ({
        elementId: e.elementId,
        usage: overriddenIds.has(e.elementId)
          ? "Explicit designer override of a restricted element — requires human approval."
          : `Basket role ${e.basketRole}${e.basketNotes ? `: ${e.basketNotes}` : ""}`,
      })),
      textiles: textile ? [textile.name] : [],
      colors: [{ name: "Earth tones", hex: "" }],
      materials: used.map((e) => ({ name: e.name, quantity: "" })),
      constructionNotes:
        c.mandatory.length > 0
          ? [`Must satisfy: ${c.mandatory.join("; ")}`]
          : ["Standard construction."],
      accessories: [],
      bodyConsiderations: ctx.body
        ? [
            `Body data source: ${ctx.body.source}; designer-verified: ${ctx.body.verified}. Verify fit before construction.`,
          ]
        : ["No body profile — fit review required before construction."],
      estimatedComplexity: "MODERATE",
      aiExplanation: {
        summary:
          `Mock specification assembled from ${approved.length} approved basket element(s). ` +
          (c.mustAvoidElements.length > 0
            ? `Excluded ${c.mustAvoidElements.length} must-avoid element(s). `
            : "") +
          (ctx.instruction ? `Revision instruction applied: ${ctx.instruction}` : "Initial concept."),
        elementReasons: used.map((e) => ({
          elementId: e.elementId,
          reason: overriddenIds.has(e.elementId)
            ? "Designer explicitly overrode the restriction in the revision instruction."
            : `Selected from project basket (role ${e.basketRole}).`,
          source: e.sources[0] ?? "NO_SOURCE — human review required",
        })),
      },
    });

    return { spec, usage: { inputTokens: 0, outputTokens: 0 } };
  }

  async generateImage(imagePrompt: string, spec: DesignSpec): Promise<ImageResult> {
    void imagePrompt;
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // Escape once, after slicing — escaping the joined string twice produced
    // &amp;lt; entities (caught by tests/unit/ai-generation.test.ts).
    const garments = spec.garmentComponents.map((g) => g.name).join(" + ");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="1024" viewBox="0 0 768 1024">
  <rect width="768" height="1024" fill="#f5f1e8"/>
  <rect x="24" y="24" width="720" height="976" fill="none" stroke="#999" stroke-dasharray="8 6" stroke-width="2"/>
  <text x="384" y="120" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="bold">MOCK CONCEPT</text>
  <text x="384" y="160" text-anchor="middle" font-family="sans-serif" font-size="18">${esc(spec.designName).slice(0, 60)}</text>
  <text x="384" y="200" text-anchor="middle" font-family="sans-serif" font-size="16">Silhouette: ${esc(spec.silhouette.type)}</text>
  <text x="384" y="240" text-anchor="middle" font-family="sans-serif" font-size="16">Garments: ${esc(garments).slice(0, 70)}</text>
  <text x="384" y="280" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#555">Cultural elements: ${spec.culturalElements.length} · Textiles: ${spec.textiles.length}</text>
  <text x="384" y="940" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#555">Placeholder — connect OpenAI for live visuals</text>
</svg>`;
    return { bytes: Buffer.from(svg, "utf-8"), ext: "svg", usage: { images: 1 } };
  }
}
