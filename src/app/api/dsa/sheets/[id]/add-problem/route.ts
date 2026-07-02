import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sheetId } = await params;
  const { problemId } = await req.json() as { problemId?: string };

  if (!problemId) return NextResponse.json({ error: "problemId is required" }, { status: 400 });

  // Verify the target sheet belongs to this user
  const targetSheet = await prisma.sheet.findFirst({
    where: { id: sheetId, userId: user.id, source: "CUSTOM" },
  });
  if (!targetSheet) return NextResponse.json({ error: "Sheet not found" }, { status: 404 });

  // Fetch the source problem
  const source = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!source) return NextResponse.json({ error: "Problem not found" }, { status: 404 });

  // Deduplicate by leetcodeUrl or title within the target sheet
  const existing = await prisma.problem.findFirst({
    where: {
      sheetId,
      OR: [
        ...(source.leetcodeUrl ? [{ leetcodeUrl: source.leetcodeUrl }] : []),
        { title: source.title },
      ],
    },
  });
  if (existing) return NextResponse.json({ error: "Problem already in sheet" }, { status: 409 });

  // Count current problems to set order
  const count = await prisma.problem.count({ where: { sheetId } });

  // Fetch source test cases before the transaction
  const sourceCases = await prisma.testCase.findMany({
    where: { problemId: source.id },
    select: { input: true, expectedOutput: true, isHidden: true },
  });

  const problem = await prisma.problem.create({
    data: {
      title: source.title,
      description: source.description,
      difficulty: source.difficulty,
      pattern: source.pattern,
      leetcodeUrl: source.leetcodeUrl,
      mustDo: source.mustDo,
      order: count + 1,
      sheetId,
      testCases: sourceCases.length > 0
        ? { createMany: { data: sourceCases } }
        : undefined,
    },
  });

  return NextResponse.json({ problem });
}
