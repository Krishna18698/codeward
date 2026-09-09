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

  // Read the prior status so the activity log records a SOLVE only on the
  // transition into DONE — re-toggling the same problem must not inflate the
  // heatmap, and un-solving must not log anything.
  const existing = await prisma.userProblemStatus.findUnique({
    where: { userId_problemId: { userId, problemId } },
    select: { status: true },
  });

  await prisma.userProblemStatus.upsert({
    where: { userId_problemId: { userId, problemId } },
    create: { userId, problemId, status: validStatus },
    update: { status: validStatus },
  });

  if (validStatus === "DONE" && existing?.status !== "DONE") {
    // Best-effort: the heatmap is not worth failing a solve over, and a deploy
    // can land before the ActivityEvent migration has been applied.
    await prisma.activityEvent
      .create({ data: { userId, type: "DSA_SOLVE" } })
      .catch(() => {});
  }

  return NextResponse.json({ success: true });
}
