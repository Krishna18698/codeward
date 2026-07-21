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

export type DeepDiveReference = { label: string; url?: string };

export type DeepDive = {
  slug: string;
  title: string;
  hook: string;
  tags: string[];
  minutes: number;
  body: string;
  // ── Optional structured metadata (rendered when present) ──
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
];

export function getDeepDive(slug: string): DeepDive | undefined {
  return DEEP_DIVES.find((d) => d.slug === slug);
}
