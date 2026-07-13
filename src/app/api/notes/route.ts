import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }


  const { searchParams } = new URL(req.url);
  const sheetId = searchParams.get("sheetId");
  if (!sheetId) return NextResponse.json({ error: "sheetId required" }, { status: 400 });

  const notes = await prisma.userNote.findMany({
    where: {
      userId: userId,
      problem: { sheetId },
      problemId: { not: null },
    },
    select: { problemId: true, content: true },
  });

  const map: Record<string, string> = {};
  for (const n of notes) {
    if (n.problemId) map[n.problemId] = n.content;
  }

  return NextResponse.json(map);
}
