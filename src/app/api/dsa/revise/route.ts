import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }


  const { problemId, toRevise } = await req.json() as { problemId?: string; toRevise?: boolean };

  if (!problemId || typeof problemId !== "string") {
    return NextResponse.json({ error: "Invalid problemId" }, { status: 400 });
  }

  await prisma.userProblemStatus.upsert({
    where: { userId_problemId: { userId, problemId } },
    create: { userId, problemId, toRevise: toRevise ?? true },
    update: { toRevise: toRevise ?? true },
  });

  return NextResponse.json({ success: true });
}
