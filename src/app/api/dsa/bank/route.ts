import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Difficulty, ProblemPattern } from "@prisma/client";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q          = searchParams.get("q")?.trim() ?? "";
  const difficulty = searchParams.get("difficulty") as Difficulty | "ALL" | null;
  const pattern    = searchParams.get("pattern") as ProblemPattern | "ALL" | null;
  const mustDo     = searchParams.get("mustDo");
  const company    = searchParams.get("company");

  const problems = await prisma.problem.findMany({
    where: {
      sheet: { source: "TOP300", isPreset: true },
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
      ...(difficulty && difficulty !== "ALL" ? { difficulty } : {}),
      ...(pattern && pattern !== "ALL" ? { pattern } : {}),
      ...(mustDo === "true" ? { mustDo: true } : {}),
      ...(company ? { companies: { has: company } } : {}),
    },
    select: {
      id: true, title: true, difficulty: true, pattern: true,
      mustDo: true, leetcodeUrl: true, gfgUrl: true, order: true, companies: true,
    },
    orderBy: [{ mustDo: "desc" }, { order: "asc" }],
  });

  return NextResponse.json({ problems });
}
