import type { BuiltContext } from "../context-builder";
import type { Constraints } from "../constraint-engine";
import { DESIGN_SPEC_JSON_SCHEMA, designSpecSchema, type DesignSpec } from "../spec-schema";
import type { DesignProvider, ImageResult, SpecResult } from "../provider";
import { toGeminiSchema } from "./gemini-schema";

// Live Google Gemini provider (Gemini API / AI Studio, simple API key) —
// DORMANT until AI_PROVIDER=google with GOOGLE_API_KEY set. Same two-stage
// contract as the OpenAI provider: Stage 1 structured spec via
// responseSchema + JSON mime type; Stage 2 image via the Gemini image model's
// inline image output. Plain fetch, no SDK. Fails loudly without a key.
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
}
interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

export class GoogleProvider implements DesignProvider {
  readonly name = "google";
  private readonly apiKey: string;
  private readonly model: string;
  private readonly imageModel: string;
  private readonly timeoutMs: number;

  get models(): { spec: string; image: string } {
    return { spec: this.model, image: this.imageModel };
  }

  constructor() {
    const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    if (!key) {
      throw new Error("GOOGLE_API_KEY is not set (AI_PROVIDER=google).");
    }
    this.apiKey = key;
    this.model = process.env.GOOGLE_MODEL || "gemini-2.5-flash";
    this.imageModel = process.env.GOOGLE_IMAGE_MODEL || "gemini-2.5-flash-image";
    const raw = Number(process.env.GOOGLE_TIMEOUT_MS ?? 60_000);
    this.timeoutMs = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 60_000;
  }

  async generateSpec(
    _ctx: BuiltContext,
    _c: Constraints,
    prompt: { system: string; user: string },
  ): Promise<SpecResult> {
    const data = await this.call(this.model, {
      contents: [{ role: "user", parts: [{ text: prompt.user }] }],
      systemInstruction: { parts: [{ text: prompt.system }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: toGeminiSchema(DESIGN_SPEC_JSON_SCHEMA),
        maxOutputTokens: 4000,
      },
    });
    const text = extractText(data);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Google AI returned a non-JSON spec response.");
    }
    const validated = designSpecSchema.safeParse(parsed);
    if (!validated.success) {
      throw new Error(`Google AI returned invalid spec JSON: ${validated.error.message}`);
    }
    const usage = data.usageMetadata ?? {};
    return {
      spec: validated.data,
      usage: {
        inputTokens: usage.promptTokenCount ?? 0,
        outputTokens: usage.candidatesTokenCount ?? 0,
      },
    };
  }

  // The image prompt already encodes the spec, so the live provider renders
  // from the prompt alone (mirrors the OpenAI provider contract).
  async generateImage(imagePrompt: string, _spec: DesignSpec): Promise<ImageResult> {
    const data = await this.call(this.imageModel, {
      contents: [{ role: "user", parts: [{ text: imagePrompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    });
    const part = findImagePart(data);
    if (!part?.inlineData?.data) {
      throw new Error("Google AI image response contained no image data.");
    }
    return {
      bytes: Buffer.from(part.inlineData.data, "base64"),
      ext: "png",
      usage: { images: 1 },
    };
  }

  private async call(model: string, body: unknown): Promise<GeminiResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${API_BASE}/${model}:generateContent`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "x-goog-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text().catch(() => "");
        throw new Error(`Google AI request failed (${res.status}): ${err.slice(0, 500)}`);
      }
      return (await res.json()) as GeminiResponse;
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        throw new Error(`Google AI request timed out after ${this.timeoutMs} ms.`);
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }
}

function extractText(data: GeminiResponse): string {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((p) => (typeof p.text === "string" ? p.text : ""))
    .join("");
  if (!text) throw new Error("Google AI response contained no text output.");
  return text;
}

function findImagePart(data: GeminiResponse): GeminiPart | undefined {
  for (const candidate of data.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.inlineData?.data) return part;
    }
  }
  return undefined;
}
