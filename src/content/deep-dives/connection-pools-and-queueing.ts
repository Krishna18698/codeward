export const connectionPoolsAndQueueing = {
  slug: "connection-pools-and-queueing",
  title: "Connection Pools and Queueing",
  hook: "At 200 requests per second latency went from 40ms to 30 seconds, while CPU sat at 20% and the database looked idle. Nothing was broken — a queue was full, and queues fail in a shape most engineers have never been shown.",
  tags: ["Networking", "Operating Systems", "Core CS"],
  category: "CORE_CS" as const,
  minutes: 30,
  level: "Any level",
  prerequisites: "You've configured a pool size or a timeout without being sure why that number.",
  afterThis: "Distributed Rate Limiting — the deliberate version of what saturation does to you accidentally.",
  suggestedFirstPass: "The utilisation curve is the one idea to take away. Everything else is a consequence of it.",
  references: [
    { label: "Systems Performance — Brendan Gregg" },
    { label: "HikariCP — About Pool Sizing" },
  ],
  body: `
## The incident

Traffic climbed steadily through the morning. At roughly 200 RPS, p99 latency went vertical. Not a slow climb — a cliff. Meanwhile:

- Application CPU: 20%
- Database CPU: 30%
- Error rate: 0% at first, then a flood of timeouts
- Slow query log: empty. Every individual query was still fast.

Nothing was overloaded in the way monitoring understands "overloaded." The queries were fast; the *waiting to get a connection* was slow. Once you can read a utilisation curve, this is the most predictable failure in server engineering.

## Little's Law

One equation explains the whole incident:

> **L = λW** — items in the system = arrival rate × time in the system

If requests arrive at 200/sec and each holds a connection for 50ms, you need \`200 × 0.05 = 10\` connections just to keep up. With 10 you're at exactly 100% utilisation, which — as the next section shows — is a disaster, not a success.

It's also the tool for sizing before you have production data. It runs in reverse: with a pool of 20 and 50ms of work, your ceiling is \`20 / 0.05 = 400\` RPS. Above that, arrivals queue. Being able to derive your own capacity ceiling in an interview is a strong signal.

## Why the cliff is vertical

Queue length doesn't rise linearly with load. For a simple queue it rises with **ρ / (1 − ρ)**, where ρ is utilisation:

| Utilisation | Relative wait |
|---|---|
| 50% | 1× |
| 80% | 4× |
| 90% | 9× |
| 95% | 19× |
| 99% | 99× |

Between 50% and 80% you barely notice. Between 95% and 99% latency multiplies fivefold for a 4% traffic increase. That's the cliff — and it means **a system at 95% utilisation is not "nearly optimally used", it is one small burst from collapse.** Capacity planning targets ~70%, and that headroom is the product, not waste.

The second half of the incident: as latency rose, users retried. Retries added arrivals, which pushed utilisation higher, which raised latency further. That's **congestive collapse**, and it's why retry policy and load shedding are part of the same conversation.

## Pool sizing: bigger is usually wrong

The instinct is to raise the pool. It generally makes things worse.

A database has a fixed number of cores and one disk subsystem. Its real concurrency ceiling is roughly \`cores × 2\` plus some slack for I/O wait. Beyond that, more connections don't get more work done — they add context switching, lock contention and memory (Postgres forks a process per connection, and each has its own work_mem).

So a pool of 200 against an 8-core database means 200 queries fighting over 8 cores. Each one is now slow, so each holds its connection longer, so the pool drains anyway — at *worse* latency than a small pool would have given. A small pool queues requests **outside** the database, where queueing is cheap and controllable; a large pool queues them **inside**, where it isn't.

The counter-intuitive rule worth stating out loud: **a smaller pool often lowers p99.** It's why HikariCP's sizing guide recommends numbers far lower than most people expect.

If the app genuinely needs more concurrency than the database can absorb, the answer is a connection *proxy* — PgBouncer in transaction mode — multiplexing many client connections onto few server ones. Not a bigger pool.

## Timeouts: the bug is almost always a missing one

Every hop needs a bound, and they're different things:

- **Connect timeout** — establishing the TCP/TLS connection.
- **Socket / read timeout** — waiting for bytes on an established connection.
- **Pool acquire timeout** — waiting for a free connection. The one people forget, and the one that was infinite in the incident: requests piled up waiting for a connection that would never come free, holding their own upstream resources while they waited.
- **Statement / query timeout** — server-side cap on execution.
- **Overall request deadline** — the budget for the whole request, which every hop should inherit from.

The rule that ties them together: **an inner timeout must be shorter than its outer deadline.** If your HTTP client waits 30s but the caller gives up at 10s, you are burning a connection for 20s doing work nobody will read. Timeouts that increase as you go inward mean the system can never shed load.

And a timeout without a **bounded queue** is only half a fix. An unbounded queue converts a throughput problem into an out-of-memory crash — it accepts work it can never complete. Bound the queue and reject early: a fast 503 is a better answer than a 30-second timeout, because it frees the caller to retry elsewhere or degrade.

## What a connection actually costs

Why pool at all? A new connection is not free:

1. **TCP handshake** — one round trip before any data moves.
2. **TLS handshake** — one or two more round trips (TLS 1.3 got this to one).
3. **Database auth and session setup** — another round trip or more, plus a backend process fork in Postgres.

On a 1ms local link that's negligible. Cross-region at 80ms RTT, it's ~240ms before your query starts. That's why pools exist, why HTTP keep-alive matters, and why a "fast" service can be slow purely from connection churn.

Two related things worth knowing by name: **head-of-line blocking**, where one slow item blocks everything behind it in a shared queue (a real HTTP/1.1 limitation, and the reason HTTP/2 multiplexes); and the **thundering herd**, where a restarted service has an empty pool and every in-flight request tries to open a connection at once.

## Reading the incident correctly

The diagnostic move: CPU low, latency high, individual operations fast ⇒ **the time is spent waiting, not working.** So measure the wait. Pool acquire time is the single most valuable metric here and is almost never on the dashboard — add it, and this class of incident becomes obvious rather than mysterious.

## Interview traps

1. **"Increase the pool size"** as a reflex, with no model of the downstream's real concurrency limit.
2. Not knowing **Little's Law** — you can't size or justify anything without it.
3. Assuming latency degrades **linearly** with load. The cliff at high utilisation is the whole point.
4. Forgetting the **pool acquire timeout**, or setting inner timeouts longer than outer ones.
5. **Unbounded queues** — trading a latency problem for an OOM.
6. Ignoring the **retry amplification** that turns a slowdown into an outage. Retries need budgets, jitter and circuit breakers.

## The 60-second summary

> Little's Law says concurrency equals arrival rate times service time, which both sizes your pool and gives you a capacity ceiling. Wait time scales as ρ/(1−ρ), so latency is flat until roughly 80% utilisation and then goes vertical — which is why 95% utilised is one burst from collapse and why you plan for about 70%. Raising the pool usually makes it worse: the database's real concurrency is near its core count, so a bigger pool just moves the queue inside the database where it's expensive; use a proxy like PgBouncer instead. Every hop needs a timeout, inner shorter than outer, and the forgotten one is the pool acquire timeout. Bound your queues and shed load early, because an unbounded queue turns a slow system into a crashed one, and retries without budgets turn a slowdown into an outage.
`,
};
