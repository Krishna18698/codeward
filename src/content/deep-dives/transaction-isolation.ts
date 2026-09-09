export const transactionIsolation = {
  slug: "transaction-isolation",
  title: "Transaction Isolation",
  hook: "A balance check and a debit, both correct in isolation, let a user spend the same money twice — but only under load. Isolation levels are the vocabulary for exactly which anomalies your database still allows.",
  tags: ["Databases", "Core CS"],
  category: "CORE_CS" as const,
  minutes: 30,
  level: "Any level",
  prerequisites: "BEGIN/COMMIT, and the idea that two requests can run at the same time.",
  afterThis: "Deadlock — what happens when you reach for locks to fix the anomalies below.",
  suggestedFirstPass: "Focus on lost update and write skew. Those are the two that survive the isolation level most systems actually run at.",
  references: [
    { label: "Designing Data-Intensive Applications, ch. 7 — Martin Kleppmann" },
    { label: "PostgreSQL docs — Transaction Isolation" },
  ],
  body: `
## The double-spend

\`\`\`ts
const { balance } = await db.query("SELECT balance FROM accounts WHERE id = $1", [id]);
if (balance >= amount) {
  await db.query("UPDATE accounts SET balance = $1 WHERE id = $2", [balance - amount, id]);
}
\`\`\`

Read the balance, check it, write the new one. Obviously correct — and it will let someone with £100 spend £100 twice if two requests interleave:

| | Request A | Request B |
|---|---|---|
| t1 | reads balance = 100 | |
| t2 | | reads balance = 100 |
| t3 | 100 ≥ 80 ✓ | |
| t4 | | 100 ≥ 80 ✓ |
| t5 | writes 20 | |
| t6 | | writes 20 |

£160 spent from a £100 account, and the final balance is 20 as though only one purchase happened. This is a **lost update**, and wrapping both statements in a transaction at your database's default isolation level **does not fix it.** That surprises people, and it's the heart of this topic.

## The anomalies, in the order they get worse

Isolation levels are defined by which of these they permit. Learn the anomalies first; the levels are then just a table.

**Dirty read** — you read a row another transaction wrote but hasn't committed. It may roll back, so you acted on data that never existed.

**Non-repeatable read** — you read a row twice in one transaction and get different values, because someone committed in between.

**Phantom read** — you run the same *query* twice and get a different set of *rows*, because someone inserted or deleted a matching row. Not a changed row: a changed result set.

**Lost update** — two transactions read-modify-write the same row; one overwrites the other's change. The double-spend above.

**Write skew** — the subtle one. Two transactions read an overlapping set, each decides its write is fine based on what it read, and both writes together break an invariant that neither broke alone.

## The levels

| Level | Dirty read | Non-repeatable | Phantom | Lost update |
|---|---|---|---|---|
| Read Uncommitted | ✅ possible | ✅ | ✅ | ✅ |
| Read Committed | ❌ prevented | ✅ | ✅ | ✅ |
| Repeatable Read | ❌ | ❌ | ✅* | ❌* |
| Serializable | ❌ | ❌ | ❌ | ❌ |

The asterisks are where the real knowledge lives, and they're engine-specific:

- **PostgreSQL defaults to Read Committed.** Its Repeatable Read is snapshot isolation and *does* prevent phantoms, going beyond the standard.
- **MySQL/InnoDB defaults to Repeatable Read**, and prevents phantoms in most cases via gap locks — a different mechanism with different deadlock behaviour.

"What's your database's default, and what does that default still allow?" is the question behind most isolation interview questions. Saying "Postgres is Read Committed, so I still have to handle lost updates myself" lands well.

## Why Read Committed doesn't save you

Read Committed guarantees only that you never see uncommitted data. Each statement sees a fresh snapshot. Nothing about it says "the row you read is still what you think when you write."

In the double-spend, neither transaction read dirty data — B read a committed 100. The problem isn't the read, it's the **gap between reading and writing**. Isolation levels below Serializable simply do not close that gap for you.

## Three ways to actually fix it

**1. Don't read-modify-write. Let the database do the arithmetic.**

\`\`\`sql
UPDATE accounts SET balance = balance - 80 WHERE id = ? AND balance >= 80;
\`\`\`

One atomic statement. The row is locked for the duration of the update, the check and the write are inseparable, and \`rowCount === 0\` tells you it was declined. This is the best fix when it's expressible: no extra round trip, no retry loop.

**2. Pessimistic: take the lock while you read.**

\`\`\`sql
BEGIN;
SELECT balance FROM accounts WHERE id = ? FOR UPDATE;  -- other txns now block here
-- ...application logic...
UPDATE accounts SET balance = ? WHERE id = ?;
COMMIT;
\`\`\`

\`FOR UPDATE\` takes a row lock at read time, so B waits until A commits and then reads 20. Use it when the decision genuinely needs application logic between read and write. The cost: contention, and every lock you hold is a deadlock you might participate in.

**3. Optimistic: detect the collision and retry.**

\`\`\`sql
UPDATE accounts SET balance = ?, version = version + 1 WHERE id = ? AND version = ?;
\`\`\`

If nobody else touched the row, \`version\` still matches and one row updates. If someone did, zero rows update — you re-read and retry. Better than locking under low contention, worse under high (a retry storm). This is the same idea as a compare-and-swap.

## Write skew, and why snapshot isolation doesn't stop it

The canonical example: an on-call rota with the rule *at least one doctor on call.* Two doctors, both on call, both request leave simultaneously.

Each transaction runs \`SELECT count(*) FROM oncall WHERE on_call = true\` and sees 2. Two is more than one, so each writes \`on_call = false\` **for a different row**. Both commit. Nobody is on call.

No lost update — they wrote different rows. No dirty read. Snapshot isolation is perfectly happy, because each transaction's write doesn't conflict with the other's write. The invariant spanned *rows*, and each transaction validated it against a snapshot that was already stale.

This is why \`SELECT ... FOR UPDATE\` on the rows you *read* (materialising the conflict) or true Serializable is required. It's also why write skew is the favourite senior-level probe: it defeats the intuition that "a transaction makes it safe."

## Serializable, and the price

Serializable guarantees the result equals *some* serial order. Modern Postgres does this with **SSI** — it lets transactions run optimistically, tracks read/write dependencies, and aborts one when a genuine cycle appears.

Which means the price is not just throughput: **your application must be prepared to retry.** A Serializable transaction can fail at COMMIT with a serialization error, and code that doesn't retry is code that surfaces random 500s under load. Wrapping every transaction in Serializable without a retry loop is a worse system than Read Committed with the atomic UPDATE above.

## Interview traps

1. **"I wrapped it in a transaction, so it's safe."** — the single most common misconception. Transactions give atomicity; isolation is a separate, tunable dial.
2. Not knowing your engine's **default** level, or thinking the SQL standard names mean the same thing everywhere.
3. Reaching for Serializable **without a retry loop.**
4. Not distinguishing **lost update** (same row) from **write skew** (different rows, shared invariant) — they need different fixes.
5. Using \`FOR UPDATE\` everywhere and creating a deadlock farm, when one atomic UPDATE would do.
6. Forgetting that a long transaction holds its snapshot — bloating the database and blocking cleanup.

## The 60-second summary

> Isolation levels define which concurrency anomalies your database still permits, and every level below Serializable permits some. Read Committed — Postgres's default — only promises you won't read uncommitted data; it does nothing about the gap between reading a value and writing based on it, which is why read-modify-write double-spends. Fix it by making the check and the write one atomic statement, or by locking at read time with FOR UPDATE, or with an optimistic version column and a retry. Write skew is the subtle one: two transactions write different rows, each valid alone, together breaking a shared invariant — snapshot isolation won't catch it, only materialising the conflict or Serializable will. And Serializable means your code must handle serialization failures and retry.
`,
};
