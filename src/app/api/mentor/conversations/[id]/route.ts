import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getAuthedConversation(id: string, userId: string) {
  return prisma.mentorConversation.findFirst({
    where: { id, userId },
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conv = await getAuthedConversation(id, userId);
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      messageType: true,
      sheetId: true,
      sheetName: true,
      problemCount: true,
      rationale: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ id: conv.id, title: conv.title, messages });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conv = await getAuthedConversation(id, userId);
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.mentorConversation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
