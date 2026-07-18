import type { BugHuntExercise, BugHuntMeta } from "./types";
import { doubleChargeRace } from "./double-charge-race";
import { slowProfileEndpoint } from "./slow-profile-endpoint";
import { connectionPoolExhaustion } from "./connection-pool-exhaustion";

export type { BugHuntMeta } from "./types";

/** Full exercises including ground truth (root cause + fix). Never import this
 *  array from a page/component — use the meta accessors. Only the grading route
 *  reads the ground truth, via getBugHuntWithSolution. */
const EXERCISES: BugHuntExercise[] = [
  doubleChargeRace,
  slowProfileEndpoint,
  connectionPoolExhaustion,
];

function toMeta(e: BugHuntExercise): BugHuntMeta {
  return {
    slug: e.slug,
    title: e.title,
    brief: e.brief,
    language: e.language,
    minutes: e.minutes,
    category: e.category,
    files: e.files,
    testOutput: e.testOutput,
    logs: e.logs,
  };
}

// Coming soon — titles/briefs visible in the catalog, not yet playable.
const COMING_SOON: BugHuntMeta[] = [
  { slug: "deadlock-inventory",    title: "Two orders deadlock updating inventory",           brief: "Concurrent orders touching the same two SKUs occasionally hang until one is killed by the DB's deadlock detector. Find the lock-ordering bug.",                     language: "TypeScript", minutes: 14, category: "concurrency",   locked: true },
  { slug: "cache-stampede-outage", title: "Cache expiry takes down the pricing service",       brief: "Every hour on the hour, pricing latency spikes and the DB CPU pins to 100% for 30 seconds. The cache TTL is 1 hour. Find why expiry causes an outage.",             language: "TypeScript", minutes: 12, category: "performance",   locked: true },
  { slug: "lost-update-balance",   title: "Wallet balance drifts under concurrent writes",     brief: "Two simultaneous deposits sometimes leave the balance short by one deposit. The read-modify-write looks correct. Find the lost update.",                          language: "TypeScript", minutes: 13, category: "concurrency",   locked: true },
  { slug: "timezone-expiry-bug",   title: "Coupons expire a day early for some users",         brief: "Support gets tickets that valid coupons are rejected — but only from users in certain regions, and only near midnight. Find the date bug.",                        language: "TypeScript", minutes: 10, category: "correctness",   locked: true },
  { slug: "memory-leak-listeners", title: "Worker memory grows until OOM",                     brief: "A background worker's RSS climbs steadily over hours until the OOM killer takes it. Heap dumps show growing listener counts. Find the leak.",                       language: "TypeScript", minutes: 13, category: "resource-leak", locked: true },
  { slug: "retry-storm-webhook",   title: "A downstream blip becomes a self-inflicted outage", brief: "When the webhook target is briefly slow, the retry logic turns a 2-second blip into a 20-minute outage. Find why retries amplify the problem.",                    language: "TypeScript", minutes: 12, category: "correctness",   locked: true },
];

/** Client-safe catalog — playable (no ground truth) + coming-soon. */
export const BUG_HUNTS_META: BugHuntMeta[] = [...EXERCISES.map(toMeta), ...COMING_SOON];

export function getBugHuntMeta(slug: string): BugHuntMeta | undefined {
  const ex = EXERCISES.find((e) => e.slug === slug);
  return ex ? toMeta(ex) : undefined;
}

/** Ground truth accessor — grading route ONLY. */
export function getBugHuntWithSolution(slug: string): BugHuntExercise | undefined {
  return EXERCISES.find((e) => e.slug === slug);
}
