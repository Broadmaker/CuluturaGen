import type { VisionEstimate, VisionProvider } from "../provider";
import { VISION_ESTIMATE_JSON_SCHEMA, parseVisionOutput } from "../estimate-schema";
import { sniffMime } from "../mime";
import { toGeminiSchema } from "@/lib/ai/providers/gemini-schema";

// Live Google Gemini vision provider — DORMANT until VISION_PROVIDER=google
// with GOOGLE_API_KEY set. Gemini is natively multimodal, so the reference
// photo is sent as an inline image part alongside the prompt and the response
// is constrained to the same estimate schema as the OpenAI provider. Thesis
// guardrails hold identically: weight is absent from the schema and dropped
// by the sanitizer, confidence is a process marker, every value is an
// ESTIMATE until a designer accepts it. Plain fetch, no SDK.
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export class GoogleVisionProvider implements VisionProvider {
  readonly name = "google";
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor() {
    const key =
      process.env.VISION_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.AI_API_KEY;
    if (!key) {
      throw new Error("GOOGLE_API_KEY is not set (VISION_PROVIDER=google).");
    }
    this.apiKey = key;
    this.model =
      process.env.GOOGLE_VISION_MODEL || process.env.GOOGLE_MODEL || "gemini-2.5-flash";
    const raw = Number(process.env.VISION_TIMEOUT_MS ?? 60_000);
    this.timeoutMs = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 60_000;
  }

  async analyze(image: Buffer): Promise<VisionEstimate> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${API_BASE}/${this.model}:generateContent`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "x-goog-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType: sniffMime(image), data: image.toString("base64") } },
                { text: ESTIMATE_PROMPT },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: toGeminiSchema(VISION_ESTIMATE_JSON_SCHEMA),
            maxOutputTokens: 1000,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.text().catch(() => "");
        throw new Error(`Google AI vision analysis failed (${res.status}): ${err.slice(0, 500)}`);
      }
      const data = (await res.json()) as GeminiResponse;
      const text = (data.candidates?.[0]?.content?.parts ?? [])
        .map((p) => (typeof p.text === "string" ? p.text : ""))
        .join("");
      if (!text) throw new Error("Google AI vision response contained no output text.");
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("Google AI vision response was not valid JSON.");
      }
      const { measurements, confidence, landmarks } = parseVisionOutput(parsed);
      return { measurements, confidence, landmarks };
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        throw new Error(`Google AI vision analysis timed out after ${this.timeoutMs} ms.`);
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }
}

const ESTIMATE_PROMPT = [
  "Estimate the person's body measurements in centimeters from this single reference photo.",
  "Return null for any measurement you cannot estimate from what is visible.",
  "Rules: never estimate weight; all values are rough visual estimates, not precise measurements;",
  "confidence is your self-assessed process confidence from 0 to 1;",
  "landmarks is the number of body landmarks you detected.",
].join(" ");
