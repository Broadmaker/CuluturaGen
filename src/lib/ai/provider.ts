import type { BuiltContext } from "./context-builder";
import type { Constraints } from "./constraint-engine";
import type { DesignSpec } from "./spec-schema";

export interface SpecResult {
  spec: DesignSpec;
  usage: { inputTokens: number; outputTokens: number };
}

export interface ImageResult {
  bytes: Buffer;
  ext: "svg" | "png";
  usage: { images: number };
}

// Stage 1 (structured spec) + Stage 2 (visual) — md/02 §21. The orchestrator
// only talks to this interface; mock vs live is an env flag.
export interface DesignProvider {
  readonly name: string;
  generateSpec(
    ctx: BuiltContext,
    c: Constraints,
    prompt: { system: string; user: string },
  ): Promise<SpecResult>;
  generateImage(imagePrompt: string, spec: DesignSpec): Promise<ImageResult>;
}

import { MockProvider } from "./providers/mock";
import { OpenAIProvider } from "./providers/openai";

// Selected once per process from env. Mock is the safe default; the OpenAI
// module has no import-time side effects (it throws only if instantiated
// without a key), so static imports are safe here.
let cached: DesignProvider | null = null;

export function getProvider(): DesignProvider {
  if (cached) return cached;
  const which = (process.env.AI_PROVIDER || "mock").toLowerCase();
  cached = which === "openai" ? new OpenAIProvider() : new MockProvider();
  return cached;
}
