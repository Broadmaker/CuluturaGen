DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "pg_available_extensions" WHERE "name" = 'vector') THEN
    CREATE EXTENSION IF NOT EXISTS "vector";
    ALTER TABLE "cultural_elements" ADD COLUMN IF NOT EXISTS "embedding" "vector"(1536);
    BEGIN
      CREATE INDEX IF NOT EXISTS "idx_cultural_elements_embedding"
        ON "cultural_elements" USING hnsw ("embedding" vector_cosine_ops);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'pgvector HNSW index skipped: %', SQLERRM;
    END;
  END IF;
END $$;
