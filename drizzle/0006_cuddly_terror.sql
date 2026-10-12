CREATE TABLE "ai_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"user_id" uuid,
	"project_id" uuid,
	"kind" varchar(30) NOT NULL,
	"provider" varchar(100),
	"model" varchar(255),
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"images" integer DEFAULT 0 NOT NULL,
	"estimated_cost_usd" numeric(12, 6) DEFAULT '0' NOT NULL,
	"unpriced" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);--> statement-breakpoint
CREATE INDEX "idx_ai_usage_user_day" ON "ai_usage" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_job_id_ai_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."ai_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
