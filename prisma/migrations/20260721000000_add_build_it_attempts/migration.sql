CREATE TABLE "BuildItAttempt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "problemSlug" TEXT NOT NULL,
  "stage" INTEGER NOT NULL,
  "language" TEXT NOT NULL,
  "approach" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "criteria" JSONB NOT NULL,
  "invariantHolds" BOOLEAN,
  "feedback" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BuildItAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BuildItAttempt_userId_problemSlug_stage_idx"
  ON "BuildItAttempt"("userId", "problemSlug", "stage");

ALTER TABLE "BuildItAttempt" ADD CONSTRAINT "BuildItAttempt_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
