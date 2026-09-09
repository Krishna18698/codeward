export const databaseIndexes = {
  slug: "database-indexes",
  title: "Database Indexes",
  hook: "Someone added one column to a SELECT and the query got 40× slower. Nothing about the index changed. This is the failure that teaches you what an index actually is.",
  tags: ["Databases", "Core CS"],
  category: "CORE_CS" as const,
  minutes: 28,
  level: "Any level",
  prerequisites: "You've written SQL and seen the word EXPLAIN.",
  afterThis: "Transaction Isolation — the other half of why a database behaves differently under load.",
  suggestedFirstPass: "Read the composite-index section twice. Column order is the single most common real-world index mistake, and it's the one interviewers probe.",
  references: [
    { label: "Use The Index, Luke — Markus Winand" },
    { label: "PostgreSQL docs — Indexes and EXPLAIN" },
  ],
  body: `
## The incident

A dashboard query ran in 8ms for a year. A product change needed one more field, so someone added it to the SELECT:

\`\`\`sql
-- before: 8ms
SELECT user_id, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20;

-- after: 340ms
SELECT user_id, created_at, shipping_note FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20;
\`\`\`

Same table, same index, same rows, same WHERE clause. 40× slower. If you can explain this, you understand indexes. If "we have an index on user_id" is your whole mental model, you can't.

## What a B-tree index actually is

Not a magic "make it fast" flag — a **second, sorted copy of some of your columns**, with a pointer back to the row. That's the entire idea, and every behaviour below follows from it.

Because it's sorted, the database can binary-search it: O(log n) to find an entry instead of O(n) scanning the table. A B-tree specifically is a wide, shallow tree — hundreds of entries per node, so even a billion rows is ~4-5 levels deep, which means ~4-5 disk reads.

Two consequences people miss:

1. **The index holds only the columns you indexed.** Everything else lives in the table.
2. **Sorted order is a resource.** An index isn't only for lookups — it can satisfy an ORDER BY for free, because the data is *already* in that order.

## Solving the incident: covering indexes

The index was:

\`\`\`sql
CREATE INDEX idx_orders_user_created ON orders (user_id, created_at);
\`\`\`

The original query needed \`user_id\` and \`created_at\` — **both in the index**. So the database walked the index, took 20 entries in order, and returned. It never touched the table at all. That's an **index-only scan** (Postgres) or a **covering index** (MySQL: "Using index" in EXPLAIN).

Adding \`shipping_note\` broke it. That column isn't in the index, so for every row the database must now go back to the table to fetch it — a **heap fetch**, one random I/O per row. Twenty random reads instead of zero, plus the visibility check.

The fix is to include the column so the index covers the query again:

\`\`\`sql
CREATE INDEX idx_orders_user_created ON orders (user_id, created_at) INCLUDE (shipping_note);
\`\`\`

\`INCLUDE\` stores the column in the leaf without making it part of the sort key — you get the covering read without widening the tree. That distinction, key columns versus included columns, is a strong senior signal.

## Composite indexes: column order is the whole game

The most common real mistake. An index on \`(a, b)\` is sorted by \`a\`, then by \`b\` **within each a**. Like a phone book sorted by last name then first name.

That index serves:
- \`WHERE a = ?\` ✅
- \`WHERE a = ? AND b = ?\` ✅
- \`WHERE a = ? ORDER BY b\` ✅ — free ordering, no sort step

It does **not** serve:
- \`WHERE b = ?\` ❌ — you can't find everyone named "James" in a phone book sorted by surname

This is the **leftmost prefix rule**: an index on \`(a, b, c)\` can be used for \`a\`, for \`(a, b)\`, and for \`(a, b, c)\` — never for \`b\` alone or \`(b, c)\`.

One more subtlety that separates people who've read about this from people who've debugged it: a **range predicate stops the prefix**. In \`WHERE a = ? AND b > ? AND c = ?\` on \`(a, b, c)\`, the index narrows on \`a\`, ranges on \`b\`, and then \`c\` **cannot** be used to seek — once you're scanning a range of \`b\`, the \`c\` values inside it are no longer in sorted order. Equality columns first, range column last, is the rule of thumb.

## Why the planner ignores your index

"There's an index and it's doing a sequential scan anyway" is not a bug — it's usually the planner being right.

**Selectivity** is the reason. If your predicate matches 40% of the table, using the index means: read index entry, jump to the table, read index entry, jump to the table — random I/O, millions of times. A sequential scan reads the whole table in physical order, which storage is dramatically better at. The planner estimates both and picks the cheaper one. Somewhere around 5-20% selectivity it flips.

So: **an index on a low-cardinality column is usually useless.** \`status\` with three values, \`is_deleted\` with two — an index on those alone rarely earns its keep. (The exception worth naming: a *partial* index, \`WHERE status = 'pending'\`, when the interesting value is rare.)

When the planner gets it wrong, it's almost always **stale statistics** — the table grew or its distribution shifted and the planner is costing against an old histogram. \`ANALYZE\` is the fix, not an index hint.

## Predicates that silently kill an index

Each of these turns a seek into a scan. They're worth memorising because they're the actual bugs:

\`\`\`sql
WHERE YEAR(created_at) = 2024        -- ❌ function on the column
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'  -- ✅ same thing, sargable

WHERE email LIKE '%@corp.com'        -- ❌ leading wildcard: no usable prefix
WHERE email LIKE 'krishna%'          -- ✅ prefix is a range

WHERE user_id = '42'                 -- ❌ if user_id is an int, an implicit cast can disable it
WHERE phone = 4155550100             -- ❌ if phone is a varchar, same problem inverted
\`\`\`

The general rule: **the indexed column must appear bare on one side of the comparison.** Wrap it in anything — a function, a cast, a concatenation — and the sorted order no longer applies to what you're asking for. The term for a predicate that can use an index is *sargable*, and it's a useful word to know.

## Indexes are not free

Every index is a second structure that must be kept correct. An INSERT writes the row *and* every index. An UPDATE to an indexed column deletes and reinserts the index entry. So:

- Write throughput drops roughly linearly with index count.
- Indexes consume storage and cache — a bloated index evicts hot data from memory.
- Redundant indexes are common: if you have \`(a, b)\`, an index on \`(a)\` alone is **already covered by the prefix rule** and can usually be dropped.

"How many indexes?" has no fixed answer, but "we added indexes until it was fast" is a smell. The good answer is: index for the queries you actually run, drop what nothing uses (both Postgres and MySQL expose index usage counters), and remember that a table where writes dominate wants fewer.

## Interview traps

1. **"We have an index on that column"** — as an explanation for why a query is fast, without knowing whether it's *used*. Read EXPLAIN; don't assume.
2. **Wrong composite order** — indexing \`(created_at, user_id)\` when you always filter by user. It looks right and is nearly useless.
3. **Not knowing about covering / index-only scans** — this is the difference between a fast query and a fast query that stays fast.
4. **Indexing a boolean or a 3-value status** and expecting a speedup.
5. **Forgetting write cost** entirely — treating indexes as pure upside.
6. **Blaming the planner** instead of checking statistics and selectivity.

## The 60-second summary

> An index is a sorted copy of some columns plus a pointer back to the row, so lookups become O(log n) and ORDER BY on those columns is free. A composite index is sorted left to right, so only a leftmost prefix can be used — put equality columns first and the range column last. If every column a query needs lives in the index, the table is never touched (index-only scan); add one column that isn't, and you pay a random read per row, which is how a query gets 40× slower without the index changing. The planner will ignore an index when the predicate isn't selective, because sequential I/O beats millions of random jumps. And every index taxes every write, so index the queries you run, not the columns you have.
`,
};
