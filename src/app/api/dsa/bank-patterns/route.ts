import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Difficulty } from "@prisma/client";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q          = searchParams.get("q")?.trim() ?? "";
  const difficulty = searchParams.get("difficulty");
  const mustDo     = searchParams.get("mustDo");
  const company    = searchParams.get("company");

  const where = {
    sheet: { source: "TOP300" as const, isPreset: true },
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
    ...(difficulty && difficulty !== "ALL" ? { difficulty: difficulty as Difficulty } : {}),
    ...(mustDo === "true" ? { mustDo: true } : {}),
    ...(company ? { companies: { has: company } } : {}),
  };

  const grouped = await prisma.problem.groupBy({
    by: ["pattern"],
    where,
    _count: { id: true },
    orderBy: { pattern: "asc" },
  });

  return NextResponse.json({
    patterns: grouped.map((g) => ({ pattern: g.pattern as string, total: g._count.id })),
  });
}
