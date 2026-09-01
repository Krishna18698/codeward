import type { BuildItProblem } from "./types";

export const threadSafeLruCache: BuildItProblem = {
  slug: "thread-safe-lru-cache",
  title: "Thread-Safe LRU Cache with TTL",
  category: "concurrency",
  brief:
    "An in-memory cache that evolves across four stages: an O(1) LRU cache, per-entry TTL expiry, thread-safe " +
    "under concurrent get/put, then a single-flight loader that survives a cache stampede. Each stage adds one " +
    "constraint the previous design can't meet. Values are ints and a miss returns null; time is an injected clock.",
  totalMinutes: 100,
  stages: [
    {
      stage: 1,
      title: "O(1) LRU cache",
      constraintAdded: "None yet — this is the baseline.",
      narrative:
        "Product wants a fixed-capacity cache that evicts the least-recently-used entry when full. Single thread. Both " +
        "get and put must be O(1) — the classic hash-map-plus-doubly-linked-list. This baseline exists so TTL (stage 2) " +
        "and concurrency (stage 3) have a concrete design to break.",
      prompt:
        "Implement an LRU cache with a fixed capacity. get(key) returns the value or null on a miss and marks the key " +
        "most-recently-used. put(key, value) inserts/updates and marks it most-recently-used, evicting the " +
        "least-recently-used entry if the cache is over capacity. Both operations must be O(1).",
      skeletons: {
        csharp: {
          fileName: "LruCache.cs",
          code: `public class LruCache
{
    private readonly int _capacity;

    public LruCache(int capacity)
    {
        _capacity = capacity;
        // TODO: map from key -> node, plus a doubly-linked list for recency
    }

    public int? Get(string key)
    {
        // TODO: return value or null; move the key to most-recently-used
        throw new NotImplementedException();
    }

    public void Put(string key, int value)
    {
        // TODO: insert/update, mark most-recently-used, evict LRU if over capacity
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "lru_cache.py",
          code: `from typing import Optional

class LruCache:
    def __init__(self, capacity: int):
        self._capacity = capacity
        # TODO: map from key -> node, plus a doubly-linked list for recency
        # (collections.OrderedDict is an acceptable O(1) stand-in)

    def get(self, key: str) -> Optional[int]:
        # TODO: return value or None; move the key to most-recently-used
        raise NotImplementedError

    def put(self, key: str, value: int) -> None:
        # TODO: insert/update, mark most-recently-used, evict LRU if over capacity
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "LruCache.kt",
          code: `class LruCache(private val capacity: Int) {
    // TODO: map from key -> node, plus a doubly-linked list for recency
    // (a LinkedHashMap in access order is an acceptable O(1) stand-in)

    fun get(key: String): Int? {
        // TODO: return value or null; move the key to most-recently-used
        TODO()
    }

    fun put(key: String, value: Int) {
        // TODO: insert/update, mark most-recently-used, evict LRU if over capacity
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "o1-ops", description: "Both get and put are O(1) — a hash map for lookup plus a doubly-linked list (or equivalent access-ordered structure) for recency, not a scan of all entries.", weight: 30 },
        { id: "recency-update", description: "A get (and a put on an existing key) moves that key to most-recently-used.", weight: 30 },
        { id: "lru-eviction", description: "When capacity is exceeded, the least-recently-used entry is the one evicted.", weight: 40 },
      ],
      canonicalApproach:
        "A hash map from key to a node in a doubly-linked list ordered by recency (most-recently-used at the head, " +
        "least at the tail). get moves the node to the head; put inserts at the head (updating in place if present) and, " +
        "when size exceeds capacity, unlinks the tail node and removes its key from the map. Every operation is a constant " +
        "number of pointer splices, so both are O(1).",
      commonPitfalls: [
        "Tracking recency with a timestamp and scanning for the minimum on eviction — that's O(n) per eviction.",
        "Updating the linked list on get but forgetting to on an overwriting put, so a hot key that's only ever written gets wrongly evicted.",
        "Evicting before inserting on an update to an existing key, which can drop the wrong entry.",
      ],
      tests: {
        python: `# --- tests (read-only) ---
def _run():
    c = LruCache(2)
    c.put("a", 1)
    c.put("b", 2)
    assert c.get("a") == 1, "a present"        # a is now most-recently-used
    c.put("c", 3)                               # evicts b (least-recently-used)
    assert c.get("b") is None, "b evicted"
    assert c.get("a") == 1, "a survived"
    assert c.get("c") == 3, "c present"
    c.put("a", 10)                              # update existing key
    assert c.get("a") == 10, "a updated in place"
    print("__BUILD_IT_PASS__")

_run()`,
        kotlin: `// --- tests (read-only) ---
fun main() {
    val c = LruCache(2)
    c.put("a", 1)
    c.put("b", 2)
    check(c.get("a") == 1) { "a present" }
    c.put("c", 3)
    check(c.get("b") == null) { "b evicted" }
    check(c.get("a") == 1) { "a survived" }
    check(c.get("c") == 3) { "c present" }
    c.put("a", 10)
    check(c.get("a") == 10) { "a updated in place" }
    println("__BUILD_IT_PASS__")
}`,
        csharp: `// --- tests (read-only) ---
class TestRunner
{
    static void Check(bool cond, string msg) { if (!cond) throw new Exception("FAILED: " + msg); }
    static void Main()
    {
        var c = new LruCache(2);
        c.Put("a", 1);
        c.Put("b", 2);
        Check(c.Get("a") == 1, "a present");
        c.Put("c", 3);
        Check(c.Get("b") == null, "b evicted");
        Check(c.Get("a") == 1, "a survived");
        Check(c.Get("c") == 3, "c present");
        c.Put("a", 10);
        Check(c.Get("a") == 10, "a updated in place");
        Console.WriteLine("__BUILD_IT_PASS__");
    }
}`,
      },
    },
    {
      stage: 2,
      title: "Per-entry TTL",
      constraintAdded: "Each entry has a time-to-live; expired entries must read as absent and be reclaimed.",
      narrative:
        "Product now caches data that goes stale — each entry gets a TTL, after which it must not be served. A naive add " +
        "is to stamp an expiry and check it on read, but if you only check on read, expired-but-unread entries hold " +
        "capacity forever and can evict live keys. The clock is injected as now() so expiry is deterministic and testable.",
      prompt:
        "Add a TTL to put(key, value, ttlMs): the entry expires at now() + ttlMs. get(key) must return null for an expired " +
        "entry (treat now() >= expiry as expired) and reclaim it so it no longer occupies capacity. Keep get/put O(1) and " +
        "keep the stage-1 LRU recency behaviour for live entries.",
      skeletons: {
        csharp: {
          fileName: "LruCache.cs",
          code: `public class LruCache
{
    private readonly int _capacity;
    private readonly Func<long> _now;

    public LruCache(int capacity, Func<long> now)
    {
        _capacity = capacity;
        _now = now;
        // ...map + recency list from stage 1, each node now also holds ExpiryMs...
    }

    public int? Get(string key)
    {
        // TODO: if the entry is missing OR now() >= expiry, treat as a miss and
        // reclaim it (unlink + remove from map). Otherwise mark MRU and return it.
        throw new NotImplementedException();
    }

    public void Put(string key, int value, long ttlMs)
    {
        // TODO: as stage 1, but stamp expiry = _now() + ttlMs on the node.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "lru_cache.py",
          code: `from typing import Optional, Callable

class LruCache:
    def __init__(self, capacity: int, now: Callable[[], int]):
        self._capacity = capacity
        self._now = now
        # ...map + recency structure from stage 1, each entry now also holds expiry_ms...

    def get(self, key: str) -> Optional[int]:
        # TODO: if missing OR now() >= expiry, treat as a miss and reclaim it.
        # Otherwise mark most-recently-used and return the value.
        raise NotImplementedError

    def put(self, key: str, value: int, ttl_ms: int) -> None:
        # TODO: as stage 1, but stamp expiry = now() + ttl_ms on the entry.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "LruCache.kt",
          code: `class LruCache(private val capacity: Int, private val now: () -> Long) {
    // ...map + recency structure from stage 1, each entry now also holds expiryMs...

    fun get(key: String): Int? {
        // TODO: if missing OR now() >= expiry, treat as a miss and reclaim it.
        // Otherwise mark most-recently-used and return the value.
        TODO()
    }

    fun put(key: String, value: Int, ttlMs: Long) {
        // TODO: as stage 1, but stamp expiry = now() + ttlMs on the entry.
        TODO()
    }
}`,
        },
      },
      tests: {
        python: `# --- tests (read-only) ---
def _run():
    t = [0]
    c = LruCache(3, now=lambda: t[0])
    c.put("a", 1, 1000)      # expires at 1000
    c.put("b", 2, 3000)      # expires at 3000
    assert c.get("a") == 1, "a alive before expiry"
    assert c.get("b") == 2, "b alive before expiry"
    t[0] = 1000
    assert c.get("a") is None, "a expired at its TTL boundary"
    t[0] = 2999
    assert c.get("b") == 2, "b still alive just before expiry"
    t[0] = 3000
    assert c.get("b") is None, "b expired at its TTL boundary"
    print("__BUILD_IT_PASS__")

_run()`,
        kotlin: `// --- tests (read-only) ---
fun main() {
    var t = 0L
    val c = LruCache(3) { t }
    c.put("a", 1, 1000)
    c.put("b", 2, 3000)
    check(c.get("a") == 1) { "a alive before expiry" }
    check(c.get("b") == 2) { "b alive before expiry" }
    t = 1000
    check(c.get("a") == null) { "a expired at its TTL boundary" }
    t = 2999
    check(c.get("b") == 2) { "b still alive just before expiry" }
    t = 3000
    check(c.get("b") == null) { "b expired at its TTL boundary" }
    println("__BUILD_IT_PASS__")
}`,
        csharp: `// --- tests (read-only) ---
class TestRunner
{
    static void Check(bool cond, string msg) { if (!cond) throw new Exception("FAILED: " + msg); }
    static void Main()
    {
        long t = 0;
        var c = new LruCache(3, () => t);
        c.Put("a", 1, 1000);
        c.Put("b", 2, 3000);
        Check(c.Get("a") == 1, "a alive before expiry");
        Check(c.Get("b") == 2, "b alive before expiry");
        t = 1000;
        Check(c.Get("a") == null, "a expired at its TTL boundary");
        t = 2999;
        Check(c.Get("b") == 2, "b still alive just before expiry");
        t = 3000;
        Check(c.Get("b") == null, "b expired at its TTL boundary");
        Console.WriteLine("__BUILD_IT_PASS__");
    }
}`,
      },
      rubric: [
        { id: "expiry-stamp", description: "Each entry records an absolute expiry (now() + ttlMs) at put time, read through the injected clock.", weight: 25 },
        { id: "expired-reads-absent", description: "get returns null once now() >= expiry, even though the entry is still physically present until reclaimed.", weight: 35 },
        { id: "reclaim-expired", description: "An expired entry is removed from both the map and the recency structure (at least lazily on access) so it stops occupying capacity.", weight: 40 },
      ],
      canonicalApproach:
        "Store an absolute expiryMs on each node. get first checks presence, then expiry: if now() >= expiry, unlink the " +
        "node and delete the key (lazy reclamation) and report a miss; otherwise move to MRU and return the value. put " +
        "stamps expiry = now() + ttlMs. This keeps everything O(1); the only subtlety is that lazy reclamation alone lets " +
        "an expired-but-never-read key linger — acceptable here, and stage 4 revisits proactive cleanup.",
      commonPitfalls: [
        "Checking expiry on read but never removing the entry, so expired keys keep occupying capacity and evict live ones.",
        "Storing a relative TTL and comparing durations instead of an absolute expiry, which drifts as the clock advances.",
        "Serving a value whose expiry equals now() — decide the boundary explicitly (this problem treats now() >= expiry as expired).",
      ],
    },
    {
      stage: 3,
      title: "Thread-safe under concurrent get/put",
      constraintAdded: "Many threads call get and put concurrently on the same cache.",
      narrative:
        "Put stage 2 under load: many threads hit the same cache concurrently. The map and the recency list are two " +
        "structures that must move together, and get is a mutator (it relinks the node). Unsynchronised, two concurrent " +
        "operations can splice the linked list at the same time and corrupt it — a dropped node, a cycle, a lost eviction, " +
        "or size drifting above capacity. This is the make-or-break stage: the two structures must never be seen out of sync.",
      prompt:
        "Make get and put safe under concurrent access. State the consistency invariant you're protecting and argue, with " +
        "a concrete interleaving, why your synchronisation prevents corruption. Note the tradeoff: because get mutates " +
        "recency, a plain read-write lock doesn't help (gets aren't read-only); discuss your locking choice and its effect " +
        "on throughput on a hot key.",
      invariant:
        "At every observable point the cache holds at most `capacity` live entries, and the map and the recency list " +
        "describe exactly the same set of keys (every map entry has a list node and vice-versa, no orphans, no cycles). " +
        "No concurrent get/put ever observes or leaves a torn state where the two structures disagree.",
      skeletons: {
        csharp: {
          fileName: "LruCache.cs",
          code: `public class LruCache
{
    private readonly int _capacity;
    private readonly Func<long> _now;
    private readonly object _lock = new();
    // ...map + recency list + per-node expiry from stages 1-2...

    public LruCache(int capacity, Func<long> now) { _capacity = capacity; _now = now; }

    public int? Get(string key)
    {
        // TODO: guard the presence+expiry check, the recency relink, and any
        // reclamation as one atomic critical section. Defend the invariant.
        throw new NotImplementedException();
    }

    public void Put(string key, int value, long ttlMs)
    {
        // TODO: guard insert/update + eviction as one atomic critical section.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "lru_cache.py",
          code: `import threading
from typing import Optional, Callable

class LruCache:
    def __init__(self, capacity: int, now: Callable[[], int]):
        self._capacity = capacity
        self._now = now
        self._lock = threading.Lock()
        # ...map + recency structure + per-entry expiry from stages 1-2...

    def get(self, key: str) -> Optional[int]:
        # TODO: guard the presence+expiry check, the recency relink, and any
        # reclamation as one atomic critical section. Defend the invariant.
        raise NotImplementedError

    def put(self, key: str, value: int, ttl_ms: int) -> None:
        # TODO: guard insert/update + eviction as one atomic critical section.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "LruCache.kt",
          code: `import java.util.concurrent.locks.ReentrantLock

class LruCache(private val capacity: Int, private val now: () -> Long) {
    private val lock = ReentrantLock()
    // ...map + recency structure + per-entry expiry from stages 1-2...

    fun get(key: String): Int? {
        // TODO: guard the presence+expiry check, the recency relink, and any
        // reclamation as one atomic critical section. Defend the invariant.
        TODO()
    }

    fun put(key: String, value: Int, ttlMs: Long) {
        // TODO: guard insert/update + eviction as one atomic critical section.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "atomic-structure-update", description: "The map mutation and the linked-list splice are performed together inside one critical section, never as two independently-visible steps.", weight: 25 },
        { id: "get-is-a-writer", description: "The candidate recognises that get mutates recency (and may reclaim an expired entry), so it must take the write path — not be treated as a lock-free or shared-read operation.", weight: 25 },
        { id: "invariant", description: "The candidate explicitly states the map/list consistency + capacity invariant and argues, with a concrete interleaving, why their locking prevents a torn state.", weight: 50 },
      ],
      canonicalApproach:
        "Guard the whole cache with a single mutex and take it for the entirety of both get and put — because get relinks " +
        "the recency list and may reclaim an expired node, it is a writer, so a read-write lock buys nothing. Inside the " +
        "lock the map and list are always mutated together, so no other thread can observe one updated without the other. " +
        "The honest tradeoff is that a hot key serialises all access; sharding the cache into N independently-locked " +
        "segments (key hashed to a segment) is the standard way to regain concurrency while keeping each segment's two " +
        "structures atomic.",
      commonPitfalls: [
        "Using a concurrent map for storage but leaving the linked list unguarded — the list is the part that corrupts.",
        "Treating get as a read under a read-write lock, so two gets relink the same list concurrently and tear it.",
        "Locking the map lookup and the list splice separately, leaving a window where size is over capacity or a node exists in one structure but not the other.",
      ],
    },
    {
      stage: 4,
      title: "Single-flight loader (stampede protection)",
      constraintAdded: "On a miss the cache loads from a slow backing store; concurrent misses for the same key must load once.",
      narrative:
        "The cache now fronts a slow backing store: on a miss it calls a loader to fetch the value. When a hot key expires " +
        "under load, hundreds of threads miss simultaneously and all call the loader — a cache stampede that hammers the " +
        "backing store (a 'thundering herd'). This stage keeps the stage-3 safety while ensuring that for a given key, " +
        "only one loader call is in flight and everyone else waits for and shares its result.",
      prompt:
        "Add getOrLoad(key, ttlMs, loader): return the cached live value if present; otherwise ensure that concurrent " +
        "callers for the same missing key trigger the loader exactly once, all wait for that single result, and it's cached " +
        "with the TTL. Crucially, don't hold the cache-wide lock while the (slow) loader runs — that would serialise the " +
        "whole cache on one slow load. Describe your per-key in-flight mechanism and how it avoids both the stampede and " +
        "holding the global lock across I/O.",
      skeletons: {
        csharp: {
          fileName: "LruCache.cs",
          code: `public class LruCache
{
    // ...stage 3 thread-safe cache...

    public int GetOrLoad(string key, long ttlMs, Func<int> loader)
    {
        // TODO: fast path returns a live cached value. On a miss, ensure the
        // loader runs once per key across concurrent callers (a per-key in-flight
        // "promise"/future), everyone shares the result, then it's cached with ttl.
        // Do NOT hold the cache-wide lock while loader() runs.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "lru_cache.py",
          code: `from typing import Callable

class LruCache:
    # ...stage 3 thread-safe cache...

    def get_or_load(self, key: str, ttl_ms: int, loader: Callable[[], int]) -> int:
        # TODO: fast path returns a live cached value. On a miss, ensure the
        # loader runs once per key across concurrent callers (a per-key in-flight
        # future/event), everyone shares the result, then it's cached with ttl.
        # Do NOT hold the cache-wide lock while loader() runs.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "LruCache.kt",
          code: `class LruCache(private val capacity: Int, private val now: () -> Long) {
    // ...stage 3 thread-safe cache...

    fun getOrLoad(key: String, ttlMs: Long, loader: () -> Int): Int {
        // TODO: fast path returns a live cached value. On a miss, ensure the
        // loader runs once per key across concurrent callers (a per-key in-flight
        // future), everyone shares the result, then it's cached with ttl.
        // Do NOT hold the cache-wide lock while loader() runs.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "single-flight", description: "For one missing key, concurrent callers invoke the loader exactly once; the rest wait for and share that single result rather than each loading.", weight: 35 },
        { id: "no-lock-across-io", description: "The slow loader() runs without holding the cache-wide lock, so unrelated keys keep flowing while one key loads.", weight: 35 },
        { id: "populate-and-cleanup", description: "The loaded value is stored with its TTL and the per-key in-flight marker is cleaned up afterwards (including on loader failure) so the key isn't stuck.", weight: 30 },
      ],
      canonicalApproach:
        "Keep a second map from key to an in-flight future/promise. On a miss, under a short lock, check that map: if a " +
        "future exists, release the lock and await it; if not, create and insert one, release the lock, then run loader() " +
        "outside the lock, complete the future with the result, store the value with its TTL, and remove the in-flight " +
        "entry (in a finally, so a failed load doesn't wedge the key). The global lock is held only for the O(1) " +
        "map checks, never across the load, so exactly one load happens per key and the cache stays concurrent.",
      commonPitfalls: [
        "Holding the cache lock across loader(), which turns one slow backing-store call into a stall of the entire cache.",
        "A double-checked miss with no in-flight registry, so N threads still each start a load before the first finishes.",
        "Not removing the in-flight future on loader failure, so every future caller for that key blocks forever on a promise that never completes.",
      ],
    },
  ],
};
