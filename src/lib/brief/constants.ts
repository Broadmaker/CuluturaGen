// Design-brief domain constants — md/01 §16–17, md/02 §12, md/03 brief tables.
export const REQUIREMENT_PRIORITIES = [
  "MANDATORY",
  "PREFERRED",
  "OPTIONAL",
  "RESTRICTED",
] as const;

export const REQUIREMENT_CATEGORIES = [
  "CULTURAL",
  "BODY",
  "BUDGET",
  "MATERIAL",
  "OCCASION",
  "STYLE",
  "GARMENT",
  "DESIGN",
  "USER",
] as const;

export const MEASUREMENT_SOURCES = [
  "MANUAL",
  "COMPUTER_VISION",
  "IMPORTED",
  "ESTIMATED",
] as const;

// Body measurement fields with labels/units — md/01 §14, md/03 body_profiles.
export const BODY_FIELDS = [
  { key: "heightCm", label: "Height", unit: "cm" },
  { key: "weightKg", label: "Weight", unit: "kg" },
  { key: "shoulderWidthCm", label: "Shoulder width", unit: "cm" },
  { key: "chestCm", label: "Chest / Bust", unit: "cm" },
  { key: "waistCm", label: "Waist", unit: "cm" },
  { key: "hipCm", label: "Hip", unit: "cm" },
  { key: "neckCm", label: "Neck", unit: "cm" },
  { key: "armLengthCm", label: "Arm length", unit: "cm" },
  { key: "torsoLengthCm", label: "Torso length", unit: "cm" },
  { key: "inseamCm", label: "Inseam", unit: "cm" },
  { key: "legLengthCm", label: "Leg length", unit: "cm" },
] as const;

export type BodyFieldKey = (typeof BODY_FIELDS)[number]["key"];
