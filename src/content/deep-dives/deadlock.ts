export const deadlock = {
  slug: "deadlock",
  title: "Deadlock",
  hook: "Two services, two tables, opposite lock order — and once a week, at peak, both hang. Deadlock is the one OS topic that shows up unchanged in application code, database transactions, and thread pools.",
  tags: ["Operating Systems", "Databases", "Core CS"],
  category: "CORE_CS" as const,
  minutes: 26,
  level: "Any level",
  prerequisites: "Locks, threads, and transactions at a basic level.",
  afterThis: "Distributed Locking — the same problem once the contenders are on different machines.",
  suggestedFirstPass: "Read the lock-ordering section and then go look at a transaction in your own codebase that updates two tables. Check the order.",
  references: [
    { label: "Operating System Concepts — Silberschatz, ch. 8" },
    { label: "MySQL docs — InnoDB deadlock detection and rollback" },
  ],
  body: `
## The incident

Two endpoints. One transfers money, one reconciles fees. Both touch \`accounts\` and \`ledger\`.

\`\`\`ts
// transfer()                          // reconcile()
BEGIN;                                 BEGIN;
UPDATE accounts ... WHERE id = 7;      UPDATE ledger  ... WHERE id = 9;
UPDATE ledger   ... WHERE id = 9;      UPDATE accounts ... WHERE id = 7;
COMMIT;                                COMMIT;
\`\`\`

Both are correct. Both pass review. Both pass tests, because tests run them one at a time. Under concurrent load, \`transfer\` holds the lock on account 7 and waits for ledger 9, while \`reconcile\` holds ledger 9 and waits for account 7. Neither can proceed, and neither will ever give up. That's a deadlock, and the only thing that made it rare was luck about timing.

## The four conditions

A deadlock requires all four simultaneously (Coffman, 1971). This isn't trivia — **breaking any one prevents deadlock**, and that's your menu of fixes:

1. **Mutual exclusion** — the resource can't be shared. Rarely negotiable, though a shared read lock is a genuine option.
2. **Hold and wait** — a holder requests more while holding. Breakable: acquire everything up front, or release before acquiring.
3. **No preemption** — you can't forcibly take a lock away. Breakable: lock timeouts, or a DB that kills a victim.
4. **Circular wait** — A waits on B, B waits on A. **Breakable, and this is nearly always the practical fix.**

## Lock ordering: the fix that actually ships

Impose a **global order on lock acquisition** and take locks only in that order. Any consistent rule works as long as everyone obeys it — table name alphabetically, primary key ascending, a fixed tier list.

\`\`\`ts
// Both paths now lock accounts before ledger, always.
const ids = [idA, idB].sort();          // deterministic order
for (const id of ids) await lock(id);
\`\`\`

A cycle needs someone to acquire "backwards." If everyone goes in the same direction, a cycle cannot form — and note that this is *prevention*, not detection: the deadlock stops being possible rather than being cleaned up after.

The same trick fixes the classic row-level version: when a transaction updates a set of rows, sort by primary key first. Two concurrent transactions touching overlapping sets then queue behind each other instead of interlocking.

## What the database does about it

Databases don't prevent deadlocks — they **detect** them. InnoDB and Postgres maintain a wait-for graph and look for a cycle. On finding one, they choose a **victim** (usually the transaction with the least work to undo), roll it back, and return an error:

- Postgres: \`40P01 deadlock detected\`
- MySQL: \`1213 Deadlock found when trying to get lock\`

Two consequences most people miss:

**Your application must retry.** The victim's transaction is gone — fully rolled back. If your code treats that error like any other 500, you've turned a recoverable event into user-visible failure. Retry with a small randomised backoff (immediate retry of both loses again).

**Retry safety is your problem.** A retried transfer must not double-charge. This is where deadlock handling meets idempotency: the retry is only safe if the transaction is atomic and the operation is keyed.

Also worth separating: a **lock wait timeout** is not a deadlock. \`innodb_lock_wait_timeout\` firing means someone held a lock too long — contention, not a cycle. Diagnosing one as the other sends you down the wrong path.

## The deadlocks that don't look like deadlocks

**Gap locks.** In MySQL's Repeatable Read, a range query locks the *gaps* between index entries to prevent phantoms. Two transactions inserting different, non-conflicting rows can deadlock on overlapping gaps. Deadlocks with no obviously shared row are usually this, and the answer is often an index that narrows the range — or Read Committed, which doesn't take gap locks.

**Thread pool starvation deadlock.** A task in a bounded pool submits a subtask to the *same* pool and blocks on the result. With enough parents, every thread is a blocked parent and no thread is free to run a child. No lock is involved, and the four conditions still hold — the threads *are* the resource. Fix: separate pools per tier, or never block on work submitted to your own pool.

**Lock held across I/O.** Holding a mutex while making a network call isn't a deadlock, but it makes every real deadlock vastly more likely by stretching the hold window from microseconds to seconds. "Never hold a lock across I/O" is the highest-value rule here.

**The async trap.** Locking in one task and unlocking in another, or blocking an event loop thread on a lock held by work that needs that same loop to progress, is a self-deadlock with a single thread.

## Detection vs prevention vs avoidance

Worth being able to name all three:

- **Prevention** — make one Coffman condition impossible. Lock ordering. What you do in application code.
- **Detection and recovery** — let it happen, find the cycle, kill a victim. What databases do.
- **Avoidance** — track future resource claims and refuse any request that could lead to an unsafe state (Banker's algorithm). Textbook-famous, essentially never used in practice, because you rarely know the maximum claims in advance. Say that last part and you sound like someone who has built systems rather than only read about them.

## Interview traps

1. Naming a deadlock but not the **circular wait** — the condition you'd actually break.
2. Reciting the Banker's algorithm as *the* solution without noting it's impractical.
3. Forgetting the **retry**, or retrying without backoff so both transactions collide again.
4. Not knowing the database detects and kills a victim — assuming it hangs forever.
5. Confusing **lock wait timeout** with deadlock; they have different causes and different fixes.
6. Missing **livelock** as a distinct failure: everyone politely backing off and retrying in lockstep, so work happens but no progress does. Randomised backoff is the fix.

## The 60-second summary

> A deadlock needs mutual exclusion, hold-and-wait, no preemption and circular wait at the same time, so breaking any one prevents it — and in practice you break circular wait by imposing a global lock order, such as sorting rows by primary key before updating. Databases don't prevent deadlocks, they detect a cycle in the wait-for graph and roll back a victim, which means your application must catch that specific error and retry with randomised backoff, and the retried operation must be idempotent. The deadlocks that are hard to spot are gap locks in MySQL's Repeatable Read, and thread pools where a task blocks on a subtask submitted to the same pool. Never hold a lock across I/O.
`,
};
