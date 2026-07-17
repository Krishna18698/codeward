export const distributedRateLimiting = {
  slug: "distributed-rate-limiting",
  title: "Distributed Rate Limiting",
  hook: "Has this caller used up its quota? Answering accurately across many nodes, through clock skew and traffic spikes, within a 1ms budget — that's the real problem.",
  tags: ["Distributed Systems", "Infrastructure"],
  minutes: 25,
  body: `
## Why it's harder than it looks

On one server, rate limiting is a counter and a clock. The interview question is what happens when the "server" is forty pods behind a load balancer: a caller's requests scatter across all of them, each pod sees only a slice of the traffic, and the limit must hold *globally*. Local counters allow 40× the quota. Every real design flows from that constraint: **shared state, updated atomically, read within the request latency budget.**

## The algorithms (know all four, recommend one)

**Fixed window.** Counter per \`(user, minute)\`; reject above N. One Redis \`INCR\` + \`EXPIRE\` — cheapest possible. Flaw: **boundary burst** — 100 requests at 11:59:59 and 100 more at 12:00:01 is 200 in two seconds, all allowed.

**Sliding window log.** Store a timestamp per request (Redis sorted set), count entries in the last 60s. Exact — and memory scales with request rate per user (\`ZADD\` + \`ZREMRANGEBYSCORE\` + \`ZCARD\` per request). Fine for low-QPS expensive endpoints, wrong for a gateway.

**Sliding window counter.** Two fixed-window counters (current + previous), weighted: \`count = curr + prev × overlap%\`. Approximate (assumes uniform distribution in the previous window), O(1) memory, kills the boundary burst. **This is the default gateway answer.**

**Token bucket.** Bucket of capacity B refills at R tokens/sec; each request takes one; empty → reject. The vocabulary win: it *explicitly* separates **sustained rate (R)** from **burst allowance (B)** — "100 rps sustained with bursts of 500" is one sentence. Leaky bucket is the same idea shaped as a queue with constant drain, smoothing output instead of admitting bursts.

## Making it atomic: Redis + Lua

The naive read-then-write is a lost-update race: two pods read \`count=99\`, both allow, both write 100 — limit broken exactly when contended. Fix: do check-and-update as **one atomic unit** — a Lua script (Redis runs scripts single-threaded, so it is a transaction):

\`\`\`lua
-- token bucket, called as EVALSHA <sha> 1 rl:{user42} now_ms refill_rate capacity cost
local tokens = tonumber(redis.call('HGET', KEYS[1], 't') or ARGV[4])
local last   = tonumber(redis.call('HGET', KEYS[1], 'ts') or ARGV[1])
tokens = math.min(tonumber(ARGV[4]), tokens + (ARGV[1]-last)/1000 * tonumber(ARGV[3]))
if tokens >= tonumber(ARGV[5]) then
  redis.call('HSET', KEYS[1], 't', tokens - ARGV[5], 'ts', ARGV[1])
  redis.call('PEXPIRE', KEYS[1], 120000)
  return 1  -- allowed
end
redis.call('HSET', KEYS[1], 't', tokens, 'ts', ARGV[1])
return 0    -- rejected
\`\`\`

Details interviewers probe:
- **Whose clock?** Pass \`now\` from the caller and skew between app servers corrupts refill math. Use the *Redis server's* clock (\`redis.call('TIME')\`) so there is exactly one clock.
- **Key expiry** so idle users don't leak memory forever.
- **Hash-tagged keys** (\`rl:{user42}\`) in Redis Cluster so the script's keys live in one slot.

## The latency budget and the real architecture

A network hop to Redis is ~0.5–1ms — for a gateway doing this on *every request*, that may be the entire budget. The production pattern is **two tiers**: a local in-process limiter (token bucket in memory, generous limits) as the first gate and cheap DDoS backstop, and the shared Redis limiter as the accurate global gate. Some designs go async: allow using the local view, sync counters to Redis in the background, accept small overshoot — "eventually-consistent limiting". Naming the **accuracy ↔ latency trade** is the senior move: exact global limiting costs a round trip; anything cheaper is approximate; pick per endpoint.

## Failure policy: open or closed?

Redis is down — do you allow (fail open) or reject (fail closed)? There is no universal answer and interviewers want the *reasoning*: fail open for revenue-path endpoints where the limiter protects against abuse (availability wins); fail closed for endpoints where the limiter protects a fragile downstream or is a security control (login attempts, OTP sends). Wrap the limiter call in a circuit breaker with a millisecond timeout either way — a slow limiter must not become the outage.

## What the caller sees

Return \`429 Too Many Requests\` with \`Retry-After\` and \`X-RateLimit-Limit / -Remaining / -Reset\` headers. Well-behaved clients back off exponentially **with jitter** — synchronized retries after a shared reset timestamp are a self-inflicted stampede (retry storms are the same failure family as cache stampedes).

## Interview traps

1. *"Sticky sessions solve it — each user hits one pod."* — until a pod dies or scales, and load skews. Sticky routing is an optimization, not a correctness mechanism.
2. *"Store the counter in Postgres."* — a row update per request turns the limiter into the bottleneck it was meant to prevent. The limiter's store must be an order of magnitude faster than the thing it protects.
3. *"One global limit."* — real systems limit on multiple axes simultaneously: per user, per IP, per API key, per endpoint class, plus a global service ceiling. Each is its own bucket; the request must pass all.
4. Quietly test whether limits are **per what** — a per-user limit doesn't stop an unauthenticated scraper; a per-IP limit punishes a whole NAT'd office. Say both, layer both.

## The 60-second interview summary

> Sliding-window counters (or token buckets when burst-vs-sustained matters) stored in Redis, with check-and-decrement done atomically in a Lua script using Redis's own clock. Two tiers: cheap local pre-limit, accurate shared limit. Keys expire; cluster keys are hash-tagged. On limiter failure, fail open or closed per endpoint intent, behind a circuit breaker. Return 429 with Retry-After; expect jittered backoff. Exact global limiting costs a network hop — everything cheaper is deliberately approximate.
`,
};
