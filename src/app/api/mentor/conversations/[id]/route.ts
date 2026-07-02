import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

async function getAuthedConversation(id: string, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const conv = await prisma.mentorConversation.findFirst({
    where: { id, userId: user.id },
  });
  return conv ? { conv, user } : null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getAuthedConversation(id, session.user.email);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

  return NextResponse.json({ id: result.conv.id, title: result.conv.title, messages });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getAuthedConversation(id, session.user.email);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.mentorConversation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
