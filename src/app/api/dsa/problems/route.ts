import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const [problems, filteredTotal, allStatuses, total] = await Promise.all([
    prisma.problem.findMany({
      where: filterWhere,
      select: {
        id: true, title: true, difficulty: true,
        pattern: true, mustDo: true, leetcodeUrl: true, gfgUrl: true, order: true, companies: true,
        statuses: { where: { userId }, select: { status: true, toRevise: true } },
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
