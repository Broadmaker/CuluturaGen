import { createHash } from "node:crypto";
import type { VisionEstimate, VisionMeasurements, VisionProvider } from "../provider";

// Deterministic offline vision provider for development and tests.
// Derives plausible ESTIMATES from a hash of the image bytes: the same photo
// always yields the same estimates, different photos plausibly differ — the
// full pipeline (upload → analysis → ESTIMATED snapshot → accept/correct /
// reject → evaluation review) is genuinely exercised with $0 spend.
//
// Weight is deliberately omitted: no landmark model can weigh a person from
// a photo, and inventing it would violate md/01 §15. Confidence is a fixed
// process marker, never a claim of accuracy (md/07 §36).

const RANGES: Array<{ key: keyof VisionMeasurements; min: number; max: number }> = [
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

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class MockVisionProvider implements VisionProvider {
  readonly name = "mock";

  async analyze(image: Buffer): Promise<VisionEstimate> {
    const digest = createHash("sha256").update(image).digest();
    const rand = mulberry32(digest.readUInt32BE(0));
    const measurements: VisionMeasurements = {};
    for (const { key, min, max } of RANGES) {
      measurements[key] = Math.round((min + rand() * (max - min)) * 10) / 10;
    }
    return { measurements, confidence: 0.62, landmarks: 17 };
  }
}
