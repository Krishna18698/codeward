import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { problemId, sdQuestionId, content } = await req.json() as {
    problemId?: string;
    sdQuestionId?: string;
    content: string;
  };

  if (!problemId && !sdQuestionId) {
    return NextResponse.json({ error: "problemId or sdQuestionId required" }, { status: 400 });
  }
  if (typeof content !== "string" || content.length > 50_000) {
    return NextResponse.json({ error: "Content too large" }, { status: 400 });
  }

  const where = problemId
    ? { userId: user.id, problemId }
    : { userId: user.id, sdQuestionId: sdQuestionId! };

  const existing = await prisma.userNote.findFirst({ where, select: { id: true } });

  if (existing) {
    await prisma.userNote.update({ where: { id: existing.id }, data: { content } });
  } else {
    await prisma.userNote.create({
      data: { userId: user.id, content, ...(problemId ? { problemId } : { sdQuestionId }) },
    });
  }

  return NextResponse.json({ success: true });
}
