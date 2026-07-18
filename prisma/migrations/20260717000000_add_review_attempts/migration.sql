CREATE TABLE "ReviewAttempt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "exerciseSlug" TEXT NOT NULL,
  "comments" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "caught" JSONB NOT NULL,
  "missed" JSONB NOT NULL,
  "feedback" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReviewAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReviewAttempt_userId_exerciseSlug_idx"
  ON "ReviewAttempt"("userId", "exerciseSlug");

ALTER TABLE "ReviewAttempt" ADD CONSTRAINT "ReviewAttempt_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
