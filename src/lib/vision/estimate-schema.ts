import { z } from "zod";
import type { VisionEstimate, VisionMeasurements } from "./provider";

// Plausible human ranges in cm — mirrors the mock provider so live output is
// held to the same thesis-safe bar (md/01 §15: estimates, never claims).
// Weight is deliberately absent: no photo model can weigh a person.
export const VISION_RANGES: Array<{
  key: keyof VisionMeasurements;
  min: number;
  max: number;
}> = [
  { key: "heightCm", min: 150, max: 188 },
  { key: "shoulderWidthCm", min: 36, max: 48 },
  { key: "chestCm", min: 80, max: 110 },
  { key: "waistCm", min: 68, max: 100 },
  { key: "hipCm", min: 84, max: 112 },
  { key: "neckCm", min: 32, max: 42 },
  { key: "armLengthCm", min: 52, max: 64 },
  { key: "torsoLengthCm", min: 55, max: 70 },
  { key: "inseamCm", min: 70, max: 85 },
  { key: "legLengthCm", min: 85, max: 105 },
];

const KNOWN_KEYS = new Set(VISION_RANGES.map((r) => r.key));

// Raw model output — tolerant on entry (nulls allowed per-field), strict on
// exit via sanitizeVisionMeasurements(). Weight is not a known key on purpose:
// even if a model volunteers it, it is dropped, never stored.
const visionOutputSchema = z.object({
  measurements: z.record(z.string(), z.number().nullable().optional()),
  confidence: z.number(),
  // Floats tolerated here — parseVisionOutput floors to an integer.
  landmarks: z.number(),
});

export type RawVisionOutput = z.infer<typeof visionOutputSchema>;

// JSON Schema twin for OpenAI Structured Outputs (Responses API,
// text.format json_schema strict). Kept beside the zod schema so the two
// cannot drift without this file changing.
export const VISION_ESTIMATE_JSON_SCHEMA = {
  name: "vision_estimate",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["measurements", "confidence", "landmarks"],
    properties: {
      measurements: {
        type: "object",
        additionalProperties: false,
        required: [
          "heightCm",
          "shoulderWidthCm",
          "chestCm",
          "waistCm",
          "hipCm",
          "neckCm",
          "armLengthCm",
          "torsoLengthCm",
          "inseamCm",
          "legLengthCm",
        ],
        properties: {
          heightCm: { type: ["number", "null"] },
          shoulderWidthCm: { type: ["number", "null"] },
          chestCm: { type: ["number", "null"] },
          waistCm: { type: ["number", "null"] },
          hipCm: { type: ["number", "null"] },
          neckCm: { type: ["number", "null"] },
          armLengthCm: { type: ["number", "null"] },
          torsoLengthCm: { type: ["number", "null"] },
          inseamCm: { type: ["number", "null"] },
          legLengthCm: { type: ["number", "null"] },
        },
      },
      confidence: { type: "number" },
      landmarks: { type: "integer" },
    },
  },
};

// Keep only known keys with finite in-range numbers (rounded to 1 decimal).
// Out-of-range / non-numeric / unknown entries (incl. weightKg) are dropped
// and named so callers can log them instead of silently storing junk.
export function sanitizeVisionMeasurements(raw: unknown): {
  measurements: VisionMeasurements;
  dropped: string[];
} {
  const measurements: VisionMeasurements = {};
  const dropped: string[] = [];
  if (!raw || typeof raw !== "object") return { measurements, dropped: ["measurements"] };
  const ranges = new Map(VISION_RANGES.map((r) => [r.key, r] as const));
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!KNOWN_KEYS.has(key as keyof VisionMeasurements)) {
      dropped.push(key);
      continue;
    }
    const range = ranges.get(key as keyof VisionMeasurements)!;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      if (value !== null && value !== undefined) dropped.push(key);
      continue;
    }
    if (value < range.min || value > range.max) {
      dropped.push(key);
      continue;
    }
    measurements[key as keyof VisionMeasurements] = Math.round(value * 10) / 10;
  }
  return { measurements, dropped };
}

// Validate + sanitize a parsed model JSON payload. Throws on wrong shape;
// clamps confidence to 0..1 and floors landmarks at 0 (traceability markers,
// never accuracy claims per md/07 §36).
export function parseVisionOutput(json: unknown): VisionEstimate & { dropped: string[] } {
  const parsed = visionOutputSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Live vision returned an invalid estimate: ${parsed.error.message}`);
  }
  const { measurements, dropped } = sanitizeVisionMeasurements(parsed.data.measurements);
  const confidence = Number.isFinite(parsed.data.confidence)
    ? Math.min(1, Math.max(0, parsed.data.confidence))
    : 0;
  const landmarks = Number.isFinite(parsed.data.landmarks)
    ? Math.max(0, Math.floor(parsed.data.landmarks))
    : 0;
  return { measurements, confidence, dropped, landmarks };
}
