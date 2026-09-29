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
    const motifs = approved.filter((e) => e.category === "MOTIF").slice(0, 3);
    const used = [textile, ...motifs].filter(
      (e): e is NonNullable<typeof e> => !!e,
    );

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
        usage: `Basket role ${e.basketRole}${e.basketNotes ? `: ${e.basketNotes}` : ""}`,
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
          reason: `Selected from project basket (role ${e.basketRole}).`,
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
    const garments = spec.garmentComponents.map((g) => esc(g.name)).join(" + ");
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
