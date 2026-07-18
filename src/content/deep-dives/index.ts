import { idempotencyExactlyOnce } from "./idempotency-exactly-once";
import { cachingAtScale } from "./caching-at-scale";
import { distributedRateLimiting } from "./distributed-rate-limiting";
import { kafkaFundamentals } from "./kafka-fundamentals";
import { consistentHashingSharding } from "./consistent-hashing-sharding";
import { urlShortenerAtScale } from "./url-shortener-at-scale";

export type DeepDive = {
  slug: string;
  title: string;
  hook: string;
  tags: string[];
  minutes: number;
  /** Full markdown for published dives; empty for coming-soon entries. */
  body: string;
  /** Coming soon — shown in the catalog, not yet readable. */
  locked?: boolean;
};

// Published (readable) — first entry is the "Start here" feature.
const PUBLISHED: DeepDive[] = [
  idempotencyExactlyOnce,
  cachingAtScale,
  distributedRateLimiting,
  kafkaFundamentals,
  consistentHashingSharding,
  urlShortenerAtScale,
];

// Coming soon — topics visible in the catalog, content not yet written.
const COMING_SOON: DeepDive[] = [
  { slug: "saga-outbox-cdc", title: "Saga, Outbox & CDC for Payments", hook: "One local transaction can't cover a multi-service payment flow. A saga coordinates committed steps, reliable events, compensation, and forward recovery.", tags: ["Payments", "Microservices"], minutes: 40, body: "", locked: true },
  { slug: "distributed-locks", title: "Distributed Locking", hook: "'Only one worker may run this at a time' sounds trivial until the worker is one of many processes on different machines. Single-active-worker and leader election show up in every payments system.", tags: ["Distributed Systems"], minutes: 30, body: "", locked: true },
  { slug: "two-phase-commit", title: "Two-Phase Commit", hook: "Atomic commits across distributed participants: the protocol, its failure modes, the blocking flaw every interviewer probes, and when to reach for a saga instead.", tags: ["Distributed Systems"], minutes: 25, body: "", locked: true },
  { slug: "raft-consensus", title: "Raft: Leader Election, Replication & Commit Safety", hook: "A replicated system needs one ordered history despite crashes and delayed messages. Terms, majority elections, log replication, and commit rules create that safety.", tags: ["Consensus", "Distributed Systems"], minutes: 45, body: "", locked: true },
  { slug: "chat-at-scale", title: "Chat Systems at Scale", hook: "Millions of persistent connections, presence that's always slightly wrong, per-conversation ordering across devices, and reconnect storms.", tags: ["Realtime", "Distributed Systems"], minutes: 40, body: "", locked: true },
  { slug: "push-notifications", title: "Push Notifications at Scale", hook: "A large-scale notification pipeline: fan-out, queueing, provider delivery, token lifecycle, cancellation, and the failure modes interviewers probe.", tags: ["Infrastructure"], minutes: 30, body: "", locked: true },
  { slug: "matching-engine", title: "Matching Engine & Order Book", hook: "The core of every exchange. Orders pour in; the engine keeps a price-time priority book and matches each against the best opposite side.", tags: ["Fintech", "Distributed Systems"], minutes: 40, body: "", locked: true },
];

/** Catalog order — published first, then coming-soon. 13 total. */
export const DEEP_DIVES: DeepDive[] = [...PUBLISHED, ...COMING_SOON];

export function getDeepDive(slug: string): DeepDive | undefined {
  return DEEP_DIVES.find((d) => d.slug === slug);
}
