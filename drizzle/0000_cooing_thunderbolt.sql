CREATE TABLE "ai_contexts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"design_version_id" uuid,
	"context" jsonb NOT NULL,
	"cultural_context" jsonb,
	"body_context" jsonb,
	"budget_context" jsonb,
	"material_context" jsonb,
	"requirement_context" jsonb,
	"constraint_context" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"design_id" uuid,
	"design_version_id" uuid,
	"job_type" varchar(100) NOT NULL,
	"provider" varchar(100),
	"model" varchar(255),
	"status" varchar(50) DEFAULT 'QUEUED',
	"input_payload" jsonb,
	"output_payload" jsonb,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(100),
	"entity_id" uuid,
	"old_value" jsonb,
	"new_value" jsonb,
	"metadata" jsonb,
	"ip_address" "inet",
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "body_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"client_id" uuid,
	"height_cm" numeric(6, 2),
	"weight_kg" numeric(6, 2),
	"shoulder_width_cm" numeric(6, 2),
	"chest_cm" numeric(6, 2),
	"waist_cm" numeric(6, 2),
	"hip_cm" numeric(6, 2),
	"neck_cm" numeric(6, 2),
	"arm_length_cm" numeric(6, 2),
	"torso_length_cm" numeric(6, 2),
	"inseam_cm" numeric(6, 2),
	"leg_length_cm" numeric(6, 2),
	"measurement_source" varchar(50),
	"confidence_level" numeric(5, 2),
	"designer_verified" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(255),
	"client_code" varchar(100),
	"gender_presentation" varchar(100),
	"age_range" varchar(50),
	"notes" text,
	"consent_status" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "communities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"culture_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"geographic_area" text,
	"validation_status" varchar(50) DEFAULT 'UNVERIFIED',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cost_estimates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"design_version_id" uuid NOT NULL,
	"material_cost" numeric(12, 2) DEFAULT '0',
	"labor_cost" numeric(12, 2) DEFAULT '0',
	"decoration_cost" numeric(12, 2) DEFAULT '0',
	"other_cost" numeric(12, 2) DEFAULT '0',
	"contingency_cost" numeric(12, 2) DEFAULT '0',
	"subtotal" numeric(12, 2) DEFAULT '0',
	"total_cost" numeric(12, 2) DEFAULT '0',
	"budget" numeric(12, 2),
	"currency" varchar(10) DEFAULT 'PHP',
	"budget_status" varchar(50),
	"calculated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cost_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cost_estimate_id" uuid NOT NULL,
	"category" varchar(100),
	"description" text,
	"material_id" uuid,
	"quantity" numeric(12, 3),
	"unit" varchar(50),
	"unit_price" numeric(12, 2),
	"total" numeric(12, 2),
	"source" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "cultural_element_references" (
	"cultural_element_id" uuid NOT NULL,
	"reference_id" uuid NOT NULL,
	"relevance" text,
	CONSTRAINT "cultural_element_references_cultural_element_id_reference_id_pk" PRIMARY KEY("cultural_element_id","reference_id")
);
--> statement-breakpoint
CREATE TABLE "cultural_elements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"element_code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"alternative_names" text[],
	"category" varchar(100) NOT NULL,
	"description" text,
	"historical_context" text,
	"symbolism" text,
	"traditional_usage" text,
	"modern_usage" text,
	"appropriate_context" text,
	"restricted_context" text,
	"validation_status" varchar(50) DEFAULT 'UNVERIFIED',
	"expert_notes" text,
	"created_by" uuid,
	"verified_by" uuid,
	"verified_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cultural_elements_element_code_unique" UNIQUE("element_code")
);
--> statement-breakpoint
CREATE TABLE "cultural_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_code" varchar(100) NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"publication_year" bigint,
	"publisher" text,
	"source_type" varchar(100),
	"url" text,
	"citation" text,
	"description" text,
	"credibility_status" varchar(50),
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "cultural_references_reference_code_unique" UNIQUE("reference_code")
);
--> statement-breakpoint
CREATE TABLE "cultural_restrictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cultural_element_id" uuid,
	"culture_id" uuid,
	"community_id" uuid,
	"restriction_type" varchar(100),
	"description" text NOT NULL,
	"severity" varchar(50),
	"source_reference_id" uuid,
	"validation_status" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cultures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"historical_context" text,
	"geographic_scope" text,
	"validation_status" varchar(50) DEFAULT 'UNVERIFIED',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cultures_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "design_briefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"culture_id" uuid,
	"community_id" uuid,
	"occasion" varchar(255),
	"garment_type" varchar(255),
	"gender_presentation" varchar(100),
	"style" varchar(255),
	"silhouette" varchar(255),
	"modern_traditional_balance" varchar(100),
	"desired_complexity" varchar(100),
	"budget" numeric(12, 2),
	"currency" varchar(10) DEFAULT 'PHP',
	"description" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "design_cultural_elements" (
	"design_version_id" uuid NOT NULL,
	"cultural_element_id" uuid NOT NULL,
	"usage_description" text,
	"source_type" varchar(50),
	"required" boolean DEFAULT false,
	"approved_by_human" boolean DEFAULT false,
	CONSTRAINT "design_cultural_elements_design_version_id_cultural_element_id_pk" PRIMARY KEY("design_version_id","cultural_element_id")
);
--> statement-breakpoint
CREATE TABLE "design_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"design_version_id" uuid,
	"user_id" uuid,
	"feedback_type" varchar(100),
	"comment" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "design_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"design_version_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"quantity" numeric(12, 3),
	"unit" varchar(50),
	"purpose" text,
	"source_type" varchar(50),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "design_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"design_brief_id" uuid NOT NULL,
	"category" varchar(100) NOT NULL,
	"requirement" text NOT NULL,
	"priority" varchar(30) NOT NULL,
	"source" varchar(100),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "design_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"design_id" uuid NOT NULL,
	"version_number" bigint NOT NULL,
	"parent_version_id" uuid,
	"design_specification" jsonb,
	"visual_prompt" text,
	"generated_image_url" text,
	"thumbnail_url" text,
	"generation_source" varchar(100),
	"ai_model" varchar(255),
	"status" varchar(50),
	"designer_notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "designs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"design_code" varchar(100) NOT NULL,
	"name" varchar(255),
	"status" varchar(50) DEFAULT 'DRAFT',
	"current_version" bigint DEFAULT 1,
	"created_by" uuid,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "designs_design_code_unique" UNIQUE("design_code")
);
--> statement-breakpoint
CREATE TABLE "evaluation_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluation_id" uuid NOT NULL,
	"category" varchar(100),
	"severity" varchar(50),
	"finding" text NOT NULL,
	"evidence" text,
	"recommendation" text,
	"related_cultural_element" uuid,
	"resolved" boolean DEFAULT false,
	"resolved_by" uuid,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"design_version_id" uuid NOT NULL,
	"overall_status" varchar(50),
	"cultural_status" varchar(50),
	"body_status" varchar(50),
	"cost_status" varchar(50),
	"requirement_status" varchar(50),
	"material_status" varchar(50),
	"human_review_required" boolean DEFAULT true,
	"evaluated_by" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "explanations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"design_version_id" uuid,
	"explanation_type" varchar(100),
	"subject_type" varchar(100),
	"subject_id" uuid,
	"what" text,
	"why" text,
	"source" text,
	"constraint" text,
	"evidence" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "file_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"design_version_id" uuid,
	"file_type" varchar(100),
	"file_name" varchar(255),
	"storage_url" text NOT NULL,
	"mime_type" varchar(100),
	"file_size" bigint,
	"checksum" varchar(255),
	"uploaded_by" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "human_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"design_version_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"decision" varchar(50),
	"comments" text,
	"cultural_review" boolean DEFAULT false,
	"body_review" boolean DEFAULT false,
	"cost_review" boolean DEFAULT false,
	"final_approval" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "material_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'PHP',
	"unit" varchar(50),
	"supplier" varchar(255),
	"effective_date" date,
	"expiration_date" date,
	"source" text,
	"verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100),
	"description" text,
	"unit" varchar(50),
	"fabric_width_cm" numeric(8, 2),
	"weight_gsm" numeric(8, 2),
	"color" varchar(100),
	"cultural_association" text,
	"availability_status" varchar(50),
	"supplier" varchar(255),
	"minimum_quantity" numeric(12, 2),
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "materials_material_code_unique" UNIQUE("material_code")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"created_by" uuid NOT NULL,
	"assigned_designer" uuid,
	"target_completion_date" date,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "projects_project_code_unique" UNIQUE("project_code")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"design_version_id" uuid,
	"report_type" varchar(100),
	"file_url" text,
	"generated_by" uuid,
	"generated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "roles_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"display_name" varchar(200),
	"profile_image_url" text,
	"status" varchar(30) DEFAULT 'ACTIVE' NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_contexts" ADD CONSTRAINT "ai_contexts_design_version_id_design_versions_id_fk" FOREIGN KEY ("design_version_id") REFERENCES "public"."design_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_design_id_designs_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."designs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_design_version_id_design_versions_id_fk" FOREIGN KEY ("design_version_id") REFERENCES "public"."design_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_profiles" ADD CONSTRAINT "body_profiles_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_profiles" ADD CONSTRAINT "body_profiles_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_culture_id_cultures_id_fk" FOREIGN KEY ("culture_id") REFERENCES "public"."cultures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_estimates" ADD CONSTRAINT "cost_estimates_design_version_id_design_versions_id_fk" FOREIGN KEY ("design_version_id") REFERENCES "public"."design_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_items" ADD CONSTRAINT "cost_items_cost_estimate_id_cost_estimates_id_fk" FOREIGN KEY ("cost_estimate_id") REFERENCES "public"."cost_estimates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_items" ADD CONSTRAINT "cost_items_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultural_element_references" ADD CONSTRAINT "cultural_element_references_cultural_element_id_cultural_elements_id_fk" FOREIGN KEY ("cultural_element_id") REFERENCES "public"."cultural_elements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultural_element_references" ADD CONSTRAINT "cultural_element_references_reference_id_cultural_references_id_fk" FOREIGN KEY ("reference_id") REFERENCES "public"."cultural_references"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultural_restrictions" ADD CONSTRAINT "cultural_restrictions_cultural_element_id_cultural_elements_id_fk" FOREIGN KEY ("cultural_element_id") REFERENCES "public"."cultural_elements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultural_restrictions" ADD CONSTRAINT "cultural_restrictions_culture_id_cultures_id_fk" FOREIGN KEY ("culture_id") REFERENCES "public"."cultures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultural_restrictions" ADD CONSTRAINT "cultural_restrictions_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_briefs" ADD CONSTRAINT "design_briefs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_cultural_elements" ADD CONSTRAINT "design_cultural_elements_design_version_id_design_versions_id_fk" FOREIGN KEY ("design_version_id") REFERENCES "public"."design_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_cultural_elements" ADD CONSTRAINT "design_cultural_elements_cultural_element_id_cultural_elements_id_fk" FOREIGN KEY ("cultural_element_id") REFERENCES "public"."cultural_elements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_feedback" ADD CONSTRAINT "design_feedback_design_version_id_design_versions_id_fk" FOREIGN KEY ("design_version_id") REFERENCES "public"."design_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_materials" ADD CONSTRAINT "design_materials_design_version_id_design_versions_id_fk" FOREIGN KEY ("design_version_id") REFERENCES "public"."design_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_materials" ADD CONSTRAINT "design_materials_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_requirements" ADD CONSTRAINT "design_requirements_design_brief_id_design_briefs_id_fk" FOREIGN KEY ("design_brief_id") REFERENCES "public"."design_briefs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_versions" ADD CONSTRAINT "design_versions_design_id_designs_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."designs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designs" ADD CONSTRAINT "designs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_findings" ADD CONSTRAINT "evaluation_findings_evaluation_id_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_findings" ADD CONSTRAINT "evaluation_findings_related_cultural_element_cultural_elements_id_fk" FOREIGN KEY ("related_cultural_element") REFERENCES "public"."cultural_elements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_design_version_id_design_versions_id_fk" FOREIGN KEY ("design_version_id") REFERENCES "public"."design_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "explanations" ADD CONSTRAINT "explanations_design_version_id_design_versions_id_fk" FOREIGN KEY ("design_version_id") REFERENCES "public"."design_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_design_version_id_design_versions_id_fk" FOREIGN KEY ("design_version_id") REFERENCES "public"."design_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_reviews" ADD CONSTRAINT "human_reviews_design_version_id_design_versions_id_fk" FOREIGN KEY ("design_version_id") REFERENCES "public"."design_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_prices" ADD CONSTRAINT "material_prices_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_assigned_designer_users_id_fk" FOREIGN KEY ("assigned_designer") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_design_version_id_design_versions_id_fk" FOREIGN KEY ("design_version_id") REFERENCES "public"."design_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_cultural_elements_category" ON "cultural_elements" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_cultural_elements_status" ON "cultural_elements" USING btree ("validation_status");--> statement-breakpoint
CREATE INDEX "idx_cultural_references_type" ON "cultural_references" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "idx_design_versions_design" ON "design_versions" USING btree ("design_id");--> statement-breakpoint
CREATE INDEX "idx_designs_project" ON "designs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_evaluations_design" ON "evaluations" USING btree ("design_version_id");--> statement-breakpoint
CREATE INDEX "idx_material_prices_material" ON "material_prices" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "idx_materials_category" ON "materials" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_projects_created_by" ON "projects" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_projects_status" ON "projects" USING btree ("status");