import { prisma } from "@/lib/prisma";

export type ActivityData = {
  /** "YYYY-MM-DD" -> number of things done that day. */
  byDay: Record<string, number>;
  total: number;
  /** Consecutive days with activity, counting back from today. */
  streak: number;
};

/** Local-date key, so a day boundary matches what the user experienced. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Activity for the heatmap, unioned from every append-only source.
 *
 *  DSA solves come from ActivityEvent (nothing else records them — see the
 *  model's comment). The three practice modes already have append-only attempt
 *  rows with their own createdAt, so they're read directly rather than being
 *  double-written into ActivityEvent. */
export async function getActivity(userId: string, days = 182): Promise<ActivityData> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const window = { userId, createdAt: { gte: since } };
  const pick = { select: { createdAt: true } } as const;

  const [solves, reviews, bugs, builds] = await Promise.all([
    // Guarded: a deploy can land before `migrate deploy` has been run, and a
    // missing table must degrade to "no solve history" rather than 500 the
    // whole dashboard. Remove the guard once the migration is everywhere.
    prisma.activityEvent
      .findMany({ where: window, ...pick })
      .catch(() => [] as { createdAt: Date }[]),
    prisma.reviewAttempt.findMany({ where: window, ...pick }),
    prisma.bugHuntAttempt.findMany({ where: window, ...pick }),
    prisma.buildItAttempt.findMany({ where: window, ...pick }),
  ]);

  // Prisma's groupBy can't group by a derived day expression, so bucket in JS —
  // trivial at this row count and it keeps the day boundary in local time.
  const byDay: Record<string, number> = {};
  let total = 0;
  for (const row of [...solves, ...reviews, ...bugs, ...builds]) {
    const k = dayKey(row.createdAt);
    byDay[k] = (byDay[k] ?? 0) + 1;
    total++;
  }

  // Streak: today counts if there's activity, otherwise start from yesterday so
  // a day that isn't over yet doesn't break an otherwise-live streak.
  let streak = 0;
  const cursor = new Date();
  if (!byDay[dayKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
  while (byDay[dayKey(cursor)]) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { byDay, total, streak };
}
