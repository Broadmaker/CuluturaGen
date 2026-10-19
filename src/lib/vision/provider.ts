import type { BodyFieldKey } from "@/lib/brief/constants";

// Vision provider abstraction for body measurement estimation
// (md/02 §28, md/05 §50, md/10 §48). The application only talks to this
// interface; mock vs live is an env flag — the same mock-first pattern as
// the design-generation provider (md/10 §68–72: real core + controlled mocks).

export type VisionMeasurements = Partial<Record<BodyFieldKey, number>>;

export interface VisionEstimate {
  measurements: VisionMeasurements;
  // Fixed self-reported confidence of the estimation process — recorded for
  // traceability, never presented as measurement accuracy (md/07 §36).
  confidence: number;
  // Number of body landmarks the provider claims to have detected.
  landmarks: number;
}

export interface VisionProvider {
  readonly name: string;
  analyze(image: Buffer): Promise<VisionEstimate>;
}

import { MockVisionProvider } from "./providers/mock";
import { OpenAIVisionProvider } from "./providers/openai";
import { GoogleVisionProvider } from "./providers/google";

// Selected once per process from env. Mock is the safe default ($0, offline,
// deterministic). VISION_PROVIDER=openai selects the live OpenAI vision
// provider ("live" is accepted as an alias for the same); no call-site
// changes — both implement this interface.
let cached: VisionProvider | null = null;

export function getVisionProvider(): VisionProvider {
  if (cached) return cached;
  const which = (process.env.VISION_PROVIDER || "mock").toLowerCase();
  if (which === "openai" || which === "live") {
    cached = new OpenAIVisionProvider();
  } else if (which === "google" || which === "gemini") {
    cached = new GoogleVisionProvider();
  } else {
    cached = new MockVisionProvider();
  }
  return cached;
}

// Test-only escape hatch.
export function resetVisionProvider(): void {
  cached = null;
}
