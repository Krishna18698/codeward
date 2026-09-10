import { prisma } from "@/lib/prisma";
import type { Difficulty } from "@prisma/client";

export type TrackedProgress = {
  /** Distinct problems across every preset sheet. */
  total: number;
  /** Distinct problems where at least one sheet's copy is solved. */
  done: number;
  pct: number;
  byDiff: Record<Difficulty, { done: number; total: number }>;
};

/** Progress over DISTINCT problems, not problem rows.
 *
 *  Each sheet owns its own `Problem` rows, so the same problem exists several
 *  times over: "Climbing Stairs" is a row in Blind 75 AND in NeetCode 150, each
 *  with its own `UserProblemStatus`. Summing sheet sizes therefore counted 86
 *  problems twice and produced a denominator (275) that was literally
 *  unreachable — you could only hit it by solving the same problem twice.
 *
 *  Deduping by title gives the honest measure: how much of the curated material
 *  have you actually covered. A title counts as done if any copy is done, so
 *  solving it once is enough.
 *
 *  Per-sheet progress deliberately stays per-row — inside Blind 75 you want to
 *  see Blind 75's own rows, not a cross-sheet union.
 */
export async function getTrackedProgress(userId: string): Promise<TrackedProgress> {
  const [problems, doneRows] = await Promise.all([
    prisma.problem.findMany({
      where: { sheet: { isPreset: true } },
      select: { id: true, title: true, difficulty: true },
    }),
    prisma.userProblemStatus.findMany({
      where: { userId, status: "DONE" },
      select: { problemId: true },
    }),
  ]);

  const doneIds = new Set(doneRows.map((d) => d.problemId));

  // title -> { difficulty of the first copy seen, done if ANY copy is done }
  const byTitle = new Map<string, { difficulty: Difficulty; done: boolean }>();
  for (const p of problems) {
    const existing = byTitle.get(p.title);
    const isDone = doneIds.has(p.id);
    if (!existing) byTitle.set(p.title, { difficulty: p.difficulty, done: isDone });
    else if (isDone) existing.done = true;
  }

  const byDiff = {
    EASY:   { done: 0, total: 0 },
    MEDIUM: { done: 0, total: 0 },
    HARD:   { done: 0, total: 0 },
  } as Record<Difficulty, { done: number; total: number }>;

  let done = 0;
  for (const entry of byTitle.values()) {
    const bucket = byDiff[entry.difficulty];
    if (bucket) {
      bucket.total++;
      if (entry.done) bucket.done++;
    }
    if (entry.done) done++;
  }

  const total = byTitle.size;
  return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0, byDiff };
}
