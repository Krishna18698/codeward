export const cachingAtScale = {
  slug: "caching-at-scale",
  title: "Caching at Scale: Redis, Invalidation & Failure Modes",
  hook: "A cache is a bet — keep a hot slice of data close and fast, accept some staleness. The hard part is everything that goes wrong under load.",
  tags: ["Caching", "Infrastructure"],
  minutes: 30,
  level: "Senior IC",
  prerequisites: "Basic Redis/Memcached usage and HTTP cache headers.",
  afterThis: "Consistent Hashing & Sharding — how cache keys spread across nodes without mass invalidation.",
  suggestedFirstPass: "Read the invalidation and failure-mode sections first — cache stampede and thundering herd are the usual interview targets.",
  references: [
    { label: "Redis documentation", url: "https://redis.io/docs/" },
    { label: "Scaling Memcache at Facebook (NSDI 2013)" },
  ],
  body: `
## The bet you're making

A cache trades consistency for latency. Every caching conversation in an interview should start by naming that trade explicitly: you are choosing to serve *possibly stale* data because a Redis GET is ~0.5ms while your Postgres query is 20–200ms under load. If the interviewer's scenario can't tolerate staleness (account balances at withdrawal time, inventory at checkout commit), the right answer may be *don't cache that read* — knowing when not to cache scores more points than reciting patterns.

## The three standard patterns

**Cache-aside (lazy loading)** — the default. App checks cache → miss → read DB → populate cache → return.
- Pro: only requested data is cached; cache failure degrades to "slow", not "down".
- Con: first request always slow (cold miss); stampede risk (below); staleness until TTL or invalidation.

**Write-through** — writes go to cache and DB together (cache is in the write path).
- Pro: reads after writes are fresh.
- Con: write latency doubles; you cache data nobody may read; cache outage now blocks writes unless you degrade carefully.

**Write-behind** — write to cache, flush to DB asynchronously.
- Pro: extremely fast writes, natural batching.
- Con: **you can lose acknowledged writes** if the cache dies before flush. Almost never acceptable for money. Say that.

Interviewers usually want cache-aside plus targeted invalidation, and want you to *reject* write-behind for anything durable.

## Invalidation: the two hard things

**TTL** is the baseline — every entry gets one, always, even if you also invalidate explicitly, because explicit invalidation *will* miss cases (a code path that forgets, a race, a bug). TTL is the self-healing bound on how wrong you can be.

**Explicit invalidation** on write: after the DB commit, delete the key (\`DEL user:42\`), don't update it. Deleting is safer than setting: two concurrent writers setting the cache can interleave so the *older* value lands last (write A commits, write B commits, cache-set B, cache-set A → cache holds A forever until TTL). Delete-on-write plus lazy reload sidesteps the ordering problem.

The famous race even delete has: reader misses cache → reads DB (old value) → *writer commits and deletes* → reader populates cache with the old value it read moments ago. Now cache is stale until TTL. Mitigations: short TTLs on hot mutable keys, or "delayed double delete" (delete again ~500ms after commit), or versioned keys. In an interview, *naming* this race matters more than the mitigation you pick.

## The failure modes that pass or fail candidates

**Cache stampede (thundering herd).** A hot key expires; 5,000 concurrent requests all miss and all hit the database with the same query; the database falls over; latency spikes cause more timeouts and retries; the retry storm finishes the job. Fixes, in increasing sophistication:
1. **Request coalescing / single-flight**: only one request per key recomputes; the rest wait on it (in-process mutex per key, or Redis \`SET lock NX PX\`).
2. **Probabilistic early refresh**: each hit refreshes the value early with a probability that grows as TTL approaches — expiry never happens under traffic.
3. **Stale-while-revalidate**: serve the expired value immediately, refresh in the background.

**Hot keys.** One celebrity user / one flash-sale product concentrates traffic on a single Redis shard — sharding doesn't help because it's *one key*. Fixes: replicate the key with suffixes (\`product:99:1..N\`, readers pick randomly), add a tiny in-process cache (even 1s of local TTL absorbs enormous QPS), or move the value to a CDN edge if it's cacheable there.

**Cache penetration.** Requests for keys that *don't exist* (bad IDs, scraper probing) always miss and always hit the DB. Fix: cache the negative result (\`"NOT_FOUND"\` with a short TTL) or put a Bloom filter in front so definitely-absent keys never touch the DB.

**Cold start / avalanche.** Restart Redis (or deploy with a flushed cache) under full traffic and every request is a miss — the DB takes the full load it hasn't seen since the cache was introduced, and usually can't. Fixes: cache warming before taking traffic, jittered TTLs so keys don't expire in synchronized waves (\`ttl = base + rand(0, base*0.1)\`), and load-shedding so the DB survives the transition.

## Redis-specific things worth knowing

- **Eviction policies**: \`allkeys-lru\` (evict anything, LRU) for a pure cache; \`noeviction\` (writes fail at maxmemory) when Redis holds things you can't lose — never mix durable state and cache in one instance with \`allkeys-lru\`, or Redis will silently evict your idempotency keys.
- **Persistence**: RDB snapshots (fast restart, loses last minutes) vs AOF (durable, slower). A *cache* usually runs without persistence — restarting empty is the cold-start problem, not a durability problem.
- **Redis Cluster** shards by key hash slot (16384 slots); multi-key operations only work within one slot (hash tags \`{user:42}:profile\` force co-location).
- A single Redis node does ~100K+ simple ops/sec; know that number so your capacity math is instant.

## Interview traps

1. *"We'll update the cache on every write."* — set-vs-delete ordering race above. Delete, don't set.
2. *"TTL of 24 hours so the hit rate is high."* — hit rate isn't the goal; bounded staleness is. TTL is a product decision per data class (session: minutes; product description: hours; price during a sale: seconds or don't cache).
3. *"Redis is down → serve from DB."* — that's the avalanche. If Redis normally absorbs 95% of reads, the DB is sized for 5%. Failover needs load-shedding, circuit breakers, and probably a degraded mode.
4. Uneven quality signal: mention **metrics** unprompted — hit rate, p99 on miss path, evictions/sec, memory fragmentation. A cache without a hit-rate dashboard is a rumor, not a system.

## The 60-second interview summary

> Cache-aside with jittered TTLs everywhere and delete-on-write invalidation; name the read-repopulate race and bound it with TTL. Protect the database with single-flight recomputation for stampedes, negative caching for penetration, key replication or local caching for hot keys, and warming plus jitter for cold starts. Redis eviction policy must match the data class — never LRU-evict state you can't recompute. And some reads shouldn't be cached at all — say which ones.
`,
};
