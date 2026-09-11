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
    where: { id, userId },
  });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { messages } = await req.json() as { messages: IncomingMessage[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  // Written one row at a time, NOT with createMany: Prisma runs a multi-row
  // createMany inside an implicit transaction, and the Neon HTTP adapter this
  // app uses cannot open one — it threw "Transactions are not supported in HTTP
  // mode" and 500'd, which the client's fire-and-forget .catch() swallowed. The
  // visible symptom was a mentor conversation that always reloaded empty.
  //
  // createdAt is set explicitly rather than left to now(): the read side orders
  // by it, and two rows written in the same millisecond could otherwise come
  // back with the answer above the question.
  const startedAt = Date.now();
  for (const [i, m] of messages.entries()) {
    await prisma.chatMessage.create({
      data: {
        userId,
        conversationId: id,
        role: m.role,
        content: m.content,
        messageType: m.messageType ?? "text",
        sheetId: m.sheetId ?? null,
        sheetName: m.sheetName ?? null,
        problemCount: m.problemCount ?? null,
        rationale: m.rationale ?? null,
        createdAt: new Date(startedAt + i),
      },
    });
  }

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
