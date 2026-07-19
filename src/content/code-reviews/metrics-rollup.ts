import type { CodeReviewExercise } from "./types";

export const metricsRollup: CodeReviewExercise = {
  slug: "metrics-rollup",
  title: "Add metrics rollup endpoint",
  brief:
    "Product wants a per-user daily activity view in the customer dashboard. This adds GET /metrics/users/:id/daily that aggregates 24-hour activity. " +
    "Review — customer-data endpoints have a different bar than internal analytics.",
  language: "TypeScript",
  minutes: 12,
  files: [
    {
      name: "metrics.ts",
      code: `router.get("/metrics/users/:id/daily", async (req, res) => {
  const events = await db.event.findMany({
    where: { userId: req.params.id },
  });

  const byDay: Record<string, number> = {};
  for (const e of events) {
    const day = e.createdAt.toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;
  }

  res.json(byDay);
});`,
    },
  ],
  bugs: [
    {
      id: "authz-customer-data",
      severity: 5,
      category: "security",
      description:
        "No authorization: any caller can read any user's activity metrics by id. Customer data must be scoped to the authenticated owner (or an authorized role) — check req.user against :id.",
    },
    {
      id: "unbounded-query",
      severity: 5,
      category: "performance",
      description:
        "findMany with only a userId filter loads that user's ENTIRE event history into memory — could be millions of rows — to compute a daily rollup. It must filter by the time window (last 24h / last N days) in the WHERE clause and ideally aggregate in the database (GROUP BY day) rather than in app memory.",
    },
    {
      id: "aggregate-in-app",
      severity: 3,
      category: "performance",
      description:
        "The per-day counting is done in application code after fetching all rows. A `GROUP BY date_trunc('day', createdAt)` returns only the aggregated buckets, moving the work to the DB and shipping kilobytes instead of megabytes.",
    },
    {
      id: "timezone-day-boundary",
      severity: 3,
      category: "correctness",
      description:
        "Days are bucketed by UTC date (`toISOString()`), but a customer-facing 'daily' view should use the user's timezone — otherwise the day boundary is wrong for most users and activity lands in the wrong day near midnight.",
    },
    {
      id: "no-empty-days",
      severity: 2,
      category: "api-design",
      description:
        "Days with zero events are simply absent from the response, so the client can't distinguish 'no activity' from 'missing data' and can't render a continuous chart. A daily series should include zero-count days across the requested range.",
    },
  ],
};
