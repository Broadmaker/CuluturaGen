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

// Selected once per process from env. Mock is the safe default ($0, offline,
// deterministic). A live provider plugs in here behind VISION_PROVIDER=live
// with VISION_API_KEY — no call-site changes.
let cached: VisionProvider | null = null;

export function getVisionProvider(): VisionProvider {
  if (cached) return cached;
  const which = (process.env.VISION_PROVIDER || "mock").toLowerCase();
  cached = which === "live" ? liveProvider() : new MockVisionProvider();
  return cached;
}

function liveProvider(): VisionProvider {
  // No live implementation yet — fail loudly instead of silently mocking.
  throw new Error(
    "VISION_PROVIDER=live is configured but no live vision provider is implemented. Set VISION_PROVIDER=mock.",
  );
}

// Test-only escape hatch.
export function resetVisionProvider(): void {
  cached = null;
}
