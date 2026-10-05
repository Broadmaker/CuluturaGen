// Drizzle schema — Human-AI Collaborative Cultural Attire Design Platform
// 1:1 port of the MVP scope in md/03_DATABASE_SCHEMA.md (§74).
// DECIDED: Drizzle ORM only — Prisma / SQLAlchemy were pre-decision options
// in md/03 §1 and are not used. Drizzle chosen for typed retrieval queries
// (pgvector + recursive CTEs in Phase 2). Table/column names match the MD's SQL.
import {
  bigint,
  boolean,
  customType,
  date,
  decimal,
  index,
  inet,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Native full-text search vector (md/03 §61, md/04 §72). Maintained by a
// DB trigger (see migration 0003); pgvector dense embeddings arrive later
// when the extension is available — the fusion scorer already accepts an
// optional vector score so the upgrade is additive.
const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return "tsvector";
  },
});

// ---------- 001_auth ----------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  displayName: varchar("display_name", { length: 200 }),
  profileImageUrl: text("profile_image_url"),
  status: varchar("status", { length: 30 }).notNull().default("ACTIVE"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at").defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] })],
);

// ---------- 002_projects / 003_clients / 004_body ----------
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectCode: varchar("project_code", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 50 }).notNull().default("DRAFT"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    assignedDesigner: uuid("assigned_designer").references(() => users.id),
    targetCompletionDate: date("target_completion_date", { mode: "date" }),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_projects_created_by").on(t.createdBy),
    index("idx_projects_status").on(t.status),
  ],
);

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }),
  clientCode: varchar("client_code", { length: 100 }),
  genderPresentation: varchar("gender_presentation", { length: 100 }),
  ageRange: varchar("age_range", { length: 50 }),
  notes: text("notes"),
  consentStatus: varchar("consent_status", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const bodyProfiles = pgTable("body_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  clientId: uuid("client_id").references(() => clients.id),
  heightCm: decimal("height_cm", { precision: 6, scale: 2 }),
  weightKg: decimal("weight_kg", { precision: 6, scale: 2 }),
  shoulderWidthCm: decimal("shoulder_width_cm", { precision: 6, scale: 2 }),
  chestCm: decimal("chest_cm", { precision: 6, scale: 2 }),
  waistCm: decimal("waist_cm", { precision: 6, scale: 2 }),
  hipCm: decimal("hip_cm", { precision: 6, scale: 2 }),
  neckCm: decimal("neck_cm", { precision: 6, scale: 2 }),
  armLengthCm: decimal("arm_length_cm", { precision: 6, scale: 2 }),
  torsoLengthCm: decimal("torso_length_cm", { precision: 6, scale: 2 }),
  inseamCm: decimal("inseam_cm", { precision: 6, scale: 2 }),
  legLengthCm: decimal("leg_length_cm", { precision: 6, scale: 2 }),
  measurementSource: varchar("measurement_source", { length: 50 }),
  confidenceLevel: decimal("confidence_level", { precision: 5, scale: 2 }),
  designerVerified: boolean("designer_verified").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ---------- 011_briefs / 012_requirements ----------
export const designBriefs = pgTable("design_briefs", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  cultureId: uuid("culture_id"),
  communityId: uuid("community_id"),
  occasion: varchar("occasion", { length: 255 }),
  garmentType: varchar("garment_type", { length: 255 }),
  genderPresentation: varchar("gender_presentation", { length: 100 }),
  style: varchar("style", { length: 255 }),
  silhouette: varchar("silhouette", { length: 255 }),
  modernTraditionalBalance: varchar("modern_traditional_balance", { length: 100 }),
  desiredComplexity: varchar("desired_complexity", { length: 100 }),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("PHP"),
  description: text("description"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const designRequirements = pgTable("design_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  designBriefId: uuid("design_brief_id")
    .notNull()
    .references(() => designBriefs.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 100 }).notNull(),
  requirement: text("requirement").notNull(),
  priority: varchar("priority", { length: 30 }).notNull(),
  source: varchar("source", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- 005_cultures → 008_restrictions ----------
export const cultures = pgTable("cultures", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  historicalContext: text("historical_context"),
  geographicScope: text("geographic_scope"),
  validationStatus: varchar("validation_status", { length: 50 }).default("UNVERIFIED"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const communities = pgTable("communities", {
  id: uuid("id").primaryKey().defaultRandom(),
  cultureId: uuid("culture_id").references(() => cultures.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  geographicArea: text("geographic_area"),
  validationStatus: varchar("validation_status", { length: 50 }).default("UNVERIFIED"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const culturalElements = pgTable(
  "cultural_elements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    elementCode: varchar("element_code", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    alternativeNames: text("alternative_names").array(),
    category: varchar("category", { length: 100 }).notNull(),
    description: text("description"),
    historicalContext: text("historical_context"),
    symbolism: text("symbolism"),
    traditionalUsage: text("traditional_usage"),
    modernUsage: text("modern_usage"),
    appropriateContext: text("appropriate_context"),
    restrictedContext: text("restricted_context"),
    validationStatus: varchar("validation_status", { length: 50 }).default("UNVERIFIED"),
    expertNotes: text("expert_notes"),
    searchVector: tsvector("search_vector"),
    createdBy: uuid("created_by"),
    verifiedBy: uuid("verified_by"),
    verifiedAt: timestamp("verified_at"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_cultural_elements_category").on(t.category),
    index("idx_cultural_elements_status").on(t.validationStatus),
  ],
);

export const culturalReferences = pgTable(
  "cultural_references",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referenceCode: varchar("reference_code", { length: 100 }).notNull().unique(),
    title: text("title").notNull(),
    author: text("author"),
    publicationYear: bigint("publication_year", { mode: "number" }),
    publisher: text("publisher"),
    sourceType: varchar("source_type", { length: 100 }),
    url: text("url"),
    citation: text("citation"),
    description: text("description"),
    credibilityStatus: varchar("credibility_status", { length: 50 }),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("idx_cultural_references_type").on(t.sourceType)],
);

export const culturalElementReferences = pgTable(
  "cultural_element_references",
  {
    culturalElementId: uuid("cultural_element_id")
      .notNull()
      .references(() => culturalElements.id, { onDelete: "cascade" }),
    referenceId: uuid("reference_id")
      .notNull()
      .references(() => culturalReferences.id, { onDelete: "cascade" }),
    relevance: text("relevance"),
  },
  (t) => [primaryKey({ columns: [t.culturalElementId, t.referenceId] })],
);

export const culturalRestrictions = pgTable("cultural_restrictions", {  id: uuid("id").primaryKey().defaultRandom(),
  culturalElementId: uuid("cultural_element_id").references(() => culturalElements.id, {
    onDelete: "cascade",
  }),
  cultureId: uuid("culture_id").references(() => cultures.id),
  communityId: uuid("community_id").references(() => communities.id),
  restrictionType: varchar("restriction_type", { length: 100 }),
  description: text("description").notNull(),
  severity: varchar("severity", { length: 50 }),
  sourceReferenceId: uuid("source_reference_id"),
  validationStatus: varchar("validation_status", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Element associations — md/03 §20, extended for MVP 2: the spec's table links
// element→element only, but culture filtering and the detail page need
// element↔culture/community links before the Phase 2 graph layer exists.
// Exactly one of targetElementId / cultureId / communityId must be set
// (enforced in API validation, not a DB CHECK, to keep the migration simple).
export const culturalElementRelationships = pgTable("cultural_element_relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceElementId: uuid("source_element_id")
    .notNull()
    .references(() => culturalElements.id, { onDelete: "cascade" }),
  targetElementId: uuid("target_element_id").references(() => culturalElements.id, {
    onDelete: "cascade",
  }),
  cultureId: uuid("culture_id").references(() => cultures.id, { onDelete: "cascade" }),
  communityId: uuid("community_id").references(() => communities.id, { onDelete: "cascade" }),
  relationshipType: varchar("relationship_type", { length: 100 }).notNull(),
  description: text("description"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Project research basket — md/08 §23. Elements a designer collects for a
// project (with role + notes + provenance) before MVP 4 attaches them to a
// design version via design_cultural_elements.
export const projectCulturalElements = pgTable(
  "project_cultural_elements",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    culturalElementId: uuid("cultural_element_id")
      .notNull()
      .references(() => culturalElements.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull().default("REFERENCE"),
    notes: text("notes"),
    addedBy: uuid("added_by"),
    addedAt: timestamp("added_at").defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.culturalElementId] })],
);

// ---------- 009_materials / 010_prices ----------
export const materials = pgTable(
  "materials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    materialCode: varchar("material_code", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 100 }),
    description: text("description"),
    unit: varchar("unit", { length: 50 }),
    fabricWidthCm: decimal("fabric_width_cm", { precision: 8, scale: 2 }),
    weightGsm: decimal("weight_gsm", { precision: 8, scale: 2 }),
    color: varchar("color", { length: 100 }),
    culturalAssociation: text("cultural_association"),
    availabilityStatus: varchar("availability_status", { length: 50 }),
    supplier: varchar("supplier", { length: 255 }),
    minimumQuantity: decimal("minimum_quantity", { precision: 12, scale: 2 }),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("idx_materials_category").on(t.category)],
);

export const materialPrices = pgTable(
  "material_prices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).default("PHP"),
    unit: varchar("unit", { length: 50 }),
    supplier: varchar("supplier", { length: 255 }),
    effectiveDate: date("effective_date", { mode: "date" }),
    expirationDate: date("expiration_date", { mode: "date" }),
    source: text("source"),
    verified: boolean("verified").default(false),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("idx_material_prices_material").on(t.materialId)],
);

// ---------- 013_designs / 014_versions ----------
export const designs = pgTable(
  "designs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    designCode: varchar("design_code", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    status: varchar("status", { length: 50 }).notNull().default("DRAFT"),
    currentVersion: bigint("current_version", { mode: "number" }).default(1),
    createdBy: uuid("created_by"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("idx_designs_project").on(t.projectId)],
);

export const designVersions = pgTable(
  "design_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    designId: uuid("design_id")
      .notNull()
      .references(() => designs.id, { onDelete: "cascade" }),
    versionNumber: bigint("version_number", { mode: "number" }).notNull(),
    parentVersionId: uuid("parent_version_id"),
    designSpecification: jsonb("design_specification"),
    visualPrompt: text("visual_prompt"),
    generatedImageUrl: text("generated_image_url"),
    thumbnailUrl: text("thumbnail_url"),
    generationSource: varchar("generation_source", { length: 100 }),
    aiModel: varchar("ai_model", { length: 255 }),
    status: varchar("status", { length: 50 }),
    designerNotes: text("designer_notes"),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("idx_design_versions_design").on(t.designId)],
);

export const designCulturalElements = pgTable(
  "design_cultural_elements",
  {
    designVersionId: uuid("design_version_id")
      .notNull()
      .references(() => designVersions.id, { onDelete: "cascade" }),
    culturalElementId: uuid("cultural_element_id")
      .notNull()
      .references(() => culturalElements.id),
    usageDescription: text("usage_description"),
    sourceType: varchar("source_type", { length: 50 }),
    required: boolean("required").default(false),
    approvedByHuman: boolean("approved_by_human").default(false),
  },
  (t) => [primaryKey({ columns: [t.designVersionId, t.culturalElementId] })],
);

export const designMaterials = pgTable("design_materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  designVersionId: uuid("design_version_id")
    .notNull()
    .references(() => designVersions.id, { onDelete: "cascade" }),
  materialId: uuid("material_id")
    .notNull()
    .references(() => materials.id),
  quantity: decimal("quantity", { precision: 12, scale: 3 }),
  unit: varchar("unit", { length: 50 }),
  purpose: text("purpose"),
  sourceType: varchar("source_type", { length: 50 }),
  notes: text("notes"),
});

// ---------- 017_ai / 018_jobs ----------
export const aiContexts = pgTable("ai_contexts", {
  id: uuid("id").primaryKey().defaultRandom(),
  designVersionId: uuid("design_version_id").references(() => designVersions.id),
  context: jsonb("context").notNull(),
  culturalContext: jsonb("cultural_context"),
  bodyContext: jsonb("body_context"),
  budgetContext: jsonb("budget_context"),
  materialContext: jsonb("material_context"),
  requirementContext: jsonb("requirement_context"),
  constraintContext: jsonb("constraint_context"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiJobs = pgTable("ai_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id),
  designId: uuid("design_id").references(() => designs.id),
  designVersionId: uuid("design_version_id").references(() => designVersions.id),
  jobType: varchar("job_type", { length: 100 }).notNull(),
  provider: varchar("provider", { length: 100 }),
  model: varchar("model", { length: 255 }),
  status: varchar("status", { length: 50 }).default("QUEUED"),
  inputPayload: jsonb("input_payload"),
  outputPayload: jsonb("output_payload"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- 019_cost / 020_items ----------
export const costEstimates = pgTable("cost_estimates", {
  id: uuid("id").primaryKey().defaultRandom(),
  designVersionId: uuid("design_version_id")
    .notNull()
    .references(() => designVersions.id),
  materialCost: decimal("material_cost", { precision: 12, scale: 2 }).default("0"),
  laborCost: decimal("labor_cost", { precision: 12, scale: 2 }).default("0"),
  decorationCost: decimal("decoration_cost", { precision: 12, scale: 2 }).default("0"),
  otherCost: decimal("other_cost", { precision: 12, scale: 2 }).default("0"),
  contingencyCost: decimal("contingency_cost", { precision: 12, scale: 2 }).default("0"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0"),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).default("0"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("PHP"),
  budgetStatus: varchar("budget_status", { length: 50 }),
  calculatedAt: timestamp("calculated_at").defaultNow(),
});

export const costItems = pgTable("cost_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  costEstimateId: uuid("cost_estimate_id")
    .notNull()
    .references(() => costEstimates.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  materialId: uuid("material_id").references(() => materials.id),
  quantity: decimal("quantity", { precision: 12, scale: 3 }),
  unit: varchar("unit", { length: 50 }),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }),
  total: decimal("total", { precision: 12, scale: 2 }),
  source: varchar("source", { length: 50 }),
});

// ---------- 021_evaluations / 022_findings ----------
export const evaluations = pgTable(
  "evaluations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    designVersionId: uuid("design_version_id")
      .notNull()
      .references(() => designVersions.id),
    overallStatus: varchar("overall_status", { length: 50 }),
    culturalStatus: varchar("cultural_status", { length: 50 }),
    bodyStatus: varchar("body_status", { length: 50 }),
    costStatus: varchar("cost_status", { length: 50 }),
    requirementStatus: varchar("requirement_status", { length: 50 }),
    materialStatus: varchar("material_status", { length: 50 }),
    humanReviewRequired: boolean("human_review_required").default(true),
    evaluatedBy: uuid("evaluated_by"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("idx_evaluations_design").on(t.designVersionId)],
);

export const evaluationFindings = pgTable("evaluation_findings", {
  id: uuid("id").primaryKey().defaultRandom(),
  evaluationId: uuid("evaluation_id")
    .notNull()
    .references(() => evaluations.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 100 }),
  severity: varchar("severity", { length: 50 }),
  finding: text("finding").notNull(),
  evidence: text("evidence"),
  recommendation: text("recommendation"),
  relatedCulturalElement: uuid("related_cultural_element").references(
    () => culturalElements.id,
  ),
  resolved: boolean("resolved").default(false),
  resolvedBy: uuid("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- explainability / human review ----------
export const explanations = pgTable("explanations", {
  id: uuid("id").primaryKey().defaultRandom(),
  designVersionId: uuid("design_version_id").references(() => designVersions.id),
  explanationType: varchar("explanation_type", { length: 100 }),
  subjectType: varchar("subject_type", { length: 100 }),
  subjectId: uuid("subject_id"),
  what: text("what"),
  why: text("why"),
  source: text("source"),
  constraint: text("constraint"),
  evidence: jsonb("evidence"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const humanReviews = pgTable("human_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  designVersionId: uuid("design_version_id")
    .notNull()
    .references(() => designVersions.id),
  reviewerId: uuid("reviewer_id").notNull(),
  decision: varchar("decision", { length: 50 }),
  comments: text("comments"),
  culturalReview: boolean("cultural_review").default(false),
  bodyReview: boolean("body_review").default(false),
  costReview: boolean("cost_review").default(false),
  finalApproval: boolean("final_approval").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const designFeedback = pgTable("design_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  designVersionId: uuid("design_version_id").references(() => designVersions.id),
  userId: uuid("user_id"),
  feedbackType: varchar("feedback_type", { length: 100 }),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- 024_files / 025_reports / 026_audit ----------
export const fileAssets = pgTable("file_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  designVersionId: uuid("design_version_id").references(() => designVersions.id),
  fileType: varchar("file_type", { length: 100 }),
  fileName: varchar("file_name", { length: 255 }),
  storageUrl: text("storage_url").notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: bigint("file_size", { mode: "number" }),
  checksum: varchar("checksum", { length: 255 }),
  uploadedBy: uuid("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  designVersionId: uuid("design_version_id").references(() => designVersions.id),
  reportType: varchar("report_type", { length: 100 }),
  fileUrl: text("file_url"),
  generatedBy: uuid("generated_by"),
  generatedAt: timestamp("generated_at").defaultNow(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id"),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }),
    entityId: uuid("entity_id"),
    oldValue: jsonb("old_value"),
    newValue: jsonb("new_value"),
    metadata: jsonb("metadata"),
    ipAddress: inet("ip_address"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("idx_audit_logs_entity").on(t.entityType, t.entityId)],
);
