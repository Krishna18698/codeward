export const distributedLocks = {
  slug: "distributed-locks",
  title: "Distributed Locking",
  hook: "'Only one worker may run this at a time' sounds trivial until the worker is one of many processes on different machines. This is where fencing tokens and lease expiry earn their keep.",
  tags: ["Distributed Systems"],
  minutes: 30,
  body: `
## Why you can't just use a mutex

On one machine, "only one thread in this section" is a mutex — a few nanoseconds, backed by the CPU. Across machines there is no shared memory, so "only one *process* runs this job" needs an external arbiter that all contenders can ask. That's a distributed lock. It shows up everywhere: a single cron leader so a nightly job doesn't run five times, one worker draining a queue partition, a fraud check that must not run concurrently for the same account.

The trap is thinking a distributed lock is as reliable as a mutex. It isn't — because the lock holder and the lock service are separated by a network that can delay, drop, and partition. Every hard part flows from that.

## The naive lock and its two bugs

\`\`\`ts
// acquire
const ok = await redis.set("lock:job", workerId, "NX", "EX", 30); // NX = only if absent, EX = 30s TTL
if (!ok) return; // someone else holds it
try {
  doWork();
} finally {
  await redis.del("lock:job"); // release
}
\`\`\`

Two bugs hide here:

**Bug 1 — releasing someone else's lock.** Worker A acquires, then stalls (GC pause, slow disk) past the 30s TTL. The lock expires; worker B acquires. A wakes up, finishes, and runs \`DEL lock:job\` — deleting *B's* lock. Now C can acquire while B is still working: two holders. Fix: the release must be conditional — delete only if the value is still *my* workerId, done atomically (a small Lua script: \`if get==me then del\`). Never blind-delete.

**Bug 2 — the lease expired mid-work (the deep one).** Even with a correct conditional release, if A's work runs longer than the TTL, the lock expires *while A still believes it holds it*. B acquires and starts. Now A and B both run the critical section. A conditional release doesn't help — the danger is during the work, not at release.

## Fencing tokens: the real fix

You cannot prevent a lease from expiring under a long pause — the lock service can't tell "A is slow" from "A is dead." So you stop trusting the lock alone and protect the **resource** instead.

Each lock grant returns a monotonically increasing **fencing token** (1, 2, 3…). Whenever the holder touches the protected resource, it sends the token. The resource **remembers the highest token it has seen and rejects anything lower.**

- A acquires with token 33, stalls.
- Lease expires; B acquires with token 34, writes to storage tagged 34.
- A wakes, tries to write tagged 33 — storage sees 33 < 34 and **rejects it.**

A's stale write is fenced out even though A thought it held the lock. This is Martin Kleppmann's canonical example, and interviewers love it because it separates people who've *used* a distributed lock from people who understand *why locks alone are unsafe*. The catch: the protected resource must support fencing (check-and-reject on a token) — not everything does, which is itself a design constraint worth stating.

## Lease TTLs: the unavoidable tuning trade

Every distributed lock needs a TTL, because a holder can die without releasing and you can't wait forever.
- **Too short**: long-but-healthy work loses the lock mid-run, causing exactly Bug 2 → more reliance on fencing, more churn.
- **Too long**: after a real crash, the lock sits held by a dead process for the whole TTL; nobody makes progress until it expires.

Options: pick a TTL comfortably above p99 work time and **renew** (heartbeat) the lease while working — but renewal has its own race (renew fails silently, work continues). There's no TTL that's safe without fencing; TTL bounds the *stuck* time, fencing bounds the *incorrect* time.

## Redlock and the "which store" question

A single Redis node is a single point of failure and, on failover, can lose the lock (the replica may not have it yet — two holders). **Redlock** acquires the lock on a majority of N independent Redis nodes to survive one failing. It's real but controversial: under clock skew and pauses its safety is debated, and it's more moving parts. The pragmatic senior answer:

- For **efficiency** locks ("don't do this expensive work twice, but doing it twice is merely wasteful") a single-node Redis lock with a TTL is fine — occasional double-work is acceptable.
- For **correctness** locks ("doing this twice corrupts data or double-pays") you need fencing tokens, and you should lean on a system built for consensus — **ZooKeeper or etcd**, whose sequential/ephemeral nodes give you both mutual exclusion and monotonic fencing tokens natively, with proper failover.

Naming that split — efficiency vs correctness — is the move. "I'd use a Redis lease for efficiency; for correctness I'd use etcd/ZooKeeper with fencing tokens" answers the whole question.

## Leader election is the same problem wearing a hat

"Elect one leader" is just "acquire one lock that auto-renews, and whoever holds it is leader." ZooKeeper/etcd give ephemeral nodes that vanish when the holder's session dies, triggering a new election. The same hazards apply: a paused old leader may still think it's leader (fence its actions), and split-brain (two leaders) is the failure to design against — again via fencing tokens or a quorum that only one leader can hold.

## Interview traps

1. *"DEL to release."* — Bug 1; must be conditional on ownership, atomically.
2. *"Set a TTL and you're safe."* — Bug 2; a lease can expire mid-work. TTL alone never guarantees single-holder.
3. Not mentioning **fencing tokens** — the single strongest signal that you understand the model.
4. *"Redis Redlock is bulletproof."* — it's debated; know when a single-node lease suffices vs when you need a consensus store.
5. Ignoring **clock skew and process pauses** — the whole reason locks are hard is that "slow" and "dead" are indistinguishable across a network.

## The 60-second summary

> A distributed lock is an external arbiter (Redis lease, or etcd/ZooKeeper), but the lock alone is never safe: a holder can pause past its TTL while another acquires, so two processes run at once. Release conditionally on ownership, and — the key idea — issue a monotonic fencing token on each grant so the protected resource rejects stale holders. Use a single-node lease for efficiency locks where double-work is merely wasteful; use a consensus store with fencing for correctness locks where it corrupts. Leader election is the same problem, and split-brain is what you fence against.
`,
};
