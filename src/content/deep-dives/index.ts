import { idempotencyExactlyOnce } from "./idempotency-exactly-once";
import { cachingAtScale } from "./caching-at-scale";
import { distributedRateLimiting } from "./distributed-rate-limiting";
import { kafkaFundamentals } from "./kafka-fundamentals";
import { consistentHashingSharding } from "./consistent-hashing-sharding";
import { urlShortenerAtScale } from "./url-shortener-at-scale";
import { sagaOutboxCdc } from "./saga-outbox-cdc";
import { distributedLocks } from "./distributed-locks";
import { twoPhaseCommit } from "./two-phase-commit";
import { raftConsensus } from "./raft-consensus";
import { chatAtScale } from "./chat-at-scale";
import { pushNotifications } from "./push-notifications";
import { matchingEngine } from "./matching-engine";
import { databaseIndexes } from "./database-indexes";
import { transactionIsolation } from "./transaction-isolation";
import { deadlock } from "./deadlock";
import { connectionPoolsAndQueueing } from "./connection-pools-and-queueing";
import { memoryAndTheOomKill } from "./memory-and-the-oom-kill";

export type DeepDiveReference = { label: string; url?: string };

/** Two families of topic, not two products.
 *
 *  Core CS (OS, DBMS, networking) gets a filter rather than an eighth practice
 *  mode: it belongs to the same "Recognise" stage as the systems dives, and a
 *  new top-level mode would re-open the "seven modes, no order" problem the
 *  dashboard's next-step card exists to solve. Every entry is written applied —
 *  "why did this query get slower", not "define a B-tree". */
export type DeepDiveCategory = "SYSTEMS" | "CORE_CS";

export const CATEGORY_LABEL: Record<DeepDiveCategory, string> = {
  SYSTEMS: "Distributed Systems",
  CORE_CS: "Core CS",
};

export type DeepDive = {
  slug: string;
  title: string;
  hook: string;
  tags: string[];
  minutes: number;
  body: string;
  // ── Optional structured metadata (rendered when present) ──
  /** Which family this belongs to. Absent means SYSTEMS — the original set. */
  category?: DeepDiveCategory;
  /** Seniority framing chip, e.g. "Senior IC". */
  level?: string;
  /** What to know first. */
  prerequisites?: string;
  /** What this unlocks next. */
  afterThis?: string;
  /** How to work through it. */
  suggestedFirstPass?: string;
  /** Canonical sources. */
  references?: DeepDiveReference[];
};

/** Catalog order — first entry is the "Start here" feature. All published. */
export const DEEP_DIVES: DeepDive[] = [
  idempotencyExactlyOnce,
  cachingAtScale,
  distributedRateLimiting,
  kafkaFundamentals,
  consistentHashingSharding,
  urlShortenerAtScale,
  sagaOutboxCdc,
  distributedLocks,
  twoPhaseCommit,
  raftConsensus,
  chatAtScale,
  pushNotifications,
  matchingEngine,
  // ── Core CS ──
  databaseIndexes,
  transactionIsolation,
  deadlock,
  connectionPoolsAndQueueing,
  memoryAndTheOomKill,
];

export function getDeepDive(slug: string): DeepDive | undefined {
  return DEEP_DIVES.find((d) => d.slug === slug);
}

/** Category with the default applied — use this, never `d.category` directly. */
export const categoryOf = (d: DeepDive): DeepDiveCategory => d.category ?? "SYSTEMS";

export const deepDivesByCategory = (c: DeepDiveCategory) => DEEP_DIVES.filter((d) => categoryOf(d) === c);
