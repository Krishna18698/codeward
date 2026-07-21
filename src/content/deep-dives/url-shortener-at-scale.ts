export const urlShortenerAtScale = {
  slug: "url-shortener-at-scale",
  title: "URL Shortener at Scale",
  hook: "The 'design bit.ly' question. The baseline design is table stakes — the interview actually happens in the follow-ups: ID generation, hot keys, analytics, and CAP trade-offs.",
  tags: ["System Design", "Caching"],
  minutes: 25,
  level: "Mid → Senior",
  prerequisites: "Basic hashing, base-62 encoding, and read/write path thinking.",
  afterThis: "Caching at Scale — the read path here lives or dies on cache hit rate.",
  suggestedFirstPass: "Start with the key-generation trade-offs (hash vs counter vs KGS); that's the crux of the design.",
  body: `
## Why interviewers still ask this

Not because shortening URLs is hard — because the question has a *floor everyone clears* and a *ceiling most don't*. The floor: API, data model, cache, redirect. The ceiling: ID generation without coordination, read-path latency at 100:1 read ratios, analytics without slowing redirects, and what happens during a region failure. Interviews are scored above the floor.

## Baseline (say it fast, don't linger)

Requirements: shorten (write), redirect (read), optional custom alias + expiry + analytics. Scale assumption to anchor math: 100M new URLs/day (~1.2K writes/s), 10B redirects/day (~115K reads/s) — **a 100:1 read-heavy system; every design choice should favor the read path.**

\`\`\`
urls: short_code PK · long_url · user_id · created_at · expires_at
\`\`\`

Redirect: \`GET /{code}\` → cache → DB on miss → 301/302. Storage: 100M/day × ~500B ≈ 50GB/day — years fit on a modest cluster; storage is not the bottleneck, and saying so is a point.

## Follow-up 1: generating the code

Three options; know why you pick:

1. **Hash the URL** (MD5, take 7 chars): deterministic (same URL → same code, deduplication for free) but collisions must be probed-and-retried, and two users shortening the same URL share a code — bad if codes carry per-user analytics or expiry.
2. **Random 7 chars, insert with unique constraint, retry on conflict**: simple, unpredictable (good — sequential codes are enumerable, and enumeration is a privacy leak worth mentioning). At 62⁷ ≈ 3.5T keyspace, collisions are rare for years.
3. **Counter + Base62**: strictly unique, no retries — but a single counter is a SPOF and a coordination bottleneck. Fixes: **range allocation** (each app server leases blocks of 100K IDs from a coordinator — one coordination call per 100K codes; a crashed server strands an unused block, which is fine) or **Snowflake-style IDs** (timestamp + machine + sequence — no coordination at all, slightly longer codes). Then optionally bijectively scramble so codes aren't sequential.

The senior answer names the trade: *dedup vs unpredictability vs coordination cost* — and picks range-allocated counters or random-with-retry.

## Follow-up 2: the read path

115K reads/s with p99 <20ms means **most reads never touch the database**:
- **Redis cache-aside** on \`code → long_url\` with jittered TTLs. The top ~20% of codes serve ~80% of traffic; hit rates land >90%.
- **Negative caching** for missing codes — scrapers and typos otherwise punch through to the DB every time (cache penetration).
- **Hot key**: one viral link can dominate a whole shard's traffic. In-process cache (1s TTL absorbs almost all of it) or replicate the key.
- **CDN/edge**: redirects are small and cacheable — serving 301s at the edge can eliminate origin traffic for the hottest links entirely.

**301 vs 302** is secretly an analytics question: 301 (permanent) lets browsers cache the redirect — origin never sees repeat clicks, so click counts undercount. 302/307 keeps every click observable at the cost of repeat latency. If analytics matter, 302 — and say *why*.

## Follow-up 3: analytics without slowing redirects

The redirect handler must never write synchronously to an analytics store. Emit an event (Kafka or similar) — fire-and-forget from the hot path — and aggregate downstream into an OLAP store; counts become eventually consistent, which is fine (nobody needs click counts to be transactionally exact). \`INSERT INTO clicks\` per redirect at 115K/s is the classic self-own; the queue also absorbs spikes and lets you replay.

This is the **OLTP/OLAP separation** follow-up in miniature: reads on the redirect path, writes on an async pipeline, different stores tuned per workload.

## Follow-up 4: sharding and multi-region

One Postgres handles the write load easily; the *data* eventually shards. Hash-shard on \`short_code\` (point lookups only — range queries don't exist here, so hash sharding's weakness is irrelevant; connect this to the consistent-hashing dive). Custom aliases live in the same namespace with a uniqueness check.

Multi-region: reads want geo-local caches + replicas (trivially fine — codes are immutable after creation, so replication lag can't serve a *wrong* URL, only a very briefly *missing* one — a 404-then-retry, not corruption). Writes either home to one region (simple, +latency for far users) or use per-region ID ranges/Snowflake so regions create codes without coordinating. Immutability is the gift: **this system is AP-friendly** — say "I choose availability; the failure mode of stale reads here is benign," and you've answered the CAP follow-up before it's asked.

## Interview traps

1. Spending 15 minutes on the baseline. Clear it in 3; the score lives in follow-ups.
2. *"Auto-increment primary key, Base62-encoded."* — sequential codes are enumerable (privacy leak) and a single sequence is a write bottleneck; at minimum scramble, at best allocate ranges.
3. *"Write click counts to the DB on each redirect."* — synchronous OLAP on the OLTP hot path.
4. Forgetting **expiry/deletion**: expired codes should 410, and codes are never recycled (a recycled code serving someone else's old link is a real safety incident).
5. Never saying a number. The 100:1 ratio, ~1.2K w/s, 62⁷ keyspace — three numbers make the whole design concrete.

## The 60-second interview summary

> Read-heavy 100:1, so the design is a read path: Redis cache-aside with negative caching, CDN for the hottest codes, 302s if analytics matter. Codes from range-allocated counters or random-with-retry — unpredictable, uncoordinated, collision-safe in a 62⁷ space. Analytics leave the hot path through a queue into OLAP. Data hash-shards on code; immutability makes multi-region replication safe and the system comfortably AP. Baseline in three minutes, then live in the follow-ups.
`,
};
