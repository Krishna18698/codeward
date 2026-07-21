export const matchingEngine = {
  slug: "matching-engine",
  title: "Matching Engine & Order Book",
  hook: "The core of every exchange — FX, crypto, equities. Orders pour in; the engine keeps a price-time priority book and matches each against the best opposite side, deterministically, at brutal latency.",
  tags: ["Fintech", "Distributed Systems"],
  minutes: 32,
  level: "Senior IC",
  prerequisites: "Data-structure fluency (heaps/trees) and a feel for single-threaded determinism.",
  afterThis: "Raft — how the matching engine's state is replicated without losing determinism.",
  suggestedFirstPass: "Start with why the core is single-threaded and deterministic; every other decision follows from that constraint.",
  body: `
## What it must do

An exchange takes buy and sell orders for an instrument and **matches** them: a buyer willing to pay ≥ a seller's ask trades. The component that does this is the **matching engine**, and it maintains the **order book** — all resting (unmatched) orders, organized so it can instantly find the best price to match against. The bar is unusual: **deterministic, fair, correct to the cent, and fast** (microseconds at serious venues). Money is on the line every match, so this is a correctness-first, latency-critical problem — a different flavor from web-scale CRUD.

## The order book structure

The book has two sides: **bids** (buy orders, sorted highest price first) and **asks** (sell orders, sorted lowest price first). The **best bid** and **best ask** are the top of each; the gap between them is the **spread**.

Matching follows **price-time priority**: match at the best price, and among orders at the same price, the one that arrived **first** trades first (FIFO). So the data structure is: price levels sorted by price, and within each level a FIFO queue of orders.

A common implementation: a map from price → a queue of orders at that price, plus a sorted structure (or two — one per side) over the price levels so "best price" is O(1) and inserting a new level is cheap. At the extreme low-latency end, prices are integers (ticks) and levels are an array indexed by price for O(1) access. The interview answer is "sorted price levels, FIFO within a level" — the exact structure depends on how much latency you're buying.

## Order types and the match loop

**Limit order** — "buy up to $100." Rests in the book if it can't match immediately; matches against the opposite side while the price is acceptable.

**Market order** — "buy now at any price." Never rests; sweeps the book, consuming best price levels until filled (or the book runs out — then it partially fills or is rejected depending on rules).

The match loop for an incoming buy limit at price P:
1. Look at the best ask. If ask ≤ P, they cross → **trade** at the resting order's price (price improvement goes to the taker), for the min of the two quantities.
2. Reduce both orders by the matched quantity; if the resting order is fully filled, remove it and move to the next ask.
3. Repeat while the best ask ≤ P and the incoming order has quantity left.
4. Whatever remains of the incoming order **rests** in the book at P.

Partial fills are the norm — a large order matches against several resting orders across price levels. Every match emits a **trade/execution event** downstream (to clearing, to the market data feed, to the users).

## Determinism and the single-threaded core

The non-obvious design choice: the matching core is usually **single-threaded**. Not for lack of cores — for **determinism and correctness**. Given the same ordered stream of orders, a single-threaded engine produces exactly one, reproducible sequence of trades. Concurrency would introduce races over price-time priority (who was really first?) and make the book's state non-deterministic — unacceptable when fairness is a legal requirement and disputes get audited.

So the pattern is: a **sequencer** assigns every incoming order a monotonic sequence number (fixing the canonical order), then a single-threaded matcher consumes that ordered stream. This is fast *because* it's single-threaded — no locks, everything in memory, cache-friendly (LMAX Disruptor is the famous example: millions of orders/sec on one thread by avoiding locks and cache misses). Throughput scales by sharding **by instrument** (each symbol's book is independent, so BTC-USD and ETH-USD run on separate engines), not by threading one book.

## Durability without dying

The book lives in memory for speed, but it can't just vanish on crash. The pattern is **event sourcing**: the input order stream is the durable log (append every sequenced order to a replicated log — Raft/Kafka-style — *before* matching). The book state is a deterministic function of that log, so on crash you **replay** the log to rebuild the exact book. Periodic **snapshots** bound replay time. Because matching is deterministic, the replayed book is bit-identical — which is the whole reason determinism matters operationally, not just legally. Replicas consume the same ordered log and stay in lockstep for hot failover.

## Conservation and correctness invariants

This is where the "prove it, don't assert it" idea lives (the Build-It theme). A matching engine has invariants that must hold after every event, checked continuously:
- **Quantity conservation**: total quantity traded on the buy side equals total on the sell side (every share bought was sold). If they diverge, you've created or destroyed an order — a critical bug.
- **No crossed book**: after matching, the best bid must be **below** the best ask (if bid ≥ ask they should have matched). A crossed book means the match loop missed a fill.
- **Price-time priority preserved**: an order never trades ahead of an equal-or-better-priced, earlier order.

Violating any of these is a ship-blocking bug; real engines assert them in tests and often in production.

## Interview traps

1. Ignoring **price-time priority** — matching at best price is half of it; FIFO within a price level (fairness) is the other half and is legally load-bearing.
2. Proposing a **multi-threaded matcher** for throughput — you break determinism and fairness; go single-threaded and shard by instrument.
3. Forgetting **durability/replay** — an in-memory book that can't be rebuilt from a log loses money on crash; event-source the input stream.
4. Matching at the **taker's** price — trades execute at the *resting* (maker's) price; price improvement goes to the incoming order.
5. Not stating the **conservation invariant** — quantity in = quantity out; the book never crosses. It's the correctness proof.

## The 60-second summary

> The order book keeps bids and asks by price-time priority — best price first, FIFO within a price level. Incoming orders match against the best opposite side at the resting order's price, partially filling across levels and resting the remainder. The matcher is single-threaded for determinism and fairness (concurrency would break price-time priority and reproducibility) and fed by a sequencer; scale by sharding per instrument, not threading one book. Durability is event sourcing — replicate the ordered input log, replay to rebuild the exact book, snapshot to bound replay. And it's correct only if the invariants hold every tick: quantity conserved, book never crossed, priority never jumped.
`,
};
