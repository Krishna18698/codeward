import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Records that the user revealed a problem's hint. "Needed a hint" is
// auto-tracked (per the DSA legend): revealing the hint sets the flag; there
// is no way to un-need it, so this only ever writes true. Idempotent.
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { problemId } = await req.json() as { problemId?: string };

  if (!problemId || typeof problemId !== "string") {
    return NextResponse.json({ error: "Invalid problemId" }, { status: 400 });
  }

  await prisma.userProblemStatus.upsert({
    where: { userId_problemId: { userId, problemId } },
    create: { userId, problemId, usedHint: true },
    update: { usedHint: true },
  });

  return NextResponse.json({ success: true });
}
