import type { BugHuntExercise, BugHuntMeta } from "./types";
import { doubleChargeRace } from "./double-charge-race";
import { slowProfileEndpoint } from "./slow-profile-endpoint";
import { connectionPoolExhaustion } from "./connection-pool-exhaustion";
import { deadlockInventory } from "./deadlock-inventory";
import { cacheStampedeOutage } from "./cache-stampede-outage";
import { lostUpdateBalance } from "./lost-update-balance";
import { timezoneExpiryBug } from "./timezone-expiry-bug";
import { memoryLeakListeners } from "./memory-leak-listeners";
import { retryStormWebhook } from "./retry-storm-webhook";

export type { BugHuntMeta } from "./types";

/** Full exercises including ground truth (root cause + fix). Never import this
 *  array from a page/component — use the meta accessors. Only the grading route
 *  reads the ground truth, via getBugHuntWithSolution. */
const EXERCISES: BugHuntExercise[] = [
  doubleChargeRace,
  slowProfileEndpoint,
  connectionPoolExhaustion,
  deadlockInventory,
  cacheStampedeOutage,
  lostUpdateBalance,
  timezoneExpiryBug,
  memoryLeakListeners,
  retryStormWebhook,
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

/** Client-safe catalog — no ground truth. All playable. */
export const BUG_HUNTS_META: BugHuntMeta[] = EXERCISES.map(toMeta);

export function getBugHuntMeta(slug: string): BugHuntMeta | undefined {
  const ex = EXERCISES.find((e) => e.slug === slug);
  return ex ? toMeta(ex) : undefined;
}

/** Ground truth accessor — grading route ONLY. */
export function getBugHuntWithSolution(slug: string): BugHuntExercise | undefined {
  return EXERCISES.find((e) => e.slug === slug);
}
