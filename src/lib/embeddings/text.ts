// Embeddable text for a cultural element (md/04 §72). Same source fields as
// the tsvector trigger (migration 0003) — name and alternatives first (most
// discriminative), then category, description, symbolism, usage notes.
// Pure: unit-testable without a database.
export interface EmbeddableElement {
  name: string;
  alternativeNames?: string[] | null;
  category: string;
  description?: string | null;
  symbolism?: string | null;
  historicalContext?: string | null;
  traditionalUsage?: string | null;
  modernUsage?: string | null;
}

export function elementEmbedText(el: EmbeddableElement): string {
  const parts: string[] = [el.name.trim()];
  const alt = (el.alternativeNames ?? []).map((a) => a.trim()).filter(Boolean);
  if (alt.length > 0) parts.push(`Also known as: ${alt.join(", ")}`);
  if (el.category.trim()) parts.push(`Category: ${el.category.trim()}`);
  for (const field of [
    el.description,
    el.symbolism,
    el.historicalContext,
    el.traditionalUsage,
    el.modernUsage,
  ]) {
    const text = field?.trim();
    if (text) parts.push(text);
  }
  return parts.join("\n");
}
