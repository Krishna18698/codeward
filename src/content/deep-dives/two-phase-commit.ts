export const twoPhaseCommit = {
  slug: "two-phase-commit",
  title: "Two-Phase Commit",
  hook: "Atomic commit across distributed participants: the protocol, its one fatal flaw every interviewer probes, and why the industry usually reaches for a saga instead.",
  tags: ["Distributed Systems"],
  minutes: 22,
  level: "Senior IC",
  prerequisites: "ACID transactions and the idea of a coordinator/participant protocol.",
  afterThis: "Saga, Outbox & CDC — the non-blocking pattern most systems reach for instead.",
  suggestedFirstPass: "Focus on the blocking/coordinator-failure window; that single weakness is why 2PC is usually avoided.",
  references: [
    { label: "Jim Gray — Notes on Database Operating Systems (1978)" },
  ],
  body: `
## What it's trying to do

You need N databases to commit *atomically* — all or nothing — as if they were one. Debit account A on shard 1, credit account B on shard 2, and never leave one done without the other. Within one database, the transaction log gives you this. Across databases, **two-phase commit (2PC)** is the classic protocol that tries to.

There's a coordinator and several participants. It runs in two phases:

**Phase 1 — Prepare (voting).** The coordinator asks every participant: "can you commit this?" Each does the work *provisionally*, writes it durably to its log, locks the affected rows, and replies **YES** (I promise I can commit — I've made it durable) or **NO**. Crucially, a YES is a binding promise: the participant must be able to commit later even if it crashes and restarts in between.

**Phase 2 — Commit/Abort.** If *all* voted YES, the coordinator writes "commit" to its own log and tells everyone to commit; they apply and release locks. If *any* voted NO (or timed out), it tells everyone to abort; they roll back their provisional work.

That's it. If everyone follows the protocol and nobody dies, you get atomicity across participants.

## The fatal flaw: blocking on coordinator failure

Here's the scenario every interviewer walks you into. A participant votes YES and is now waiting for the decision — holding its locks, committed to obeying. The **coordinator crashes** right after collecting votes, before broadcasting the decision.

The participant is stuck. It can't commit (maybe someone voted NO — it doesn't know). It can't abort (it promised YES — maybe everyone else committed). It must **hold its locks and wait** for the coordinator to recover. Every row it locked is now unavailable to the rest of the system, potentially for a long time.

This is why 2PC is called a **blocking protocol**: a single coordinator failure at the wrong moment freezes participants indefinitely. The coordinator is a single point of failure whose death doesn't just stop new work — it *holds existing work hostage*. Asking participants to "just decide among themselves" doesn't fully work either; the uncertainty is fundamental (this is what 3PC tries to patch, at the cost of more messages and its own edge cases under partitions — worth *naming*, rarely worth *using*).

## The other costs

- **Latency**: two round trips plus durable log writes at every participant before anything commits. Slow by construction.
- **Lock duration**: rows stay locked from prepare until the phase-2 decision arrives — across the network, not microseconds. Contention explodes under load.
- **Availability coupling**: the transaction commits only if *every* participant *and* the coordinator are up. Add a participant and you multiply the ways the whole thing can fail. This is the opposite of what microservices want.

## When 2PC is actually the right answer

Despite the reputation, it's not always wrong:

- **Inside a single database's distributed engine.** Spanner, CockroachDB, and YugabyteDB use 2PC internally across their shards — but paired with **Paxos/Raft-replicated participants**, so the coordinator and each participant are themselves fault-tolerant groups, not single processes. That removes the blocking-on-single-failure problem: a "participant" is a quorum that survives node loss. 2PC is fine when its parts don't individually fail.
- **XA transactions** across a database and a message broker within one trust boundary, for lower-throughput flows where you genuinely need atomicity and can tolerate the latency.

The pattern: **2PC works well when the participants are internally reliable (replicated) and few; it works badly across independent, singly-hosted microservices.**

## Why sagas usually win across services

For cross-service business operations (the place-order flow), the industry chose **sagas** (see the saga dive) over 2PC because sagas don't hold locks across the network and don't block on a coordinator: each step commits locally and immediately, and failures are handled by compensation rather than a global rollback. You trade *atomicity* for *eventual consistency + compensation* — and for services that must stay available and low-latency, that trade is almost always right.

The interview fork, said crisply: **2PC gives you atomicity but blocks and couples availability; sagas give you availability and no cross-network locks but only eventual consistency with compensating actions. Choose atomicity only when you truly need it and the participants are reliable; otherwise saga.**

## Interview traps

1. Not naming the **blocking problem** — it's *the* point of the question. "The coordinator can crash after a participant votes YES, leaving it holding locks with no decision."
2. *"3PC fixes it."* — it reduces blocking in some cases but adds messages and fails under network partitions; know it exists, don't recommend it casually.
3. *"Use 2PC across microservices."* — the availability coupling and lock-holding make it a poor fit; that's what sagas are for.
4. Missing that modern distributed SQL **does** use 2PC — but over Raft-replicated participants, which is why it's safe there.
5. Forgetting the coordinator must **log its decision durably** before broadcasting, so it can recover and re-inform participants — the recovery path is half the protocol.

## The 60-second summary

> 2PC gets atomic commit across participants: phase one, everyone durably prepares and votes; phase two, the coordinator commits only if all voted yes. Its fatal flaw is blocking — if the coordinator dies after a participant votes yes, that participant holds its locks indefinitely, so the coordinator is a hostage-taking single point of failure and the protocol is slow and availability-coupling. It's right inside distributed databases where participants are Raft-replicated and reliable; across independent microservices, prefer a saga — eventual consistency with compensation instead of blocking atomicity.
`,
};
