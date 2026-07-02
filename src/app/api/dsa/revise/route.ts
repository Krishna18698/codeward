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

  const { problemId, toRevise } = await req.json() as { problemId?: string; toRevise?: boolean };

  if (!problemId || typeof problemId !== "string") {
    return NextResponse.json({ error: "Invalid problemId" }, { status: 400 });
  }

  await prisma.userProblemStatus.upsert({
    where: { userId_problemId: { userId: user.id, problemId } },
    create: { userId: user.id, problemId, toRevise: toRevise ?? true },
    update: { toRevise: toRevise ?? true },
  });

  return NextResponse.json({ success: true });
}
