import type { CodeReviewExercise } from "./types";

export const healthEndpoint: CodeReviewExercise = {
  slug: "health-endpoint",
  title: "Add /healthz with build metadata",
  brief:
    "Platform wants every service to expose /healthz so the load balancer can drop unhealthy instances and oncall has one URL at 2am. " +
    "Returns build SHA, version, and uptime. Review the API design and what 'healthy' should actually mean.",
  language: "TypeScript",
  minutes: 8,
  files: [
    {
      name: "health.ts",
      code: `router.get("/healthz", async (req, res) => {
  const dbOk = await db.query("SELECT 1");
  const redisOk = await redis.ping();

  res.json({
    status: "ok",
    version: process.env.VERSION,
    sha: process.env.GIT_SHA,
    uptime: process.uptime(),
    db: dbOk ? "up" : "down",
    redis: redisOk ? "up" : "down",
    env: process.env,
  });
});`,
    },
  ],
  bugs: [
    {
      id: "leaks-env",
      severity: 5,
      category: "security",
      description:
        "`env: process.env` dumps the ENTIRE environment — including DATABASE_URL, API keys, secrets — in a public, unauthenticated health response. This is a critical credential leak. Never serialize process.env; return only the two build fields you meant to.",
    },
    {
      id: "liveness-vs-readiness",
      severity: 4,
      category: "correctness",
      description:
        "The load balancer's health check (liveness) should NOT depend on the DB/Redis being up. If the DB blips, every instance reports unhealthy and the LB pulls them ALL out — turning a dependency blip into a total outage. Liveness = 'the process is running'; dependency checks belong on a separate /readyz used for readiness, not for the LB's drop decision.",
    },
    {
      id: "status-always-ok",
      severity: 3,
      category: "correctness",
      description:
        "`status: \"ok\"` and HTTP 200 are returned unconditionally even when db or redis is \"down\". A health check must return a non-200 (503) when it considers itself unhealthy, or the LB/uptime check can never act on it.",
    },
    {
      id: "no-timeout",
      severity: 3,
      category: "correctness",
      description:
        "The DB and Redis checks have no timeout. If the DB hangs, the health check hangs, the LB's probe times out ambiguously, and the handler holds a connection. Dependency probes need a short timeout so an unhealthy dependency fails fast rather than hanging.",
    },
  ],
};
