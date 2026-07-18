import type { BugHuntExercise } from "./types";

export const connectionPoolExhaustion: BugHuntExercise = {
  slug: "connection-pool-exhaustion",
  title: "Intermittent 500s that clear after a restart",
  brief:
    "Under sustained traffic the service starts returning 500s after ~20 minutes. A restart fixes it — for another 20 minutes. " +
    "The error rate climbs steadily rather than spiking. Find the root cause.",
  language: "TypeScript",
  minutes: 13,
  files: [
    {
      name: "report-handler.ts",
      code: `export async function generateReport(req: Request, res: Response) {
  const conn = await pool.acquire();

  const rows = await conn.query(
    "SELECT * FROM events WHERE account_id = $1",
    [req.params.accountId],
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: "no events" });
  }

  const report = buildReport(rows);
  await conn.release();
  return res.json(report);
}`,
    },
  ],
  testOutput: "",
  logs: `10:02:14  INFO  pool: 3/20 connections in use
10:11:47  INFO  pool: 11/20 connections in use
10:18:22  WARN  pool: 19/20 connections in use
10:20:05  ERROR pool: timeout acquiring connection after 5000ms
10:20:05  ERROR GET /accounts/88/report → 500
10:20:06  ERROR pool: timeout acquiring connection after 5000ms
10:20:41  ERROR 47 requests failed: pool exhausted`,
  rootCause:
    "A connection leak on the 404 path. The handler acquires a connection, but when `rows.length === 0` it returns early WITHOUT calling `conn.release()`. Every request that finds no events leaks one connection permanently. The pool (20 connections) drains slowly as 404s accumulate — matching the steady climb over ~20 minutes — until it's exhausted and every acquire times out. A restart resets the pool, which is why it temporarily fixes it.",
  category: "resource-leak",
  ruledOut: [
    "The database is overloaded — no, the DB is fine; the app can't get a connection because it's leaking them, not because the DB is slow.",
    "Traffic is too high for a 20-connection pool — the leak means connections are never returned; even low traffic would eventually exhaust the pool. Raising the pool size only delays the failure.",
    "A slow query holds connections open — the queries are fast; connections are held forever on the 404 path, not held long by slow work.",
  ],
  canonicalFix:
    "Guarantee release on every exit path. Wrap the body in `try { ... } finally { await conn.release(); }` so the connection returns whether the handler succeeds, 404s, or throws. (Better still, use a pool helper that acquires, runs a callback, and releases automatically so individual handlers can't forget.)",
};
