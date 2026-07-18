import type { CodeReviewExercise, ExerciseMeta } from "./types";
import { idempotencyMiddleware } from "./idempotency-middleware";
import { jwtAuthMiddleware } from "./jwt-auth-middleware";
import { cacheLayer } from "./cache-layer";

export type { ExerciseMeta, PlantedBug } from "./types";

/** Full exercises including ground truth. Do NOT import this array from any
 *  page/component — use the meta accessors below. The grading API route is
 *  the only consumer of the bug lists (via getExerciseWithBugs). */
const EXERCISES: CodeReviewExercise[] = [
  idempotencyMiddleware,
  jwtAuthMiddleware,
  cacheLayer,
];

function toMeta({ bugs, ...rest }: CodeReviewExercise): ExerciseMeta {
  return { ...rest, bugCount: bugs.length };
}

/** Client-safe catalog — no bug descriptions, just the count. */
export const CODE_REVIEWS_META: ExerciseMeta[] = EXERCISES.map(toMeta);

export function getExerciseMeta(slug: string): ExerciseMeta | undefined {
  const ex = EXERCISES.find((e) => e.slug === slug);
  return ex ? toMeta(ex) : undefined;
}

/** Ground truth accessor — grading route ONLY. */
export function getExerciseWithBugs(slug: string): CodeReviewExercise | undefined {
  return EXERCISES.find((e) => e.slug === slug);
}
