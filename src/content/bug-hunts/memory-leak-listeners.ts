import type { BugHuntExercise } from "./types";

export const memoryLeakListeners: BugHuntExercise = {
  slug: "memory-leak-listeners",
  title: "Worker memory grows until OOM",
  brief:
    "A background worker's memory climbs steadily over hours until the OOM killer takes it; a restart resets the clock. " +
    "Heap dumps show the listener count on one emitter growing without bound. Find the leak.",
  language: "TypeScript",
  minutes: 13,
  files: [
    {
      name: "job-worker.ts",
      code: `export async function processJob(job: Job) {
  const conn = getSharedConnection(); // long-lived, shared across all jobs

  // Watch for the connection dropping while we work
  conn.on("error", () => {
    logger.warn(\`connection error during job \${job.id}\`);
    metrics.increment("job.connection_error");
  });

  const result = await doWork(job, conn);
  await saveResult(job.id, result);
  return result;
}`,
    },
  ],
  testOutput: `=== RUN   TestListenerGrowth
    processed 10,000 jobs on the shared connection
--- FAIL: listener leak (11.3s)
    conn.listenerCount("error") = 10000
    warning: possible EventEmitter memory leak detected.
             10001 error listeners added. Use emitter.setMaxListeners()
    heap: retained closures capturing job scope: 10000`,
  rootCause:
    "Every job attaches a new `error` listener to the shared, long-lived connection and never removes it. Because the connection outlives the job, the listeners accumulate — one per job forever — and each closure retains the `job` object it captured, so both the listener array and the captured job scopes leak. Memory grows linearly with jobs processed until OOM; a restart drops the accumulated listeners, which is why it temporarily fixes it.",
  category: "resource-leak",
  ruledOut: [
    "doWork leaks memory — no; the heap dump points at retained error-listener closures on the connection, not at work state.",
    "The connection should be recreated per job — that would avoid the leak but defeats the point of a shared pooled connection; the fix is to remove the listener, not to stop sharing.",
    "setMaxListeners is too low — raising the limit only silences the warning; the listeners still accumulate unbounded and still OOM. It hides the leak, it doesn't fix it.",
  ],
  canonicalFix:
    "Remove the listener when the job finishes so it doesn't outlive the job on the shared emitter. Use `conn.once('error', handler)` only if a single fire is acceptable, or capture the handler and `conn.off('error', handler)` in a `finally` block. Better: attach the error handler once when the connection is created (it's connection-scoped, not job-scoped) and correlate the current job through context, rather than adding a per-job listener at all.",
};
