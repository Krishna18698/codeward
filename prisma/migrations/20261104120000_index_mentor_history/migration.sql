-- Index the mentor's history reads.
--
-- Measured before writing this (EXPLAIN ANALYZE against the live database):
-- with 4 conversations and 58 messages, every one of these is a sequential
-- scan that finishes in well under a millisecond, and the planner would keep
-- choosing the scan at that size. So this buys nothing today. It is here
-- because each scan reads every user's rows to find one user's: the cost grows
-- with total usage, not with the caller's own history.
--
--   conversation list   WHERE "userId" = $1 ORDER BY "updatedAt" DESC LIMIT 50
--   a thread            WHERE "conversationId" = $1 ORDER BY "createdAt"
--   chat history        WHERE "userId" = $1 AND "conversationId" = $2
--                       ORDER BY "createdAt" DESC LIMIT 12
--
-- Additive only: no column, type or constraint changes, so it is safe in
-- either order relative to a code deploy.

-- CreateIndex
CREATE INDEX "MentorConversation_userId_updatedAt_idx" ON "MentorConversation"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt");
