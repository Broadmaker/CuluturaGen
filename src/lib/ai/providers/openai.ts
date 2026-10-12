import type { BuiltContext } from "../context-builder";
import type { Constraints } from "../constraint-engine";
import { DESIGN_SPEC_JSON_SCHEMA, designSpecSchema } from "../spec-schema";
import type { DesignProvider, ImageResult, SpecResult } from "../provider";

// Live OpenAI provider — DORMANT until AI_PROVIDER=openai with keys set.
// Stage 1: Responses API + Strict Structured Outputs → validated spec JSON.
// Stage 2: gpt-image-1 → PNG bytes. Plain fetch, no SDK, no framework.
export class OpenAIProvider implements DesignProvider {
  readonly name = "openai";
  private readonly apiKey: string;
  private readonly model: string;
  private readonly imageModel: string;

  get models(): { spec: string; image: string } {
    return { spec: this.model, image: this.imageModel };
  }

  constructor() {
    const key = process.env.AI_API_KEY || process.env.IMAGE_API_KEY;
    if (!key) throw new Error("AI_API_KEY is not set (AI_PROVIDER=openai).");
    this.apiKey = key;
    this.model = process.env.AI_MODEL || "gpt-4o-mini";
    this.imageModel = process.env.IMAGE_MODEL || "gpt-image-1";
  }

  async generateSpec(
    _ctx: BuiltContext,
    _c: Constraints,
    prompt: { system: string; user: string },
  ): Promise<SpecResult> {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        text: { format: DESIGN_SPEC_JSON_SCHEMA },
        max_output_tokens: 4000,
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`OpenAI spec generation failed (${res.status}): ${err.slice(0, 500)}`);
    }
    const data = await res.json();
    const text = extractOutputText(data);
    const parsed = designSpecSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      throw new Error(`OpenAI returned invalid spec JSON: ${parsed.error.message}`);
    }
    const usage = data.usage ?? {};
    return {
      spec: parsed.data,
      usage: {
        inputTokens: usage.input_tokens ?? 0,
        outputTokens: usage.output_tokens ?? 0,
      },
    };
  }

  async generateImage(imagePrompt: string): Promise<ImageResult> {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.imageModel,
        prompt: imagePrompt,
        size: "1024x1024",
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`OpenAI image generation failed (${res.status}): ${err.slice(0, 500)}`);
    }
    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error("OpenAI image response contained no image data.");
    return { bytes: Buffer.from(b64, "base64"), ext: "png", usage: { images: 1 } };
  }
}

function extractOutputText(data: {
  output_text?: string;
  output?: { content?: { type: string; text?: string }[] }[];
}): string {
  if (typeof data.output_text === "string" && data.output_text) return data.output_text;
  for (const item of data.output ?? []) {
    for (const part of item.content ?? []) {
      if (part.type === "output_text" && part.text) return part.text;
    }
  }
  throw new Error("OpenAI response contained no output text.");
}
