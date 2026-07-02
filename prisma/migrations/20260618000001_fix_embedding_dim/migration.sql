-- voyage-3-lite outputs 512 dimensions, not 1024. Recreate column with correct size.
ALTER TABLE "KnowledgeChunk" DROP COLUMN IF EXISTS "embedding";
ALTER TABLE "KnowledgeChunk" ADD COLUMN "embedding" vector(512);
