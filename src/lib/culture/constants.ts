// Cultural domain constants + validation workflow.
// Spec: md/01 §10–11 (record, validation status), md/03 §19–24, md/04 §36–38.

export const ELEMENT_CATEGORIES = [
  "GARMENT",
  "TEXTILE",
  "MOTIF",
  "PATTERN",
  "COLOR",
  "SYMBOL",
  "ORNAMENT",
  "TECHNIQUE",
  "MATERIAL",
  "ACCESSORY",
  "HEADDRESS",
  "FOOTWEAR",
  "EMBELLISHMENT",
  "CEREMONIAL_ELEMENT",
  "OTHER",
] as const;

export const VALIDATION_STATUSES = [
  "UNVERIFIED",
  "UNDER_REVIEW",
  "VERIFIED",
  "RESTRICTED",
  "DEPRECATED",
] as const;

export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export const RELATIONSHIP_TYPES = [
  "BELONGS_TO",
  "ASSOCIATED_WITH",
  "USED_BY",
  "USED_IN",
  "CONTAINS",
  "SYMBOLIZES",
  "DERIVED_FROM",
  "RELATED_TO",
  "RESTRICTED_IN",
  "APPROPRIATE_FOR",
  "SIMILAR_TO",
  "DOCUMENTED_BY",
  "VALIDATED_BY",
] as const;

export const RESTRICTION_TYPES = [
  "CONTEXT_RESTRICTED",
  "CEREMONIAL_ONLY",
  "GENDER_SPECIFIC",
  "COMMUNITY_SPECIFIC",
  "STATUS_SPECIFIC",
  "SACRED",
  "NOT_FOR_COMMERCIAL_USE",
  "NOT_FOR_MODIFICATION",
  "UNKNOWN",
] as const;

export const SOURCE_TYPES = [
  "BOOK",
  "JOURNAL",
  "GOVERNMENT",
  "MUSEUM",
  "UNIVERSITY",
  "COMMUNITY_SOURCE",
  "ARCHIVE",
  "WEBSITE",
  "EXPERT_INTERVIEW",
  "OTHER",
] as const;

export const BASKET_ROLES = ["REFERENCE", "REQUIRED", "INSPIRATION"] as const;

// Validation workflow — md/04 §38. Returns the roles allowed to perform
// the transition, or null when the transition itself is illegal.
export function validationTransition(
  from: string,
  to: string,
): string[] | null {
  if (from === to) return [];
  switch (`${from}->${to}`) {
    case "UNVERIFIED->UNDER_REVIEW":
      return ["ADMIN", "DESIGNER", "CULTURAL_EXPERT", "RESEARCHER"];
    case "UNDER_REVIEW->VERIFIED":
      return ["ADMIN", "CULTURAL_EXPERT"];
    case "UNDER_REVIEW->UNVERIFIED":
      return ["ADMIN", "CULTURAL_EXPERT"];
    case "RESTRICTED->UNDER_REVIEW":
      return ["ADMIN", "CULTURAL_EXPERT"];
    case "DEPRECATED->UNDER_REVIEW":
      return ["ADMIN"];
    default:
      // *_ ->RESTRICTED is expert-gated; *_ ->DEPRECATED is admin-only.
      if (to === "RESTRICTED") return ["ADMIN", "CULTURAL_EXPERT"];
      if (to === "DEPRECATED") return ["ADMIN"];
      return null;
  }
}

export function isValidStatus(s: string): s is ValidationStatus {
  return (VALIDATION_STATUSES as readonly string[]).includes(s);
}
