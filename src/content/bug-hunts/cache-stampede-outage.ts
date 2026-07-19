import type { BugHuntExercise } from "./types";

export const cacheStampedeOutage: BugHuntExercise = {
  slug: "cache-stampede-outage",
  title: "Cache expiry takes down the pricing service",
  brief:
    "Every hour on the hour, pricing latency spikes and the database CPU pins to 100% for ~30 seconds, then recovers. " +
    "The cache TTL is 1 hour. Traffic is steady. Find why expiry causes an outage.",
  language: "TypeScript",
  minutes: 12,
  files: [
    {
      name: "price-cache.ts",
      code: `const TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getPrice(sku: string): Promise<number> {
  const cached = await redis.get(\`price:\${sku}\`);
  if (cached !== null) {
    return Number(cached);
  }

  // Cache miss — fetch from the pricing DB and repopulate
  const price = await pricingDb.query(
    "SELECT price FROM prices WHERE sku = $1",
    [sku],
  );
  await redis.set(\`price:\${sku}\`, String(price), "PX", TTL_MS);
  return price;
}`,
    },
  ],
  testOutput: "",
  logs: `13:00:00.002  INFO  cache warmed at startup: 8,400 SKUs, all TTL=3600s
13:59:59.981  INFO  db: 12 queries/sec (steady)
14:00:00.004  WARN  db: 6,140 queries/sec
14:00:00.008  ERROR db: connection pool exhausted
14:00:03.221  WARN  pricing p99 latency: 9,400ms
14:00:29.900  INFO  db: 40 queries/sec, recovering
15:00:00.006  WARN  db: 6,090 queries/sec   ← same spike, one hour later`,
  rootCause:
    "A synchronized cache stampede (thundering herd). All 8,400 SKUs were warmed at startup at the same instant, so they all get the same TTL and therefore all expire at the same instant — one hour later, on the hour. At that moment every key misses simultaneously, and every concurrent request for every SKU hits the pricing DB at once (6,000+ qps vs the normal 12), exhausting the pool and pinning CPU until the cache refills. It repeats hourly because each refill re-synchronizes all the TTLs again.",
  category: "performance",
  ruledOut: [
    "The database needs more capacity — no; steady-state is 12 qps, trivially handled. The problem is a 500x spike concentrated into one instant, not sustained load.",
    "The TTL is too short — the TTL length is fine; the bug is that all TTLs expire at the *same time*, not that they expire too soon.",
    "Redis is failing — Redis is fine; it's correctly reporting misses. The load lands on the DB behind it.",
  ],
  canonicalFix:
    "Two fixes, ideally both. (1) Jitter the TTLs so keys don't expire in a synchronized wave: `TTL = base + random(0, base * 0.1)`. (2) Prevent the herd on any single hot key with single-flight / request coalescing — only one request recomputes a missing key while the rest wait on it (a per-key lock, or stale-while-revalidate serving the old value during refresh). Jitter spreads the misses out; single-flight bounds the damage of any one.",
};
