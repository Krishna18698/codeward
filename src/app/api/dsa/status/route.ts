import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ProblemStatus } from "@prisma/client";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }


  const { problemId, status } = await req.json() as { problemId?: string; status?: string };

  const VALID_STATUSES: ProblemStatus[] = ["TODO", "SOLVING", "DONE"];
  if (!problemId || typeof problemId !== "string") {
    return NextResponse.json({ error: "Invalid problemId" }, { status: 400 });
  }
  if (!status || !VALID_STATUSES.includes(status as ProblemStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const validStatus = status as ProblemStatus;
  await prisma.userProblemStatus.upsert({
    where: { userId_problemId: { userId: userId, problemId } },
    create: { userId: userId, problemId, status: validStatus },
    update: { status: validStatus },
  });

  return NextResponse.json({ success: true });
}
