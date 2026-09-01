import type { BuildItProblem } from "./types";

export const consistentHashingRing: BuildItProblem = {
  slug: "consistent-hashing-ring",
  title: "Consistent Hashing Ring",
  category: "distributed",
  brief:
    "The key-to-node router behind a sharded cache/store, across four stages: a basic hash ring, virtual nodes for " +
    "balance, thread-safe membership changes with minimal remapping, then weighted nodes and replication. The hash " +
    "function is injected so placement is deterministic and testable. Each stage adds a constraint the last can't meet.",
  totalMinutes: 100,
  stages: [
    {
      stage: 1,
      title: "The hash ring",
      constraintAdded: "None yet — this is the baseline.",
      narrative:
        "You're sharding keys across a set of server nodes. Plain hash(key) % N breaks badly when N changes — almost every " +
        "key remaps. A consistent-hashing ring fixes that: place nodes at positions on a circular hash space and route each " +
        "key to the first node clockwise. The hash function is injected so tests can place nodes and keys at known positions.",
      prompt:
        "Implement a ring with addNode(node), removeNode(node), and getNode(key). Place each node at hash(node) on the ring. " +
        "getNode(key) returns the first node whose position is >= hash(key), wrapping around to the lowest-positioned node " +
        "if the key is past the last one. Return null if the ring is empty. Keep lookups efficient (sorted positions + " +
        "binary search, not a linear scan of all nodes per lookup, for the shape you'd actually ship).",
      skeletons: {
        csharp: {
          fileName: "HashRing.cs",
          code: `public class HashRing
{
    private readonly Func<string, int> _hash;

    public HashRing(Func<string, int> hash)
    {
        _hash = hash;
        // TODO: keep node positions sorted for clockwise lookup
    }

    public void AddNode(string node)
    {
        // TODO: place node at _hash(node)
        throw new NotImplementedException();
    }

    public void RemoveNode(string node)
    {
        // TODO: remove node's position from the ring
        throw new NotImplementedException();
    }

    public string? GetNode(string key)
    {
        // TODO: first node with position >= _hash(key), wrapping to the lowest.
        // Return null if the ring is empty.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "hash_ring.py",
          code: `from typing import Callable, Optional

class HashRing:
    def __init__(self, hash_fn: Callable[[str], int]):
        self._hash = hash_fn
        # TODO: keep node positions sorted for clockwise lookup

    def add_node(self, node: str) -> None:
        # TODO: place node at hash_fn(node)
        raise NotImplementedError

    def remove_node(self, node: str) -> None:
        # TODO: remove node's position from the ring
        raise NotImplementedError

    def get_node(self, key: str) -> Optional[str]:
        # TODO: first node with position >= hash_fn(key), wrapping to the lowest.
        # Return None if the ring is empty.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "HashRing.kt",
          code: `class HashRing(private val hash: (String) -> Int) {
    // TODO: keep node positions sorted for clockwise lookup

    fun addNode(node: String) {
        // TODO: place node at hash(node)
        TODO()
    }

    fun removeNode(node: String) {
        // TODO: remove node's position from the ring
        TODO()
    }

    fun getNode(key: String): String? {
        // TODO: first node with position >= hash(key), wrapping to the lowest.
        // Return null if the ring is empty.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "clockwise-lookup", description: "getNode returns the first node clockwise from hash(key) — the smallest position >= hash(key).", weight: 35 },
        { id: "wrap-around", description: "A key past the highest node position wraps around to the lowest-positioned node.", weight: 35 },
        { id: "add-remove", description: "addNode and removeNode correctly insert/delete a node's position, and lookups reflect the current membership.", weight: 30 },
      ],
      canonicalApproach:
        "Keep node positions in a sorted structure (a sorted array of positions with a parallel position->node map, or a " +
        "tree map). getNode binary-searches for the first position >= hash(key); if the search runs off the end, wrap to " +
        "index 0. addNode/removeNode insert/delete the position keeping the structure sorted. Lookups are O(log N).",
      commonPitfalls: [
        "Linear-scanning all node positions on every lookup — works, but throws away the whole point of keeping the ring sorted.",
        "Forgetting the wrap-around, so keys hashing past the last node return null instead of the first node.",
        "Using hash(key) % N (modulo the node count) somewhere, which reintroduces the mass-remap-on-resize problem the ring exists to avoid.",
      ],
      tests: {
        python: `# --- tests (read-only) ---
def _run():
    pos = {"nodeA": 10, "nodeB": 20, "nodeC": 30,
           "k1": 5, "k2": 15, "k3": 25, "k4": 35}
    ring = HashRing(lambda s: pos[s])
    for n in ("nodeA", "nodeB", "nodeC"):
        ring.add_node(n)
    assert ring.get_node("k1") == "nodeA", "5 -> A@10"
    assert ring.get_node("k2") == "nodeB", "15 -> B@20"
    assert ring.get_node("k3") == "nodeC", "25 -> C@30"
    assert ring.get_node("k4") == "nodeA", "35 -> wraps to A@10"
    ring.remove_node("nodeB")
    assert ring.get_node("k2") == "nodeC", "after removing B, 15 -> C@30"
    assert ring.get_node("k1") == "nodeA", "k1 unaffected by B's removal"
    assert ring.get_node("k3") == "nodeC", "k3 unaffected by B's removal"
    print("__BUILD_IT_PASS__")

_run()`,
        kotlin: `// --- tests (read-only) ---
fun main() {
    val pos = mapOf("nodeA" to 10, "nodeB" to 20, "nodeC" to 30,
                    "k1" to 5, "k2" to 15, "k3" to 25, "k4" to 35)
    val ring = HashRing { s -> pos.getValue(s) }
    for (n in listOf("nodeA", "nodeB", "nodeC")) ring.addNode(n)
    check(ring.getNode("k1") == "nodeA") { "5 -> A@10" }
    check(ring.getNode("k2") == "nodeB") { "15 -> B@20" }
    check(ring.getNode("k3") == "nodeC") { "25 -> C@30" }
    check(ring.getNode("k4") == "nodeA") { "35 -> wraps to A@10" }
    ring.removeNode("nodeB")
    check(ring.getNode("k2") == "nodeC") { "after removing B, 15 -> C@30" }
    check(ring.getNode("k1") == "nodeA") { "k1 unaffected" }
    check(ring.getNode("k3") == "nodeC") { "k3 unaffected" }
    println("__BUILD_IT_PASS__")
}`,
        csharp: `// --- tests (read-only) ---
class TestRunner
{
    static void Check(bool cond, string msg) { if (!cond) throw new Exception("FAILED: " + msg); }
    static void Main()
    {
        var pos = new Dictionary<string, int> {
            {"nodeA",10},{"nodeB",20},{"nodeC",30},
            {"k1",5},{"k2",15},{"k3",25},{"k4",35}
        };
        var ring = new HashRing(s => pos[s]);
        foreach (var n in new[] {"nodeA","nodeB","nodeC"}) ring.AddNode(n);
        Check(ring.GetNode("k1") == "nodeA", "5 -> A@10");
        Check(ring.GetNode("k2") == "nodeB", "15 -> B@20");
        Check(ring.GetNode("k3") == "nodeC", "25 -> C@30");
        Check(ring.GetNode("k4") == "nodeA", "35 -> wraps to A@10");
        ring.RemoveNode("nodeB");
        Check(ring.GetNode("k2") == "nodeC", "after removing B, 15 -> C@30");
        Check(ring.GetNode("k1") == "nodeA", "k1 unaffected");
        Check(ring.GetNode("k3") == "nodeC", "k3 unaffected");
        Console.WriteLine("__BUILD_IT_PASS__");
    }
}`,
      },
    },
    {
      stage: 2,
      title: "Virtual nodes",
      constraintAdded: "With few physical nodes the ring is lumpy; each node needs many positions.",
      narrative:
        "With only a handful of physical nodes, the arcs between ring positions are wildly uneven, so load is badly skewed " +
        "and removing one node dumps its entire arc onto a single neighbour. The fix is virtual nodes: place each physical " +
        "node at many ring positions, so its share of the key space is spread out and averages closer to fair.",
      prompt:
        "Extend the ring so each physical node is placed at `vnodes` positions. Place virtual node i of a physical node at " +
        "hash(node + \"#\" + i) for i in 0..vnodes-1. getNode(key) must still return the physical node name. removeNode " +
        "removes all of a physical node's virtual positions. (The vnode id format node + \"#\" + i is fixed so placement is " +
        "well-defined.)",
      skeletons: {
        csharp: {
          fileName: "HashRing.cs",
          code: `public class HashRing
{
    private readonly Func<string, int> _hash;
    private readonly int _vnodes;

    public HashRing(Func<string, int> hash, int vnodes)
    {
        _hash = hash;
        _vnodes = vnodes;
        // TODO: ring positions now map to the OWNING physical node
    }

    public void AddNode(string node)
    {
        // TODO: place _vnodes positions at _hash(node + "#" + i), each owned by node
        throw new NotImplementedException();
    }

    public void RemoveNode(string node)
    {
        // TODO: remove all virtual positions belonging to node
        throw new NotImplementedException();
    }

    public string? GetNode(string key)
    {
        // TODO: clockwise from _hash(key), return the owning physical node
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "hash_ring.py",
          code: `from typing import Callable, Optional

class HashRing:
    def __init__(self, hash_fn: Callable[[str], int], vnodes: int):
        self._hash = hash_fn
        self._vnodes = vnodes
        # TODO: ring positions now map to the OWNING physical node

    def add_node(self, node: str) -> None:
        # TODO: place vnodes positions at hash_fn(f"{node}#{i}"), each owned by node
        raise NotImplementedError

    def remove_node(self, node: str) -> None:
        # TODO: remove all virtual positions belonging to node
        raise NotImplementedError

    def get_node(self, key: str) -> Optional[str]:
        # TODO: clockwise from hash_fn(key), return the owning physical node
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "HashRing.kt",
          code: `class HashRing(private val hash: (String) -> Int, private val vnodes: Int) {
    // TODO: ring positions now map to the OWNING physical node

    fun addNode(node: String) {
        // TODO: place vnodes positions at hash("$node#$i"), each owned by node
        TODO()
    }

    fun removeNode(node: String) {
        // TODO: remove all virtual positions belonging to node
        TODO()
    }

    fun getNode(key: String): String? {
        // TODO: clockwise from hash(key), return the owning physical node
        TODO()
    }
}`,
        },
      },
      tests: {
        python: `# --- tests (read-only) ---
def _run():
    pos = {
        "A#0": 10, "A#1": 40,
        "B#0": 20, "B#1": 30,
        "k1": 5, "k2": 15, "k3": 25, "k4": 35, "k5": 45,
    }
    ring = HashRing(lambda s: pos[s], vnodes=2)
    ring.add_node("A")  # positions 10, 40
    ring.add_node("B")  # positions 20, 30
    assert ring.get_node("k1") == "A", "5 -> A#0@10"
    assert ring.get_node("k2") == "B", "15 -> B#0@20"
    assert ring.get_node("k3") == "B", "25 -> B#1@30"
    assert ring.get_node("k4") == "A", "35 -> A#1@40"
    assert ring.get_node("k5") == "A", "45 -> wraps to A#0@10"
    ring.remove_node("B")  # removes both B vnodes
    assert ring.get_node("k2") == "A", "15 -> A#1@40 after B removed"
    assert ring.get_node("k3") == "A", "25 -> A#1@40 after B removed"
    print("__BUILD_IT_PASS__")

_run()`,
        kotlin: `// --- tests (read-only) ---
fun main() {
    val pos = mapOf(
        "A#0" to 10, "A#1" to 40, "B#0" to 20, "B#1" to 30,
        "k1" to 5, "k2" to 15, "k3" to 25, "k4" to 35, "k5" to 45,
    )
    val ring = HashRing({ s -> pos.getValue(s) }, 2)
    ring.addNode("A")
    ring.addNode("B")
    check(ring.getNode("k1") == "A") { "5 -> A#0@10" }
    check(ring.getNode("k2") == "B") { "15 -> B#0@20" }
    check(ring.getNode("k3") == "B") { "25 -> B#1@30" }
    check(ring.getNode("k4") == "A") { "35 -> A#1@40" }
    check(ring.getNode("k5") == "A") { "45 -> wraps to A#0@10" }
    ring.removeNode("B")
    check(ring.getNode("k2") == "A") { "15 -> A#1@40 after B removed" }
    check(ring.getNode("k3") == "A") { "25 -> A#1@40 after B removed" }
    println("__BUILD_IT_PASS__")
}`,
        csharp: `// --- tests (read-only) ---
class TestRunner
{
    static void Check(bool cond, string msg) { if (!cond) throw new Exception("FAILED: " + msg); }
    static void Main()
    {
        var pos = new Dictionary<string, int> {
            {"A#0",10},{"A#1",40},{"B#0",20},{"B#1",30},
            {"k1",5},{"k2",15},{"k3",25},{"k4",35},{"k5",45}
        };
        var ring = new HashRing(s => pos[s], 2);
        ring.AddNode("A");
        ring.AddNode("B");
        Check(ring.GetNode("k1") == "A", "5 -> A#0@10");
        Check(ring.GetNode("k2") == "B", "15 -> B#0@20");
        Check(ring.GetNode("k3") == "B", "25 -> B#1@30");
        Check(ring.GetNode("k4") == "A", "35 -> A#1@40");
        Check(ring.GetNode("k5") == "A", "45 -> wraps to A#0@10");
        ring.RemoveNode("B");
        Check(ring.GetNode("k2") == "A", "15 -> A#1@40 after B removed");
        Check(ring.GetNode("k3") == "A", "25 -> A#1@40 after B removed");
        Console.WriteLine("__BUILD_IT_PASS__");
    }
}`,
      },
      rubric: [
        { id: "vnode-placement", description: "Each physical node is placed at `vnodes` positions using the fixed hash(node + \"#\" + i) scheme.", weight: 30 },
        { id: "owner-resolution", description: "getNode resolves a ring position back to the owning physical node, not the virtual-node id.", weight: 35 },
        { id: "remove-all-vnodes", description: "removeNode deletes every virtual position owned by the physical node, so no orphan positions keep routing to it.", weight: 35 },
      ],
      canonicalApproach:
        "Store the ring as sorted positions where each position maps to its owning physical node. addNode inserts vnodes " +
        "entries at hash(node + \"#\" + i), all owning `node`. getNode does the stage-1 clockwise search and returns the " +
        "owner recorded at that position. removeNode deletes every position whose owner is that node (recompute the vnode " +
        "positions, or keep a node->positions index). More vnodes = smoother distribution at the cost of a bigger ring.",
      commonPitfalls: [
        "Returning the virtual-node id (\"A#3\") from getNode instead of the physical node (\"A\").",
        "On removeNode, deleting only one virtual position and leaving the rest, so keys still route to a departed node.",
        "Deriving vnode positions differently on add vs. remove, so removal misses positions that add created.",
      ],
    },
    {
      stage: 3,
      title: "Concurrent membership changes with minimal remapping",
      constraintAdded: "Nodes are added/removed concurrently with a stream of getNode lookups.",
      narrative:
        "In production the ring changes membership (autoscaling, failures) while lookups stream in from many threads. Two " +
        "properties must hold together. First, correctness: adding or removing a node must only move the keys on that " +
        "node's arc — every other key keeps its home (that's the whole promise of consistent hashing, and it's easy to " +
        "break with a buggy rebuild). Second, safety: a concurrent getNode must never see a half-updated ring (a node " +
        "partway inserted, positions present but owner not yet set). This is the make-or-break stage.",
      prompt:
        "Make addNode/removeNode safe against concurrent getNode calls, and preserve the minimal-remap property. State the " +
        "invariant precisely and argue, with a concrete interleaving, why a lookup can't observe a torn ring and why a " +
        "membership change doesn't remap unaffected keys. Discuss your approach to read-heavy concurrency (e.g. a " +
        "read-write lock, or building a new immutable ring snapshot and swapping it in atomically) and its tradeoff.",
      invariant:
        "Adding or removing a node remaps only the keys that fall on the arcs it owns; every key not on those arcs resolves " +
        "to the same node before and after. And every getNode observes a complete, internally-consistent ring — either " +
        "fully before or fully after a membership change — never a state where a position exists without a valid owner.",
      skeletons: {
        csharp: {
          fileName: "HashRing.cs",
          code: `using System.Threading;

public class HashRing
{
    private readonly Func<string, int> _hash;
    private readonly int _vnodes;
    private readonly ReaderWriterLockSlim _lock = new();
    // ...sorted positions + owner map from stage 2...

    public HashRing(Func<string, int> hash, int vnodes) { _hash = hash; _vnodes = vnodes; }

    public void AddNode(string node)
    {
        // TODO: mutate (or rebuild+swap) the ring so getNode never sees a
        // half-inserted node. Only this node's arcs may change ownership.
        throw new NotImplementedException();
    }

    public void RemoveNode(string node)
    {
        // TODO: same, for removal
        throw new NotImplementedException();
    }

    public string? GetNode(string key)
    {
        // TODO: read a consistent ring snapshot and do the clockwise lookup
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "hash_ring.py",
          code: `import threading
from typing import Callable, Optional

class HashRing:
    def __init__(self, hash_fn: Callable[[str], int], vnodes: int):
        self._hash = hash_fn
        self._vnodes = vnodes
        self._lock = threading.RLock()
        # ...sorted positions + owner map from stage 2...

    def add_node(self, node: str) -> None:
        # TODO: mutate (or rebuild+swap) the ring so get_node never sees a
        # half-inserted node. Only this node's arcs may change ownership.
        raise NotImplementedError

    def remove_node(self, node: str) -> None:
        # TODO: same, for removal
        raise NotImplementedError

    def get_node(self, key: str) -> Optional[str]:
        # TODO: read a consistent ring snapshot and do the clockwise lookup
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "HashRing.kt",
          code: `import java.util.concurrent.locks.ReentrantReadWriteLock

class HashRing(private val hash: (String) -> Int, private val vnodes: Int) {
    private val lock = ReentrantReadWriteLock()
    // ...sorted positions + owner map from stage 2...

    fun addNode(node: String) {
        // TODO: mutate (or rebuild+swap) the ring so getNode never sees a
        // half-inserted node. Only this node's arcs may change ownership.
        TODO()
    }

    fun removeNode(node: String) {
        // TODO: same, for removal
        TODO()
    }

    fun getNode(key: String): String? {
        // TODO: read a consistent ring snapshot and do the clockwise lookup
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "consistent-read", description: "A getNode always reads a complete ring — a membership change is not visible until fully applied (via a write lock over the mutation, or an atomic swap of an immutable snapshot).", weight: 25 },
        { id: "minimal-remap", description: "Add/remove only changes ownership for the affected node's arcs; the design does not reshuffle unaffected keys (e.g. no hash(key) % N, no wholesale re-bucketing).", weight: 25 },
        { id: "invariant", description: "The candidate states the minimal-remap + consistent-snapshot invariant and defends it with a concrete interleaving of a membership change against a concurrent lookup.", weight: 50 },
      ],
      canonicalApproach:
        "Because lookups vastly outnumber membership changes, favour readers. Two solid options: (1) a read-write lock — " +
        "getNode takes the read lock, add/remove take the write lock, so a lookup never overlaps a mutation; or (2) " +
        "copy-on-write — keep the ring as an immutable sorted snapshot in a single reference; add/remove build a new " +
        "snapshot and atomically swap the reference, so getNode reads whatever snapshot is current with no lock at all. " +
        "Both give a consistent read. Minimal remap falls out of the ring structure itself: inserting one node's vnodes " +
        "only splits the arcs immediately counter-clockwise of them; no other key's clockwise-nearest position changes.",
      commonPitfalls: [
        "Rebuilding the ring by re-bucketing keys with modulo arithmetic, which remaps almost everything on any change — defeating consistent hashing.",
        "Inserting vnode positions and then setting owners in a second step without synchronisation, so a concurrent lookup lands on a position with no owner.",
        "Taking a lock on getNode but a different (or no) lock on the mutation, so the read and write still race.",
      ],
    },
    {
      stage: 4,
      title: "Weighted nodes and replication",
      constraintAdded: "Nodes have different capacities, and each key must map to N distinct nodes for replication.",
      narrative:
        "Two real-world needs. Nodes aren't identical — a bigger box should own proportionally more of the ring (weight). " +
        "And data is replicated: each key must resolve to the N distinct physical nodes that will hold its replicas, not " +
        "just one. Naively walking clockwise and taking the next N positions can return the same physical node repeatedly " +
        "(its own vnodes) — the replicas must be N *distinct* nodes.",
      prompt:
        "Add weighting — a node with weight w gets w times the base vnode count — and getNodes(key, n) returning the first " +
        "n DISTINCT physical nodes clockwise from hash(key) (for replica placement), wrapping around, and returning fewer " +
        "than n only if the ring has fewer than n physical nodes. Explain how you skip repeated owners while walking the " +
        "ring and how weighting interacts with the minimal-remap guarantee from stage 3.",
      skeletons: {
        csharp: {
          fileName: "HashRing.cs",
          code: `public class HashRing
{
    // ...thread-safe weighted ring...

    public void AddNode(string node, int weight)
    {
        // TODO: give node (baseVnodes * weight) positions
        throw new NotImplementedException();
    }

    public System.Collections.Generic.List<string> GetNodes(string key, int n)
    {
        // TODO: walk clockwise from _hash(key), collecting the first n DISTINCT
        // physical nodes (skip repeats of the same owner), wrapping around.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "hash_ring.py",
          code: `class HashRing:
    # ...thread-safe weighted ring...

    def add_node(self, node: str, weight: int = 1) -> None:
        # TODO: give node (base_vnodes * weight) positions
        raise NotImplementedError

    def get_nodes(self, key: str, n: int) -> list[str]:
        # TODO: walk clockwise from hash(key), collecting the first n DISTINCT
        # physical nodes (skip repeats of the same owner), wrapping around.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "HashRing.kt",
          code: `class HashRing(private val hash: (String) -> Int, private val vnodes: Int) {
    // ...thread-safe weighted ring...

    fun addNode(node: String, weight: Int) {
        // TODO: give node (vnodes * weight) positions
        TODO()
    }

    fun getNodes(key: String, n: Int): List<String> {
        // TODO: walk clockwise from hash(key), collecting the first n DISTINCT
        // physical nodes (skip repeats of the same owner), wrapping around.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "weighting", description: "A node's number of ring positions scales with its weight, so its expected share of keys is proportional to weight.", weight: 30 },
        { id: "n-distinct-replicas", description: "getNodes returns n DISTINCT physical nodes by skipping repeated owners while walking clockwise (never the same node twice for its multiple vnodes).", weight: 40 },
        { id: "bounded-and-wrapping", description: "The walk wraps around the ring and returns fewer than n only when the ring has fewer than n physical nodes (no infinite loop, no duplicates).", weight: 30 },
      ],
      canonicalApproach:
        "Weighting is just vnode count scaled by weight — a weight-3 node gets 3x the positions, so it owns ~3x the arc. " +
        "For getNodes, walk positions clockwise from hash(key) and collect owners into an ordered set, skipping any owner " +
        "already collected, until you have n or you've come all the way around. Because you skip repeats, a node's multiple " +
        "vnodes never inflate the replica set. Weighting doesn't disturb minimal remap: adding a weighted node still only " +
        "splits the arcs its own positions land on.",
      commonPitfalls: [
        "Taking the next n ring positions and returning their owners without dedup — replicas collapse onto one physical node's vnodes.",
        "Walking forever when n exceeds the number of physical nodes, instead of stopping after one full loop.",
        "Implementing weight by biasing the hash rather than by adding proportionally more positions, which breaks the even-arc intuition and the remap guarantee.",
      ],
    },
  ],
};
