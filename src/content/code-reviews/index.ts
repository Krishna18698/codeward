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

// Coming soon — titles/briefs visible in the catalog, not yet playable.
const COMING_SOON: ExerciseMeta[] = [
  { slug: "refund-flow-ledger",     title: "Refactor refund flow to use ledger entries",     brief: "Finance flagged monthly reconciliation drift since refunds went live. This writes a reversing ledger entry after a successful PSP call so the books match.",                     language: "TypeScript", minutes: 12, bugCount: 6, locked: true },
  { slug: "partial-refund-endpoint",title: "Add partial-refund endpoint",                    brief: "Support processes partial refunds manually through the PSP dashboard — slow, error-prone, no audit trail. Exposes POST /charges/:id/refunds for the support tool.",              language: "TypeScript", minutes: 12, bugCount: 6, locked: true },
  { slug: "user-profile-patch",     title: "Add user profile update endpoint",               brief: "Mobile needs partial profile edits without re-sending the whole object. Adds PATCH /users/:id — where every team eventually ships a regression.",                                 language: "TypeScript", minutes: 10, bugCount: 5, locked: true },
  { slug: "metrics-rollup",         title: "Add metrics rollup endpoint",                    brief: "Product wants a per-user daily activity view. Aggregates 24h of activity from a few queries — customer-data endpoints have a different bar than internal analytics.",              language: "TypeScript", minutes: 12, bugCount: 6, locked: true },
  { slug: "health-endpoint",        title: "Add /healthz with build metadata",               brief: "A stable target for the load balancer and uptime checks. Returns build SHA, version, and uptime — review the API design and header choices.",                                       language: "TypeScript", minutes: 8,  bugCount: 4, locked: true },
  { slug: "webhook-subscription",   title: "Add webhook subscription endpoint",              brief: "Customers POST a URL and we fire callbacks on order events. Includes the test-ping that fires on creation so they can verify their endpoint received it.",                          language: "TypeScript", minutes: 14, bugCount: 6, locked: true },
  { slug: "orders-listing-v2",      title: "Add v2 orders listing endpoint",                 brief: "v1's response shape was painful to evolve. Locking in v2 with cleaner field names before adding features — once-over before partner docs go out.",                                 language: "TypeScript", minutes: 13, bugCount: 6, locked: true },
  { slug: "identity-service-lookup",title: "Refactor user lookup to the identity service",   brief: "The auth team's client is finally stable. Moving login lookup over so we can delete our own user-lifecycle bookkeeping (active / banned / soft-deleted).",                          language: "TypeScript", minutes: 14, bugCount: 6, locked: true },
  { slug: "recent-orders",          title: "Add recent-orders to the profile page",          brief: "The profile page wants a 'recent orders' section — last 10 orders with line items and product info. Wired to the existing repos.",                                                 language: "TypeScript", minutes: 12, bugCount: 3, locked: true },
  { slug: "kafka-order-processor",  title: "Migrate order processor to Kafka",               brief: "Black Friday broke the polling-based processor — 40 min behind, delayed confirmation emails. Replaces the poller with a Kafka consumer for horizontal scale + backpressure.",       language: "TypeScript", minutes: 14, bugCount: 6, locked: true },
  { slug: "structured-logging",     title: "Add structured logging + metrics to the processor", brief: "Basic instrumentation — logs around each stage and a throughput counter. Using the team's logging conventions; open to feedback on levels and labels.",                          language: "TypeScript", minutes: 12, bugCount: 5, locked: true },
  { slug: "pricing-cache-v2",       title: "Add read-through cache to the pricing gateway",   brief: "Pricing gets hammered during sales. Adds a read-through cache with negative caching and single-flight — review the invalidation and failure modes before the campaign.",            language: "TypeScript", minutes: 13, bugCount: 6, locked: true },
];

/** Client-safe catalog — playable exercises (no bug descriptions) + coming-soon. */
export const CODE_REVIEWS_META: ExerciseMeta[] = [...EXERCISES.map(toMeta), ...COMING_SOON];

export function getExerciseMeta(slug: string): ExerciseMeta | undefined {
  const ex = EXERCISES.find((e) => e.slug === slug);
  return ex ? toMeta(ex) : undefined;
}

/** Ground truth accessor — grading route ONLY. */
export function getExerciseWithBugs(slug: string): CodeReviewExercise | undefined {
  return EXERCISES.find((e) => e.slug === slug);
}
