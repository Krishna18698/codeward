import type { CodeReviewExercise } from "./types";

export const cacheLayer: CodeReviewExercise = {
  slug: "cache-layer",
  title: "Add cache layer in front of the pricing service",
  brief:
    "The pricing service got hammered during last month's flash sale — we're adding a 60-second TTL cache in front so we don't blow it up again. " +
    "The pricing client now sits behind this wrapper. Need a once-over before we ship for the campaign next Friday.",
  language: "TypeScript",
  minutes: 12,
  files: [
    {
      name: "price-cache.ts",
      code: `import { pricingService } from "./pricing-client";

type Entry = { value: number; expiresAt: number };

const cache = new Map<string, Entry>();
const TTL_MS = 60_000;

export async function getPrice(productId: string, region: string): Promise<number> {
  const key = productId + region;

  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.value;
  }

  try {
    const price = await pricingService.fetchPrice(productId, region);
    cache.set(key, { value: price, expiresAt: Date.now() + TTL_MS });
    return price;
  } catch {
    if (entry) {
      // Service is down — serve the stale price forever rather than fail
      entry.expiresAt = Number.MAX_SAFE_INTEGER;
      return entry.value;
    }
    throw new Error("pricing unavailable");
  }
}`,
    },
  ],
  bugs: [
    {
      id: "key-collision",
      severity: 4,
      category: "correctness",
      description:
        'Key is naive string concatenation: productId "12" + region "3US" collides with productId "123" + region "US". Prices can be served for the wrong product. Use a delimiter that cannot appear in the parts (e.g. `${productId}::${region}`).',
    },
    {
      id: "stampede",
      severity: 4,
      category: "performance",
      description:
        "On expiry of a hot key, every concurrent caller misses and all of them hit pricingService at once — the exact flash-sale thundering herd this cache was built to prevent. Needs single-flight/coalescing so only one caller refreshes per key.",
    },
    {
      id: "stale-forever",
      severity: 4,
      category: "correctness",
      description:
        "The error path sets expiresAt to MAX_SAFE_INTEGER — one transient failure pins a stale price permanently, even after the service recovers. Stale-on-error should extend by a short window, not forever.",
    },
    {
      id: "unbounded-cache",
      severity: 3,
      category: "performance",
      description:
        "Expired entries are never deleted and the Map has no size bound — every product×region ever requested stays in memory. Needs eviction (LRU/max-size) or at least deletion of expired entries.",
    },
    {
      id: "no-metrics",
      severity: 2,
      category: "observability",
      description:
        "No hit/miss/error counters or logs — during the next flash sale nobody can tell whether the cache is working, what the hit rate is, or that the service is being served stale prices.",
    },
  ],
};
