import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sheetVisibleTo } from "@/lib/sheetAccess";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


  const { id: sheetId } = await params;
  const { problemId } = await req.json() as { problemId?: string };

  if (!problemId) return NextResponse.json({ error: "problemId is required" }, { status: 400 });

  // Verify the target sheet belongs to this user
  const targetSheet = await prisma.sheet.findFirst({
    where: { id: sheetId, userId, source: "CUSTOM" },
  });
  if (!targetSheet) return NextResponse.json({ error: "Sheet not found" }, { status: 404 });

  // The source must be on a sheet the caller can read — a preset, or their own.
  // Looking it up by id alone let anyone who knew the id of a problem on
  // someone else's custom sheet copy it into theirs. Missing and not-visible
  // answer the same, so a probe can't confirm the id exists.
  const source = await prisma.problem.findFirst({
    where: { id: problemId, sheet: sheetVisibleTo(userId) },
  });
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
      // These three were dropped, so a copied problem lost its GfG link, its
      // company tags and its hint.
      gfgUrl: source.gfgUrl,
      companies: source.companies,
      hint: source.hint,
      mustDo: source.mustDo,
      order: count + 1,
      sheetId,
    },
  });

  // Copied one at a time for the same reason as the mentor message writes: a
  // nested createMany makes Prisma open an implicit transaction, which the Neon
  // HTTP adapter cannot do, so this route 500'd for any source problem that had
  // test cases.
  for (const c of sourceCases) {
    await prisma.testCase.create({ data: { ...c, problemId: problem.id } });
  }

  return NextResponse.json({ problem });
}
