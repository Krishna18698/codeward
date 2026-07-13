import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type IncomingMessage = {
  role: "USER" | "ASSISTANT";
  content: string;
  messageType?: string;
  sheetId?: string;
  sheetName?: string;
  problemCount?: number;
  rationale?: string;
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


  const { id } = await params;

  const conv = await prisma.mentorConversation.findFirst({
    where: { id, userId: userId },
  });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { messages } = await req.json() as { messages: IncomingMessage[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  // Save all messages
  await prisma.chatMessage.createMany({
    data: messages.map((m) => ({
      userId: userId,
      conversationId: id,
      role: m.role,
      content: m.content,
      messageType: m.messageType ?? "text",
      sheetId: m.sheetId ?? null,
      sheetName: m.sheetName ?? null,
      problemCount: m.problemCount ?? null,
      rationale: m.rationale ?? null,
    })),
  });

  // Auto-title from first user message if still default
  const firstUserMsg = messages.find((m) => m.role === "USER");
  const needsTitle = conv.title === "New conversation" && firstUserMsg;

  await prisma.mentorConversation.update({
    where: { id },
    data: {
      updatedAt: new Date(),
      ...(needsTitle ? { title: firstUserMsg.content.slice(0, 60) } : {}),
    },
  });

  return NextResponse.json({ success: true });
}
