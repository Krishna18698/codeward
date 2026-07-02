import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import type { Difficulty, ProblemPattern } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q              = searchParams.get("q")?.trim() ?? "";
  const difficulty     = searchParams.get("difficulty") as Difficulty | "ALL" | null;
  const pattern        = searchParams.get("pattern") as ProblemPattern | "ALL" | null;
  const mustDo         = searchParams.get("mustDo");
  const company        = searchParams.get("company");
  const excludeSheetId = searchParams.get("excludeSheetId");

  // Build exclusion sets from the target sheet
  const excludeTitles = new Set<string>();
  const excludeUrls   = new Set<string>();
  if (excludeSheetId) {
    const existing = await prisma.problem.findMany({
      where: { sheetId: excludeSheetId },
      select: { title: true, leetcodeUrl: true },
    });
    for (const p of existing) {
      excludeTitles.add(p.title.toLowerCase());
      if (p.leetcodeUrl) excludeUrls.add(p.leetcodeUrl);
    }
  }

  const problems = await prisma.problem.findMany({
    where: {
      sheet: { isPreset: true },
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
      ...(difficulty && difficulty !== "ALL" ? { difficulty } : {}),
      ...(pattern && pattern !== "ALL" ? { pattern } : {}),
      ...(mustDo === "true" ? { mustDo: true } : {}),
      ...(company && company !== "ALL" ? { companies: { has: company } } : {}),
    },
    select: {
      id: true, title: true, difficulty: true, pattern: true,
      mustDo: true, leetcodeUrl: true, order: true,
      sheet: { select: { name: true, source: true } },
    },
    // mustDo first so dedup keeps the best entry
    orderBy: [{ mustDo: "desc" }, { order: "asc" }],
    take: 500,
  });

  // Deduplicate: one entry per unique leetcodeUrl (or title if no URL)
  const seenUrls   = new Set<string>();
  const seenTitles = new Set<string>();
  const deduped = problems.filter((p) => {
    const key = p.leetcodeUrl ?? null;
    const titleKey = p.title.toLowerCase();

    // Exclude problems already in the target sheet
    if (excludeTitles.has(titleKey)) return false;
    if (key && excludeUrls.has(key)) return false;

    // Deduplicate across sheets — prefer earliest (mustDo first)
    if (key) {
      if (seenUrls.has(key)) return false;
      seenUrls.add(key);
    } else {
      if (seenTitles.has(titleKey)) return false;
      seenTitles.add(titleKey);
    }
    return true;
  });

  return NextResponse.json({
    problems: deduped.slice(0, 80).map((p) => ({
      id: p.id, title: p.title, difficulty: p.difficulty,
      pattern: p.pattern, mustDo: p.mustDo, leetcodeUrl: p.leetcodeUrl,
      order: p.order, sheetName: p.sheet.name,
    })),
  });
}
