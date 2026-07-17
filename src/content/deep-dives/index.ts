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
  body: string;
};

/** Catalog order — first entry is the "Start here" feature. */
export const DEEP_DIVES: DeepDive[] = [
  idempotencyExactlyOnce,
  cachingAtScale,
  distributedRateLimiting,
  kafkaFundamentals,
  consistentHashingSharding,
  urlShortenerAtScale,
];

export function getDeepDive(slug: string): DeepDive | undefined {
  return DEEP_DIVES.find((d) => d.slug === slug);
}
