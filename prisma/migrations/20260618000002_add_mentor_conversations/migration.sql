CREATE TABLE "MentorConversation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL DEFAULT 'New conversation',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MentorConversation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MentorConversation" ADD CONSTRAINT "MentorConversation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "conversationId" TEXT;
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "messageType" TEXT NOT NULL DEFAULT 'text';
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "sheetId" TEXT;
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "sheetName" TEXT;
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "problemCount" INTEGER;
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "rationale" TEXT;

ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "MentorConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
