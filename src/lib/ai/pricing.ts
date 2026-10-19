// Provider price cards for AI spend estimates (md/10 §158). Rates are USD
// list prices at time of writing — refresh against provider pages when they
// change; an unknown model is NEVER costed with a guessed rate (it is
// flagged `unpriced` instead, same honesty rule as md/06: missing prices
// are reported, never invented). Pure: unit-testable, no database.
export interface UsageInput {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  images: number;
}

export interface CostEstimate {
  /** USD, rounded to 6dp. 0 when free or unpriced. */
  usd: number;
  /** True when no price card covers this provider+model. */
  unpriced: boolean;
}

interface PriceCard {
  inputPerMillion: number;
  outputPerMillion: number;
  /** Flat USD per image at the card's size (used when images > 0). */
  imageFlat?: number;
}

// gpt-4o-mini text rates; gpt-image-1 flat per 1024x1024 render (token-based
// image pricing varies per render — the flat rate is documented as an
// ESTIMATE in every surface that shows it).
const CARDS: Record<string, PriceCard> = {
  "openai:gpt-4o-mini": { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  "openai:gpt-image-1": { inputPerMillion: 0, outputPerMillion: 0, imageFlat: 0.04 },
  "openai:text-embedding-3-small": { inputPerMillion: 0.02, outputPerMillion: 0 },
  // Google Gemini (AI Studio / Gemini API) list rates. gemini-2.5-flash-image
  // is ~1290 output tokens/image → a flat ≈$0.039 render, documented as an
  // ESTIMATE like the OpenAI image card. An overridden GOOGLE_MODEL with no
  // card here is reported `unpriced`, never guessed.
  "google:gemini-2.5-flash": { inputPerMillion: 0.3, outputPerMillion: 2.5 },
  "google:gemini-2.5-flash-lite": { inputPerMillion: 0.1, outputPerMillion: 0.4 },
  "google:gemini-2.0-flash": { inputPerMillion: 0.1, outputPerMillion: 0.4 },
  "google:gemini-2.5-flash-image": { inputPerMillion: 0, outputPerMillion: 0, imageFlat: 0.039 },
  "google:gemini-embedding-001": { inputPerMillion: 0.15, outputPerMillion: 0 },
};

export function estimateCost(u: UsageInput): CostEstimate {
  // Mock (and any explicitly free provider) is priced at $0 — free by
  // definition, not "unknown".
  if (u.provider === "mock") return { usd: 0, unpriced: false };
  const card = CARDS[`${u.provider}:${u.model}`];
  if (!card) return { usd: 0, unpriced: true };
  const text =
    (Math.max(0, u.inputTokens) * card.inputPerMillion +
      Math.max(0, u.outputTokens) * card.outputPerMillion) /
    1_000_000;
  const images = card.imageFlat !== undefined ? Math.max(0, u.images) * card.imageFlat : 0;
  return { usd: Math.round((text + images) * 1_000_000) / 1_000_000, unpriced: false };
}
