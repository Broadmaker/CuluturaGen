CREATE TABLE "cultural_element_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_element_id" uuid NOT NULL,
	"target_element_id" uuid,
	"culture_id" uuid,
	"community_id" uuid,
	"relationship_type" varchar(100) NOT NULL,
	"description" text,
	"confidence" numeric(5, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_cultural_elements" (
	"project_id" uuid NOT NULL,
	"cultural_element_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'REFERENCE' NOT NULL,
	"notes" text,
	"added_by" uuid,
	"added_at" timestamp DEFAULT now(),
	CONSTRAINT "project_cultural_elements_project_id_cultural_element_id_pk" PRIMARY KEY("project_id","cultural_element_id")
);
--> statement-breakpoint
ALTER TABLE "cultural_element_relationships" ADD CONSTRAINT "cultural_element_relationships_source_element_id_cultural_elements_id_fk" FOREIGN KEY ("source_element_id") REFERENCES "public"."cultural_elements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultural_element_relationships" ADD CONSTRAINT "cultural_element_relationships_target_element_id_cultural_elements_id_fk" FOREIGN KEY ("target_element_id") REFERENCES "public"."cultural_elements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultural_element_relationships" ADD CONSTRAINT "cultural_element_relationships_culture_id_cultures_id_fk" FOREIGN KEY ("culture_id") REFERENCES "public"."cultures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultural_element_relationships" ADD CONSTRAINT "cultural_element_relationships_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_cultural_elements" ADD CONSTRAINT "project_cultural_elements_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_cultural_elements" ADD CONSTRAINT "project_cultural_elements_cultural_element_id_cultural_elements_id_fk" FOREIGN KEY ("cultural_element_id") REFERENCES "public"."cultural_elements"("id") ON DELETE cascade ON UPDATE no action;