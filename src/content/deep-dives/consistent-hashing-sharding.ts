export const consistentHashingSharding = {
  slug: "consistent-hashing-sharding",
  title: "Consistent Hashing & Sharding",
  hook: "Naive modulo hashing reshuffles almost every key when a node joins or leaves. Consistent hashing moves only the keys that must move — here's how, and where it still hurts.",
  tags: ["Distributed Systems", "Sharding"],
  minutes: 25,
  level: "Senior IC",
  prerequisites: "Hashing basics and why naive modulo-N sharding breaks on resize.",
  afterThis: "Caching at Scale — consistent hashing is what keeps a cache warm through node changes.",
  suggestedFirstPass: "Understand the ring + virtual nodes first; the rest is consequences of those two ideas.",
  references: [
    { label: "Karger et al. — Consistent Hashing and Random Trees (1997)" },
    { label: "Amazon Dynamo paper (2007)" },
  ],
  body: `
## The problem with modulo

When data outgrows one machine, you shard: \`node = hash(key) % N\`. It works until N changes. Go from 4 nodes to 5 and \`hash(key) % 5\` disagrees with \`hash(key) % 4\` for **~80% of keys** — nearly every key now lives on the "wrong" node. For a cache that's a total cold start (an avalanche); for a database it's a full-cluster data migration triggered by adding *one* machine. The requirement is obvious in hindsight: **adding or removing a node should move only ~1/N of the keys.**

## The ring

Consistent hashing maps both **nodes and keys onto the same circular hash space** (say 0 to 2³²−1). A key belongs to the first node clockwise from its position. That's the entire algorithm.

- **Add a node**: it lands somewhere on the ring and takes over only the arc between it and its counter-clockwise neighbor — keys elsewhere are untouched. ~K/N keys move.
- **Remove a node**: its arc falls to its clockwise successor. Again ~K/N.

Lookup is a binary search over the sorted node positions — O(log N) with N in the hundreds, effectively free.

## Virtual nodes: the fix that makes it real

With one point per node, the arcs are wildly uneven — random positions on a circle produce arcs differing by 10× — and when a node dies, its *entire* load lands on a single successor. The fix is **virtual nodes (vnodes)**: hash each physical node to 100–1000 points on the ring.

- **Balance**: many random arcs per node average out; load spread tightens dramatically.
- **Failure spreading**: a dead node's vnodes scatter its load across *many* successors instead of one.
- **Heterogeneity**: a machine with 2× capacity simply gets 2× the vnodes.

Interview one-liner: "Consistent hashing without vnodes is a correct algorithm with unusable variance; vnodes are what production systems actually run" (Cassandra and DynamoDB-style stores both do).

## What consistent hashing does NOT solve

**Hot keys.** One viral key still lives on one node, and no hashing scheme fixes popularity skew — the answers live at other layers: replicate the hot key's reads, cache above the ring, or split the key (\`key#1..k\`).

**Rebalancing data still costs.** The ring tells you *which* keys move; the bytes still have to stream over the network while the system serves traffic. Real systems move data in background chunks with throttles, serve reads from the old owner until handoff completes, and double-write during the transition. "The ring minimizes *what* moves; the migration machinery is still where the engineering lives."

**Membership changes need agreement.** Every router must agree on the ring, or two nodes both think they own a key. Options: a coordination service (ZooKeeper/etcd) holding ring state, gossip protocols (Cassandra), or a central metadata service. Mention that split-brain over ring membership is how you get two owners for one shard.

## The alternative: range sharding

Hashing destroys order — range queries (\`WHERE ts BETWEEN ...\`) must scatter to every shard. **Range sharding** assigns contiguous key ranges to shards (HBase, CockroachDB, Spanner): range scans hit few shards, and shards split/merge dynamically as they grow. Cost: **sequential writes hammer the tail shard** (monotonic keys like timestamps or auto-increment IDs all land on the last range — the classic hotspot), fixed by salting keys or designing key prefixes for spread.

The interview fork: *hash sharding for uniform point-access load; range sharding when range queries dominate — and each one's hotspot is the other's strength.*

## Resharding war stories worth citing

- Doubling partitions (2→4→8) keeps modulo migrations bounded (each key either stays or moves to exactly one new place) — a common mid-tier answer when full consistent hashing is overkill.
- **Directory-based sharding** — an explicit key→shard lookup table — is the "boring but flexible" option: arbitrary placement, easy migration (update the pointer), at the cost of a lookup service that becomes its own availability and latency dependency (usually cached aggressively).

## Interview traps

1. *"Consistent hashing balances the load."* — only with vnodes, and only for *key-count*, never for per-key traffic skew.
2. *"We'll just rehash when we scale."* — say the % of keys that move under modulo vs the ring; that number is the entire justification.
3. *"Where does the ring live?"* — if you can't answer (config service, gossip, metadata service), the design has a split-brain hole.
4. Bonus vocabulary: **rendezvous (HRW) hashing** — for each key, score every node and pick the max; same minimal-movement property, no ring to maintain; great when N is small. Jump hash for numbered buckets. Knowing an alternative exists signals depth.

## The 60-second interview summary

> Modulo sharding moves ~all keys when N changes; consistent hashing puts nodes and keys on one ring so membership changes move only ~1/N. Production rings need virtual nodes for balance, failure spreading, and weighted capacity. It doesn't fix hot keys, doesn't make migration free, and requires agreed ring membership. If range queries dominate, use range sharding instead and defend against tail-shard hotspots. Hash for point lookups, range for scans — each hotspots where the other shines.
`,
};
