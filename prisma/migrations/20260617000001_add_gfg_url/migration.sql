-- Add GFG (GeeksForGeeks) URL field to Problem
ALTER TABLE "Problem" ADD COLUMN IF NOT EXISTS "gfgUrl" TEXT;
