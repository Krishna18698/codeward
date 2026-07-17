export const kafkaFundamentals = {
  slug: "kafka-fundamentals",
  title: "Kafka: Partitions, Ordering & Delivery Guarantees",
  hook: "Almost every guarantee Kafka makes reduces to one primitive: a partition is an append-only log with a single leader. Build up from that and the failure modes explain themselves.",
  tags: ["Streaming", "Distributed Systems"],
  minutes: 30,
  body: `
## The one primitive

Strip Kafka to its core and there's a single idea: **a partition is an append-only log file, replicated across a few brokers, with exactly one leader accepting writes.** Producers append; the log assigns each record a monotonically increasing **offset**; consumers read forward from an offset they control. Everything else — ordering, throughput, delivery semantics, consumer groups — is a consequence.

A **topic** is just a named set of partitions. Throughput scales by adding partitions (more parallel logs, more parallel consumers). That's also the first trade-off: **ordering is guaranteed only *within* a partition**, never across a topic.

## Ordering: the key decides everything

Producers choose a partition per record — by default, \`hash(key) % partitions\`. Same key → same partition → strictly ordered. So the design question "do payment events for one account stay in order?" becomes "is the account ID the partition key?" — that's the whole answer.

Traps hiding in that sentence:
- **Records without keys** round-robin across partitions: no ordering at all. An unkeyed "events" topic silently has no order guarantee.
- **Changing the partition count changes the hash mapping** — the same key now lands on a different partition, and *old and new records for one key live in different partitions*. Cross-partition order is broken at the repartition boundary. This is why teams overprovision partitions upfront rather than resize later.
- **Hot keys**: one enormous account hashes to one partition; that partition's consumer becomes the bottleneck. Same hot-key problem as caches and shards — no free lunch from partitioning.

## Durability: acks and ISR

Each partition has replicas; the **ISR** (in-sync replica set) are those caught up with the leader. Producer \`acks\` picks your durability:
- \`acks=0\` — fire and forget. Lost on any hiccup.
- \`acks=1\` — leader wrote it. If the leader dies before followers copy it, **acknowledged data is lost**.
- \`acks=all\` + \`min.insync.replicas=2\` — write is acknowledged only when the ISR has it. Survives leader loss; costs one round of replication latency.

The classic incident: \`acks=all\` but \`min.insync.replicas=1\` — ISR shrinks to just the leader during a network blip, writes still ack, leader dies, data gone *despite* "acks=all". The two settings only mean something together. Related knob: \`unclean.leader.election=false\` — never elect an out-of-sync replica as leader; choose unavailability over silent data loss.

## Consumers: groups, offsets, rebalancing

A **consumer group** divides a topic's partitions among its members — each partition is owned by exactly one consumer in the group (that's how "one processor per key's stream" happens). More consumers than partitions? The extras idle. That makes **partition count = max parallelism**, decided at topic creation.

Consumers periodically **commit offsets** ("I've processed through 4127"). The commit-vs-process ordering is the delivery-semantics fork:
- Process then commit → crash between them → reprocessing → **at-least-once** (the default posture).
- Commit then process → crash between them → skipped records → **at-most-once** (rarely what anyone wants).

**Rebalancing** — when a consumer joins/leaves/dies, partition ownership reshuffles. During the classic eager rebalance, the *whole group* stops consuming; a crash-looping consumer can keep the group perpetually rebalancing and effectively down. Also: a consumer that takes longer than \`max.poll.interval.ms\` to process a batch is *presumed dead* and evicted, triggering a rebalance, which redelivers the same batch to a peer, which is also slow... the "poison pill" spiral. Answer: fix processing time, tune the interval, and route unprocessable records to a dead-letter topic instead of retrying forever.

## "Exactly-once"

Delivery is at-least-once; duplicates are a fact. The honest phrase is **exactly-once *effects***, achieved either by:
1. **Idempotent consumers** — dedupe on a business key or record ID at the sink (the pattern from the idempotency deep-dive; usually the right answer), or
2. **Kafka transactions** — idempotent producers (sequence numbers dedupe broker-side retries) plus transactional writes spanning output records *and* offset commits; consumers read \`read_committed\`. Real, but adds latency and complexity, and helps only within Kafka-to-Kafka pipelines — the moment you write to an external DB or call an API, you're back to idempotency at the sink.

Interviewers respect: "I'd design the consumer to be idempotent and treat exactly-once as an effects property, not a delivery property."

## Operational things worth dropping

- **Retention is time/size-based, not consumption-based** — Kafka isn't a queue that deletes on ack. Slow consumers falling behind retention silently lose data ("offset out of range").
- **Consumer lag** (latest offset − committed offset, per partition) is *the* health metric. Alert on lag growth, not lag existence.
- **Compacted topics** keep the latest record per key — a changelog you can replay to rebuild state (this is how Kafka Streams state stores and CDC pipelines work).
- Back-of-envelope: a well-tuned broker handles hundreds of MB/s; partitions in the low thousands per broker before metadata pressure hurts. Enough precision to size a design.

## The 60-second interview summary

> A topic is N append-only logs; each has one leader; order holds only within a partition, so the partition key is a design decision — key by the entity whose order matters, and know that resizing partitions breaks that mapping. Durability = acks=all with min.insync.replicas ≥ 2 and unclean election off. Consumer groups give each partition one owner; process-then-commit yields at-least-once, so consumers must be idempotent — exactly-once is an effects property. Watch consumer lag, dead-letter poison pills, and remember retention deletes by age, not by ack.
`,
};
