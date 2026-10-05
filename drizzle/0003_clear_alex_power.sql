ALTER TABLE "cultural_elements" ADD COLUMN "search_vector" "tsvector";--> statement-breakpoint
CREATE INDEX "idx_cultural_elements_search" ON "cultural_elements" USING gin ("search_vector");--> statement-breakpoint
CREATE OR REPLACE FUNCTION "cultural_elements_search_trigger_fn"() RETURNS trigger AS $$
BEGIN
  NEW."search_vector" :=
    setweight(to_tsvector('english', coalesce(NEW."name", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW."alternative_names", ' '), '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."category", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."description", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."symbolism", '')), 'B') ||
    setweight(to_tsvector('english',
      coalesce(NEW."historical_context", '') || ' ' ||
      coalesce(NEW."traditional_usage", '') || ' ' ||
      coalesce(NEW."modern_usage", '') || ' ' ||
      coalesce(NEW."appropriate_context", '') || ' ' ||
      coalesce(NEW."restricted_context", '') || ' ' ||
      coalesce(NEW."expert_notes", '')), 'C');
  RETURN NEW;
END $$ LANGUAGE plpgsql;--> statement-breakpoint
DROP TRIGGER IF EXISTS "cultural_elements_search_trigger" ON "cultural_elements";--> statement-breakpoint
CREATE TRIGGER "cultural_elements_search_trigger"
  BEFORE INSERT OR UPDATE OF "name", "alternative_names", "category", "description", "symbolism", "historical_context", "traditional_usage", "modern_usage", "appropriate_context", "restricted_context", "expert_notes"
  ON "cultural_elements" FOR EACH ROW
  EXECUTE FUNCTION "cultural_elements_search_trigger_fn"();--> statement-breakpoint
UPDATE "cultural_elements" SET "name" = "name";