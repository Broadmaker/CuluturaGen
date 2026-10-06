import type { VisionEstimate, VisionProvider } from "../provider";
import {
  VISION_ESTIMATE_JSON_SCHEMA,
  parseVisionOutput,
} from "../estimate-schema";

// Live OpenAI vision provider — DORMANT until VISION_PROVIDER=openai (or the
// legacy alias "live") with a key set. Sends the reference photo to a
// vision-capable model via the Responses API with Strict Structured Outputs,
// then validates + range-clamps every value before returning.
//
// Thesis guardrails (md/01 §15, md/07 §36) hold for live output exactly as
// for mock output: weight is never estimated (the schema has no such field
// and the sanitizer drops unknown keys), confidence is a process marker —
// recorded for traceability, never presented as accuracy — and every value
// stays an ESTIMATE until a designer accepts/corrects it. Plain fetch, no SDK.
export class OpenAIVisionProvider implements VisionProvider {
  readonly name = "openai";
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor() {
    const key = process.env.VISION_API_KEY || process.env.AI_API_KEY;
    if (!key) {
      throw new Error(
        "VISION_API_KEY (or AI_API_KEY) is not set (VISION_PROVIDER=openai).",
      );
    }
    this.apiKey = key;
    this.model =
      process.env.VISION_MODEL || process.env.AI_MODEL || "gpt-4o-mini";
    const raw = Number(process.env.VISION_TIMEOUT_MS ?? 60_000);
    this.timeoutMs =
      Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 60_000;
  }

  async analyze(image: Buffer): Promise<VisionEstimate> {
    const dataUrl = toDataUrl(image);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          input: [
            {
              role: "user",
              content: [
                { type: "input_text", text: ESTIMATE_PROMPT },
                { type: "input_image", image_url: dataUrl },
              ],
            },
          ],
          text: { format: VISION_ESTIMATE_JSON_SCHEMA },
          max_output_tokens: 1000,
        }),
      });
      if (!res.ok) {
        const err = await res.text().catch(() => "");
        throw new Error(
          `OpenAI vision analysis failed (${res.status}): ${err.slice(0, 500)}`,
        );
      }
      const data = await res.json();
      const text = extractOutputText(data);
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("OpenAI vision response was not valid JSON.");
      }
      const { measurements, confidence, landmarks } = parseVisionOutput(parsed);
      return { measurements, confidence, landmarks };
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        throw new Error(
          `OpenAI vision analysis timed out after ${this.timeoutMs} ms.`,
        );
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

function sniffMime(bytes: Buffer): "image/jpeg" | "image/png" | "image/webp" {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  // Upload validation already sniffed this; default keeps the call working.
  return "image/jpeg";
}

function toDataUrl(bytes: Buffer): string {
  const mime = sniffMime(bytes);
  return `data:${mime};base64,${bytes.toString("base64")}`;
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
  throw new Error("OpenAI vision response contained no output text.");
}
