import type { BuildItProblem, BuildItProblemMeta, BuildItStage } from "./types";
import { threadSafeWallet } from "./thread-safe-wallet";
import { inventoryReservationService } from "./inventory-reservation-service";
import { durableBackgroundJobQueue } from "./durable-background-job-queue";
import { idempotentPaymentProcessor } from "./idempotent-payment-processor";
import { notificationDeliveryService } from "./notification-delivery-service";

export type { BuildItProblemMeta, BuildItStageMeta, BuildItSkeleton } from "./types";
export type { BuildItLanguage } from "./languages";
export { BUILD_IT_LANGUAGES } from "./languages";

/** Full problems including ground truth (rubric, canonical approach, pitfalls).
 *  Never import this from a page/component — use the meta accessors. Only the
 *  grading route may import getBuildItStageWithSolution. */
const PROBLEMS: BuildItProblem[] = [
  threadSafeWallet,
  inventoryReservationService,
  durableBackgroundJobQueue,
  idempotentPaymentProcessor,
  notificationDeliveryService,
];

function toStageMeta(s: BuildItStage) {
  return {
    stage: s.stage,
    title: s.title,
    constraintAdded: s.constraintAdded,
    narrative: s.narrative,
    prompt: s.prompt,
    invariant: s.invariant,
    skeletons: s.skeletons,
    tests: s.tests, // visible to the candidate (read-only Tests tab), like example tests
  };
}

function toMeta(p: BuildItProblem): BuildItProblemMeta {
  return { ...p, stages: p.stages.map(toStageMeta) };
}

/** Client-safe catalog — no rubric/canonical answer/pitfalls at any stage. All 5 fully free. */
export const BUILD_IT_META: BuildItProblemMeta[] = PROBLEMS.map(toMeta);

export function getBuildItMeta(slug: string): BuildItProblemMeta | undefined {
  const p = PROBLEMS.find((p) => p.slug === slug);
  return p ? toMeta(p) : undefined;
}

/** Ground truth accessor — grading route ONLY. */
export function getBuildItStageWithSolution(slug: string, stage: number): BuildItStage | undefined {
  return PROBLEMS.find((p) => p.slug === slug)?.stages.find((s) => s.stage === stage);
}
