CREATE TABLE "BugHuntAttempt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "exerciseSlug" TEXT NOT NULL,
  "diagnosis" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "rootCaught" BOOLEAN NOT NULL,
  "fixReasonable" BOOLEAN NOT NULL,
  "feedback" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BugHuntAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BugHuntAttempt_userId_exerciseSlug_idx"
  ON "BugHuntAttempt"("userId", "exerciseSlug");

ALTER TABLE "BugHuntAttempt" ADD CONSTRAINT "BugHuntAttempt_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
