import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }


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
    ? { userId: userId, problemId }
    : { userId: userId, sdQuestionId: sdQuestionId! };

  const existing = await prisma.userNote.findFirst({ where, select: { id: true } });

  if (existing) {
    await prisma.userNote.update({ where: { id: existing.id }, data: { content } });
  } else {
    await prisma.userNote.create({
      data: { userId: userId, content, ...(problemId ? { problemId } : { sdQuestionId }) },
    });
  }

  return NextResponse.json({ success: true });
}
