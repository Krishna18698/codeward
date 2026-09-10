-- Per-problem hint text, and per-user "needed a hint" tracking.
-- Both are additive and nullable/defaulted, so this is safe on a live table:
-- existing rows get hint = NULL and usedHint = false with no rewrite.

ALTER TABLE "Problem" ADD COLUMN "hint" TEXT;

ALTER TABLE "UserProblemStatus" ADD COLUMN "usedHint" BOOLEAN NOT NULL DEFAULT false;
