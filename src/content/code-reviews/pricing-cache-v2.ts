import type { CodeReviewExercise } from "./types";

export const pricingCacheV2: CodeReviewExercise = {
  slug: "pricing-cache-v2",
  title: "Add read-through cache to the pricing gateway",
  brief:
    "Pricing gets hammered during sales. This adds a read-through cache with negative caching and single-flight in front of the pricing service. " +
    "Review the invalidation and failure modes before the campaign next Friday.",
  language: "TypeScript",
  minutes: 13,
  files: [
    {
      name: "pricing-gateway.ts",
      code: `const inflight = new Map<string, Promise<number>>();

export async function getPrice(sku: string, region: string): Promise<number> {
  const key = sku + region;

  const cached = await redis.get(key);
  if (cached) return Number(cached);

  if (inflight.has(key)) return inflight.get(key)!;

  const p = pricingService.fetch(sku, region).then(async (price) => {
    await redis.set(key, String(price), "EX", 300);
    return price;
  });
  inflight.set(key, p);
  return p;
}`,
    },
  ],
  bugs: [
    {
      id: "key-collision",
      severity: 4,
      category: "correctness",
      description:
        "The cache key is `sku + region` with no separator, so sku 'A1' + region '2US' collides with sku 'A12' + region 'US' — serving the wrong price. Use a delimiter that can't appear in the parts, e.g. `${sku}::${region}`.",
    },
    {
      id: "inflight-never-cleared",
      severity: 4,
      category: "correctness",
      description:
        "The single-flight entry is added to `inflight` but never removed. After the first fetch resolves, the stale promise stays in the map forever, so every future call returns the SAME resolved value bypassing the cache/TTL — permanently stale prices, and a slow memory leak. Must delete the key in a finally once the promise settles.",
    },
    {
      id: "inflight-error-poisons",
      severity: 4,
      category: "correctness",
      description:
        "If pricingService.fetch rejects, the rejected promise sits in `inflight` (never cleared) and is returned to all subsequent callers — one transient failure poisons the key indefinitely. The finally-cleanup must run on rejection too.",
    },
    {
      id: "falsy-zero-price",
      severity: 3,
      category: "correctness",
      description:
        "`if (cached)` treats a cached price of '0' (or the string is empty) as a miss and refetches — a legitimately zero/free price never caches. Check `cached !== null` explicitly rather than truthiness.",
    },
    {
      id: "no-negative-caching",
      severity: 3,
      category: "performance",
      description:
        "The brief asks for negative caching, but a missing/invalid sku isn't cached as absent — every request for a bad sku punches through to the pricing service (cache penetration), exactly the load this is meant to prevent. Cache a negative marker with a short TTL.",
    },
    {
      id: "no-failure-fallback",
      severity: 2,
      category: "correctness",
      description:
        "If the pricing service is down, getPrice simply rejects — the gateway has no fallback (stale-on-error or a degraded default), so a pricing-service outage becomes a full checkout outage. Decide a failure behavior before the campaign.",
    },
  ],
};
