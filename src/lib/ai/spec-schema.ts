import { z } from "zod";

// Structured design specification — md/01 §24. This is the contract between
// Stage 1 (LLM) and the rest of the system: the image generator, cost engine,
// and evaluation engine all consume THIS, never raw model prose.
export const designSpecSchema = z.object({
  designName: z.string().min(1).max(255),
  silhouette: z.object({
    type: z.string().min(1).max(255),
    description: z.string().max(2000).default(""),
  }),
  garmentComponents: z
    .array(z.object({ name: z.string().min(1), description: z.string().default("") }))
    .min(1)
    .max(12),
  culturalElements: z
    .array(
      z.object({
        elementId: z.string().uuid(),
        usage: z.string().max(1000).default(""),
      }),
    )
    .max(20)
    .default([]),
  textiles: z.array(z.string().max(255)).max(10).default([]),
  colors: z
    .array(z.object({ name: z.string().min(1), hex: z.string().max(20).default("") }))
    .max(10)
    .default([]),
  materials: z
    .array(z.object({ name: z.string().min(1), quantity: z.string().max(100).default("") }))
    .max(20)
    .default([]),
  constructionNotes: z.array(z.string().max(1000)).max(20).default([]),
  accessories: z.array(z.string().max(255)).max(10).default([]),
  bodyConsiderations: z.array(z.string().max(1000)).max(10).default([]),
  estimatedComplexity: z.enum(["SIMPLE", "MODERATE", "ELABORATE"]).default("MODERATE"),
  aiExplanation: z
    .object({
      summary: z.string().max(2000).default(""),
      elementReasons: z
        .array(
          z.object({
            elementId: z.string().uuid(),
            reason: z.string().max(1000),
            source: z.string().max(255).default(""),
          }),
        )
        .max(20)
        .default([]),
    })
    .default({ summary: "", elementReasons: [] }),
});

export type DesignSpec = z.infer<typeof designSpecSchema>;

// JSON Schema twin for OpenAI Structured Outputs (Responses API,
// text.format json_schema strict). Kept beside the zod schema so the two
// cannot drift without this file changing.
export const DESIGN_SPEC_JSON_SCHEMA = {
  name: "design_specification",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["designName", "silhouette", "garmentComponents"],
    properties: {
      designName: { type: "string" },
      silhouette: {
        type: "object",
        additionalProperties: false,
        required: ["type", "description"],
        properties: { type: { type: "string" }, description: { type: "string" } },
      },
      garmentComponents: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "description"],
          properties: { name: { type: "string" }, description: { type: "string" } },
        },
      },
      culturalElements: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["elementId", "usage"],
          properties: { elementId: { type: "string" }, usage: { type: "string" } },
        },
      },
      textiles: { type: "array", items: { type: "string" } },
      colors: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "hex"],
          properties: { name: { type: "string" }, hex: { type: "string" } },
        },
      },
      materials: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "quantity"],
          properties: { name: { type: "string" }, quantity: { type: "string" } },
        },
      },
      constructionNotes: { type: "array", items: { type: "string" } },
      accessories: { type: "array", items: { type: "string" } },
      bodyConsiderations: { type: "array", items: { type: "string" } },
      estimatedComplexity: { type: "string", enum: ["SIMPLE", "MODERATE", "ELABORATE"] },
      aiExplanation: {
        type: "object",
        additionalProperties: false,
        required: ["summary", "elementReasons"],
        properties: {
          summary: { type: "string" },
          elementReasons: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["elementId", "reason", "source"],
              properties: {
                elementId: { type: "string" },
                reason: { type: "string" },
                source: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
} as const;
