// OpenAI Structured-Outputs JSON Schema → Gemini `responseSchema` converter.
//
// The two schemas cannot drift: both providers consume the SAME twin schema
// objects (spec-schema.ts, estimate-schema.ts); only the dialect differs.
// Gemini's responseSchema is an OpenAPI-style subset, so this drops the keys
// it rejects (`additionalProperties`, `strict`, `$schema`, `name`), turns
// OpenAI's `type: ["number","null"]` into `nullable: true`, and adds the
// `propertyOrdering` list Gemini expects for deterministic object output.

type JsonObject = Record<string, unknown>;

// Accepts either the OpenAI wrapper `{ name, strict, schema }` or a raw
// schema node, and returns a Gemini-compatible schema node.
export function toGeminiSchema(input: unknown): JsonObject {
  const node =
    input && typeof input === "object" && "schema" in (input as JsonObject)
      ? (input as JsonObject).schema
      : input;
  return convert(node);
}

const PASS_THROUGH = ["minimum", "maximum", "minItems", "maxItems"] as const;

function convert(node: unknown): JsonObject {
  if (!node || typeof node !== "object") return { type: "string" };
  const src = node as JsonObject;
  const out: JsonObject = {};

  let type = src.type;
  let nullable = src.nullable === true;
  if (Array.isArray(type)) {
    if (type.includes("null")) nullable = true;
    const nonNull = type.find((t) => typeof t === "string" && t !== "null");
    type = nonNull ?? "string";
  }
  if (typeof type === "string") out.type = type;
  if (nullable) out.nullable = true;

  if (typeof src.description === "string") out.description = src.description;
  if (Array.isArray(src.enum)) out.enum = src.enum;
  if (src.items) out.items = convert(src.items);
  if (Array.isArray(src.required)) out.required = src.required;

  if (src.properties && typeof src.properties === "object") {
    const properties: JsonObject = {};
    const order: string[] = [];
    for (const [key, value] of Object.entries(src.properties as JsonObject)) {
      properties[key] = convert(value);
      order.push(key);
    }
    out.properties = properties;
    if (out.type === "object") out.propertyOrdering = order;
  }

  for (const key of PASS_THROUGH) {
    if (src[key] !== undefined) out[key] = src[key];
  }
  return out;
}
