export const raftConsensus = {
  slug: "raft-consensus",
  title: "Raft: Leader Election, Replication & Commit Safety",
  hook: "A replicated system needs one agreed history despite crashes and delayed messages. Raft builds that from three ideas — terms, a leader, and a majority — and the commit rule is where the subtlety lives.",
  tags: ["Consensus", "Distributed Systems"],
  minutes: 35,
  level: "Senior IC",
  prerequisites: "Replication basics, quorums, and why split-brain is dangerous.",
  afterThis: "Two-Phase Commit — contrast Raft's availability with 2PC's blocking behavior.",
  suggestedFirstPass: "Follow the three sub-problems in order: leader election → log replication → commit safety. Raft is designed to be read that way.",
  references: [
    { label: "Ongaro & Ousterhout — In Search of an Understandable Consensus Algorithm", url: "https://raft.github.io/raft.pdf" },
    { label: "The Raft site (visualization)", url: "https://raft.github.io/" },
  ],
  body: `
## The problem consensus solves

Replicate data across five machines so it survives failures. Now a write arrives — which replica decides the order, and how do the others agree, given that machines crash and messages arrive late or out of order? You need the cluster to agree on a single, ordered history of operations even as a minority fails. That's **consensus**, and Raft is the algorithm designed to be *understandable* (Paxos solves the same problem but is famously hard to reason about; Raft trades nothing in correctness for clarity, which is why it's what etcd, Consul, TiKV, and CockroachDB use).

Raft decomposes the problem into three pieces: **leader election**, **log replication**, and **safety** (the rules that keep it correct). Understand those three and you understand Raft.

## Terms and the single leader

Time is divided into **terms** — numbered epochs (1, 2, 3…). Each term has **at most one leader**. A term is Raft's logical clock: every message carries a term number, and a node always defers to a higher term (if you hear a term greater than yours, you step down and update). This is how stale leaders get neutralized — they're on an old term, and the moment they contact anyone current, they learn they're obsolete.

A node is a **follower**, **candidate**, or **leader**. Followers are passive; they just answer the leader and vote. The leader handles all client writes and replicates them.

## Leader election

Each follower runs a randomized **election timeout** (say 150-300ms). If it hears nothing from a leader in that window, it assumes the leader is dead, increments the term, becomes a **candidate**, votes for itself, and asks everyone else for votes.

A node grants its vote if the candidate's term is current and the candidate's log is at least as up-to-date as its own (the up-to-date check is a safety rule — more below). A candidate that collects votes from a **majority** becomes leader and immediately starts sending heartbeats to assert authority.

Two elegant details:
- **Randomized timeouts** prevent split votes: if everyone timed out simultaneously they'd all become candidates and split the vote forever. Randomization means one node usually times out first and wins before others start.
- **Majority (quorum)** is the crux: because any two majorities of the same cluster overlap in at least one node, two leaders can't both win the same term — the overlapping node would have to vote twice. This is why Raft needs an **odd number of nodes** and tolerates ⌊N/2⌋ failures (5 nodes survive 2 down).

## Log replication

Every operation is a **log entry** \`{ term, index, command }\`. The leader appends a client command to its log, then sends \`AppendEntries\` to followers. A follower appends the entry only if its log matches the leader's up to that point (the **Log Matching Property**: if two logs have an entry with the same index and term, they're identical up to that index — a consistency check on every append that self-heals divergence).

An entry is **committed** once the leader has replicated it to a **majority**. Committed means durable and permanent — it will survive in the elected history forever. The leader then applies it to its state machine and tells followers the new commit index so they apply it too. Clients see a write succeed only after it's committed.

## The commit rule — where people get it wrong

The subtle part interviewers love: **a leader may only directly commit entries from its own current term.** It cannot look at an entry from a *previous* term, see it's on a majority, and declare it committed — even though that seems safe.

Why? A classic scenario (Raft paper Figure 8): an entry from term 2 is replicated to a majority but not yet committed. Leaders change; a new leader from term 4 could still be overwritten by an even newer leader that didn't have that term-2 entry, *un-committing* something you thought was safe. The fix: a new leader commits entries from older terms only **indirectly** — by committing a *new* entry from its own term on top, which (via Log Matching) drags the older entries along and makes them permanent too. Stating this rule — "commit only current-term entries directly; older ones ride along" — is the single strongest signal you actually understand Raft rather than just its cartoon.

## Safety properties (the guarantees)

- **Election Safety**: at most one leader per term (majority overlap).
- **Leader Append-Only**: a leader never overwrites or deletes its own log, only appends.
- **Log Matching**: identical (index, term) ⟹ identical prefix.
- **Leader Completeness**: a committed entry is present in the logs of all future leaders — guaranteed by the vote's up-to-date check, which refuses to elect a candidate missing committed entries.
- **State Machine Safety**: if a server has applied an entry at an index, no other server applies a different entry there. This is the top-level promise: everyone's state machine plays the same commands in the same order.

## Operational edges worth dropping

- **Cluster membership changes** (adding/removing nodes) can't be done naively — you can briefly have two disjoint majorities. Raft uses **joint consensus** (a transitional config that requires majorities of both old and new sets) to change membership safely. Just naming this hazard scores points.
- **Log compaction / snapshots**: the log grows forever; periodically each node snapshots its state machine and discards the prefix, shipping snapshots to lagging followers instead of replaying millions of entries.
- **Read consistency**: a naive read from the leader can be stale if it was just deposed. **Leader leases** or a **read-index** (confirm you're still leader via a heartbeat round before serving) give linearizable reads. Followers can serve stale reads if the app tolerates it.
- **Why odd node counts**: 3 and 4 both tolerate one failure (majority is 2 vs 3), so the 4th node adds cost without extra fault tolerance — go 3 or 5.

## Interview traps

1. *"The leader commits any entry on a majority."* — no; only current-term entries directly (Figure 8). Older ones commit indirectly.
2. Forgetting **majority overlap** as the reason two leaders can't coexist — it's the mechanical heart of the safety.
3. Even node counts — wasteful; consensus wants odd N.
4. Ignoring **membership change** safety — joint consensus exists precisely because naive reconfiguration can split the quorum.
5. Assuming leader reads are automatically linearizable — a stale leader exists; you need a lease or read-index.

## The 60-second summary

> Raft keeps a replicated log consistent using terms (a logical clock), a single leader per term elected by majority vote with randomized timeouts, and log replication where an entry commits once a majority has it. Majority overlap guarantees one leader per term and that committed entries survive into every future leader. The subtle safety rule is that a leader commits only its own current-term entries directly — older ones ride along on a new entry — which closes the Figure 8 hole. Add snapshots for log growth, joint consensus for membership changes, and a read-index for linearizable reads. Use odd node counts; five survives two failures.
`,
};
