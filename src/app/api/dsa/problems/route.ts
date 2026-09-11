import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canReadSheet } from "@/lib/sheetAccess";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


  const { searchParams } = new URL(req.url);
  const sheetId    = searchParams.get("sheetId");
  const skip       = parseInt(searchParams.get("skip") ?? "0");
  const take       = parseInt(searchParams.get("take") ?? "30");
  const difficulty = searchParams.get("difficulty");
  const company    = searchParams.get("company");

  if (!sheetId) return NextResponse.json({ error: "sheetId required" }, { status: 400 });

  const filterWhere = {
    sheetId,
    ...(difficulty ? { difficulty: difficulty as import("@prisma/client").Difficulty } : {}),
    ...(company    ? { companies: { has: company } } : {}),
  };

  // Runs alongside the data queries rather than before them: the check has to
  // pass before anything is returned, but it's an indexed primary-key lookup
  // and this is the sheet's main load path, so it shouldn't cost a round trip.
  const [canRead, problems, filteredTotal, allStatuses, total] = await Promise.all([
    canReadSheet(sheetId, userId),
    prisma.problem.findMany({
      where: filterWhere,
      select: {
        id: true, title: true, difficulty: true,
        pattern: true, mustDo: true, leetcodeUrl: true, gfgUrl: true, order: true, companies: true, hint: true,
        statuses: { where: { userId }, select: { status: true, toRevise: true, usedHint: true } },
      },
      orderBy: [{ mustDo: "desc" }, { order: "asc" }],
      skip,
      take,
    }),
    prisma.problem.count({ where: filterWhere }),
    // Full-sheet statuses only on first page (for progress bar)
    skip === 0
      ? prisma.userProblemStatus.findMany({
          where: { userId, problem: { sheetId } },
          select: { status: true },
        })
      : Promise.resolve(null),
    // Unfiltered total (for SheetContent stats bar)
    (difficulty || company)
      ? prisma.problem.count({ where: { sheetId } })
      : Promise.resolve(undefined as number | undefined),
  ]);

  // 404, not 403: a sheet the caller may not read is indistinguishable from
  // one that doesn't exist.
  if (!canRead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const doneCount    = allStatuses ? allStatuses.filter((s) => s.status === "DONE").length    : null;
  const solvingCount = allStatuses ? allStatuses.filter((s) => s.status === "SOLVING").length : null;

  return NextResponse.json({
    problems,
    total: total ?? filteredTotal,
    filteredTotal,
    skip, take,
    doneCount, solvingCount,
  });
}
