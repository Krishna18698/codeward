import type { BuildItProblem } from "./types";

export const tokenBucketRateLimiter: BuildItProblem = {
  slug: "token-bucket-rate-limiter",
  title: "Token-Bucket Rate Limiter",
  category: "concurrency",
  brief:
    "An in-memory API rate limiter that evolves across four stages: fixed-window counter, token bucket with " +
    "burst tolerance, thread-safe under concurrent traffic, then per-client buckets with a memory bound. Each " +
    "stage adds one constraint the previous design can't meet. Time is injected as a clock so behaviour is testable.",
  totalMinutes: 90,
  stages: [
    {
      stage: 1,
      title: "Fixed-window counter",
      constraintAdded: "None yet — this is the baseline.",
      narrative:
        "Product wants to cap each API key at N requests per fixed window (say 100/minute). Single thread, single " +
        "process. This is the simplest thing that works and exists so stage 2 has a concrete design to break. Time is " +
        "passed in as a clock function so the limiter never reads the wall clock directly — that's what makes it testable.",
      prompt:
        "Implement allow(key): return true and count the request if the key is under its limit for the current fixed " +
        "window, false otherwise. The constructor takes limit, windowMs, and a now() clock returning the current time " +
        "in milliseconds. A window is a fixed block of time (now / windowMs); when the window rolls over, the count resets.",
      skeletons: {
        csharp: {
          fileName: "RateLimiter.cs",
          code: `public class RateLimiter
{
    private readonly int _limit;
    private readonly long _windowMs;
    private readonly Func<long> _now;

    public RateLimiter(int limit, long windowMs, Func<long> now)
    {
        _limit = limit;
        _windowMs = windowMs;
        _now = now;
    }

    public bool Allow(string key)
    {
        // TODO: allow up to _limit requests per key per fixed window
        // (window index = _now() / _windowMs). Reset the count when the
        // window rolls over. Return true if allowed (and count it), else false.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "rate_limiter.py",
          code: `from typing import Callable

class RateLimiter:
    def __init__(self, limit: int, window_ms: int, now: Callable[[], int]):
        self._limit = limit
        self._window_ms = window_ms
        self._now = now
        # TODO: per-key state (current window index + count)

    def allow(self, key: str) -> bool:
        # TODO: allow up to limit requests per key per fixed window
        # (window index = now() // window_ms). Reset when the window rolls over.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "RateLimiter.kt",
          code: `class RateLimiter(
    private val limit: Int,
    private val windowMs: Long,
    private val now: () -> Long,
) {
    // TODO: per-key state (current window index + count)

    fun allow(key: String): Boolean {
        // TODO: allow up to limit requests per key per fixed window
        // (window index = now() / windowMs). Reset when the window rolls over.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "per-key-count", description: "Requests are counted per key independently, not globally across all keys.", weight: 30 },
        { id: "window-limit", description: "Within a single window a key is allowed at most `limit` requests; the (limit+1)th is rejected.", weight: 40 },
        { id: "window-reset", description: "When the fixed window rolls over (now advances past the window boundary), the count resets and the key is allowed again.", weight: 30 },
      ],
      canonicalApproach:
        "Keep a map from key to (windowIndex, count). On allow, compute windowIndex = now() / windowMs. If it differs " +
        "from the stored window for that key, reset count to 0 and store the new index. If count < limit, increment and " +
        "return true; otherwise return false. Reading the clock only through the injected now() keeps the whole thing " +
        "deterministic and unit-testable.",
      commonPitfalls: [
        "A single global counter instead of per-key state — one noisy key then throttles everyone.",
        "Comparing against a rolling wall-clock timestamp per request (a crude sliding window) when the stage asks for a fixed window — correct-ish, but not what was specified, and it hides the boundary-burst flaw stage 2 exists to expose.",
        "Reading the system clock directly instead of the injected now(), which makes the limiter impossible to test deterministically.",
      ],
      tests: {
        python: `# --- tests (read-only) ---
def _run():
    t = [0]
    rl = RateLimiter(3, 1000, now=lambda: t[0])
    assert rl.allow("a") is True, "1st request allowed"
    assert rl.allow("a") is True, "2nd request allowed"
    assert rl.allow("a") is True, "3rd request allowed"
    assert rl.allow("a") is False, "4th request over limit is denied"
    # a different key has its own budget
    assert rl.allow("b") is True, "other key is independent"
    # roll into the next window
    t[0] = 1000
    assert rl.allow("a") is True, "count resets in the next window"
    print("__BUILD_IT_PASS__")

_run()`,
        kotlin: `// --- tests (read-only) ---
fun main() {
    var t = 0L
    val rl = RateLimiter(3, 1000) { t }
    check(rl.allow("a")) { "1st request allowed" }
    check(rl.allow("a")) { "2nd request allowed" }
    check(rl.allow("a")) { "3rd request allowed" }
    check(!rl.allow("a")) { "4th request over limit is denied" }
    check(rl.allow("b")) { "other key is independent" }
    t = 1000
    check(rl.allow("a")) { "count resets in the next window" }
    println("__BUILD_IT_PASS__")
}`,
        csharp: `// --- tests (read-only) ---
class TestRunner
{
    static void Check(bool cond, string msg) { if (!cond) throw new Exception("FAILED: " + msg); }
    static void Main()
    {
        long t = 0;
        var rl = new RateLimiter(3, 1000, () => t);
        Check(rl.Allow("a"), "1st request allowed");
        Check(rl.Allow("a"), "2nd request allowed");
        Check(rl.Allow("a"), "3rd request allowed");
        Check(!rl.Allow("a"), "4th request over limit is denied");
        Check(rl.Allow("b"), "other key is independent");
        t = 1000;
        Check(rl.Allow("a"), "count resets in the next window");
        Console.WriteLine("__BUILD_IT_PASS__");
    }
}`,
      },
    },
    {
      stage: 2,
      title: "Token bucket with burst tolerance",
      constraintAdded: "Bursts must be allowed up to a capacity, with tokens refilling smoothly over time.",
      narrative:
        "The fixed-window counter has two problems product just hit: it allows a double burst across a window boundary " +
        "(limit requests at the end of one window plus limit more at the start of the next, all within a moment), and it " +
        "rejects a well-behaved client that saved up quiet time and wants a short burst. Switch the mechanism to a token " +
        "bucket: each key has a bucket of at most `capacity` tokens that refills at `refillPerSec`; a request costs one token.",
      prompt:
        "Reimplement allow(key) as a token bucket. The bucket starts full (capacity tokens). On each call, first refill " +
        "based on elapsed time since the last refill (tokens += elapsedSeconds * refillPerSec, capped at capacity), then " +
        "if at least one token is available, consume it and return true, else return false. Keep using the injected now() " +
        "clock. This absorbs bursts up to capacity and throttles the sustained rate to refillPerSec.",
      skeletons: {
        csharp: {
          fileName: "RateLimiter.cs",
          code: `public class RateLimiter
{
    private readonly double _capacity;
    private readonly double _refillPerSec;
    private readonly Func<long> _now;

    public RateLimiter(double capacity, double refillPerSec, Func<long> now)
    {
        _capacity = capacity;
        _refillPerSec = refillPerSec;
        _now = now;
    }

    public bool Allow(string key)
    {
        // TODO: per-key bucket {tokens, lastRefillMs}, starting full.
        // Refill by elapsed seconds * refillPerSec (capped at capacity),
        // then consume 1 token if available. Return whether it was consumed.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "rate_limiter.py",
          code: `from typing import Callable

class RateLimiter:
    def __init__(self, capacity: float, refill_per_sec: float, now: Callable[[], int]):
        self._capacity = capacity
        self._refill_per_sec = refill_per_sec
        self._now = now
        # TODO: per-key bucket {tokens, last_refill_ms}, starting full

    def allow(self, key: str) -> bool:
        # TODO: refill by elapsed_seconds * refill_per_sec (capped at capacity),
        # then consume 1 token if available. Return whether it was consumed.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "RateLimiter.kt",
          code: `class RateLimiter(
    private val capacity: Double,
    private val refillPerSec: Double,
    private val now: () -> Long,
) {
    // TODO: per-key bucket {tokens, lastRefillMs}, starting full

    fun allow(key: String): Boolean {
        // TODO: refill by elapsedSeconds * refillPerSec (capped at capacity),
        // then consume 1 token if available. Return whether it was consumed.
        TODO()
    }
}`,
        },
      },
      tests: {
        python: `# --- tests (read-only) ---
def _run():
    t = [0]
    rl = RateLimiter(5.0, 1.0, now=lambda: t[0])  # cap 5, 1 token/sec
    # bucket starts full: 5 immediate requests, 6th denied
    for i in range(5):
        assert rl.allow("a") is True, f"burst request {i+1} allowed"
    assert rl.allow("a") is False, "bucket empty after the burst"
    # 1 second later -> 1 token refilled
    t[0] = 1000
    assert rl.allow("a") is True, "one token available after 1s"
    assert rl.allow("a") is False, "and only one"
    # long idle -> refill caps at capacity, not more
    t[0] = 1000 + 100_000
    for i in range(5):
        assert rl.allow("a") is True, f"refill caps at capacity: {i+1}"
    assert rl.allow("a") is False, "never more than capacity"
    print("__BUILD_IT_PASS__")

_run()`,
        kotlin: `// --- tests (read-only) ---
fun main() {
    var t = 0L
    val rl = RateLimiter(5.0, 1.0) { t }
    for (i in 1..5) check(rl.allow("a")) { "burst request $i allowed" }
    check(!rl.allow("a")) { "bucket empty after the burst" }
    t = 1000
    check(rl.allow("a")) { "one token available after 1s" }
    check(!rl.allow("a")) { "and only one" }
    t = 1000 + 100_000
    for (i in 1..5) check(rl.allow("a")) { "refill caps at capacity: $i" }
    check(!rl.allow("a")) { "never more than capacity" }
    println("__BUILD_IT_PASS__")
}`,
        csharp: `// --- tests (read-only) ---
class TestRunner
{
    static void Check(bool cond, string msg) { if (!cond) throw new Exception("FAILED: " + msg); }
    static void Main()
    {
        long t = 0;
        var rl = new RateLimiter(5.0, 1.0, () => t);
        for (int i = 1; i <= 5; i++) Check(rl.Allow("a"), "burst request " + i + " allowed");
        Check(!rl.Allow("a"), "bucket empty after the burst");
        t = 1000;
        Check(rl.Allow("a"), "one token available after 1s");
        Check(!rl.Allow("a"), "and only one");
        t = 1000 + 100000;
        for (int i = 1; i <= 5; i++) Check(rl.Allow("a"), "refill caps at capacity: " + i);
        Check(!rl.Allow("a"), "never more than capacity");
        Console.WriteLine("__BUILD_IT_PASS__");
    }
}`,
      },
      rubric: [
        { id: "lazy-refill", description: "Tokens are refilled lazily on access from elapsed time (no background timer needed), proportional to elapsedSeconds * refillPerSec.", weight: 30 },
        { id: "capacity-cap", description: "Refill is capped at capacity — an idle bucket never accumulates more than `capacity` tokens.", weight: 35 },
        { id: "consume-guard", description: "A request consumes exactly one token and is allowed only if at least one token is available.", weight: 35 },
      ],
      canonicalApproach:
        "Per key store {tokens, lastRefillMs}, initialised to {capacity, now()}. On allow: elapsed = now() - lastRefillMs; " +
        "tokens = min(capacity, tokens + elapsed/1000 * refillPerSec); lastRefillMs = now(). Then if tokens >= 1, subtract " +
        "1 and return true, else return false. Lazy refill means you never need a background thread ticking tokens — the " +
        "math catches up on the next request.",
      commonPitfalls: [
        "Forgetting to cap at capacity, so a bucket idle for an hour suddenly allows thousands of requests at once.",
        "Refilling with integer division of milliseconds, which silently drops sub-second refill and drifts the effective rate.",
        "Advancing lastRefillMs even when no whole token was added, so fractional refill is repeatedly discarded and the sustained rate comes out below refillPerSec.",
      ],
    },
    {
      stage: 3,
      title: "Thread-safe under concurrent traffic",
      constraintAdded: "Many threads call allow() concurrently, sometimes for the same key.",
      narrative:
        "Put stage 2 under real load: a pool of request-handler threads calls allow() concurrently, often for the same hot " +
        "key. The stage-2 bucket does read-modify-write on {tokens, lastRefillMs} with no synchronisation — two threads can " +
        "both read tokens=1, both pass the guard, and both consume, handing out more permits than the bucket holds (or " +
        "driving tokens negative). This is the make-or-break stage: the rate limit must hold exactly under concurrency.",
      prompt:
        "Make allow() safe when many threads call it concurrently for the same key. State the invariant you're protecting " +
        "and argue, with a concrete two-thread interleaving, why your design can't over-admit. Note the tradeoff of your " +
        "locking granularity: a single global lock serialises unrelated keys; a per-key lock (or per-key atomic bucket) " +
        "lets different keys proceed in parallel while keeping each bucket's refill-then-consume atomic.",
      invariant:
        "For any key, across any interleaving of concurrent allow() calls, the number of requests admitted in a bucket's " +
        "lifetime never exceeds the tokens made available to it (initial capacity plus total refill), and the token count " +
        "is never observed negative. The refill-then-consume on a single bucket is atomic: no two threads consume the same token.",
      skeletons: {
        csharp: {
          fileName: "RateLimiter.cs",
          code: `using System.Collections.Concurrent;

public class RateLimiter
{
    private sealed class Bucket { public double Tokens; public long LastRefillMs; }

    private readonly double _capacity;
    private readonly double _refillPerSec;
    private readonly Func<long> _now;
    private readonly ConcurrentDictionary<string, Bucket> _buckets = new();

    public RateLimiter(double capacity, double refillPerSec, Func<long> now)
    {
        _capacity = capacity; _refillPerSec = refillPerSec; _now = now;
    }

    public bool Allow(string key)
    {
        // TODO: get-or-create the bucket for this key, then make the
        // refill-then-consume atomic per bucket (watch the check-then-act gap).
        // State + defend the no-over-admit invariant.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "rate_limiter.py",
          code: `import threading
from typing import Callable

class RateLimiter:
    def __init__(self, capacity: float, refill_per_sec: float, now: Callable[[], int]):
        self._capacity = capacity
        self._refill_per_sec = refill_per_sec
        self._now = now
        self._buckets: dict[str, dict] = {}
        self._lock = threading.Lock()  # guards the map; consider per-key locking

    def allow(self, key: str) -> bool:
        # TODO: get-or-create the bucket for this key, then make the
        # refill-then-consume atomic per bucket (watch the check-then-act gap).
        # State + defend the no-over-admit invariant.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "RateLimiter.kt",
          code: `import java.util.concurrent.ConcurrentHashMap

class RateLimiter(
    private val capacity: Double,
    private val refillPerSec: Double,
    private val now: () -> Long,
) {
    private class Bucket(var tokens: Double, var lastRefillMs: Long)
    private val buckets = ConcurrentHashMap<String, Bucket>()

    fun allow(key: String): Boolean {
        // TODO: get-or-create the bucket for this key, then make the
        // refill-then-consume atomic per bucket (watch the check-then-act gap).
        // State + defend the no-over-admit invariant.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "atomic-bucket-op", description: "The refill-then-consume on a single bucket is one atomic critical section — no gap where two threads both read then both consume.", weight: 25 },
        { id: "safe-get-or-create", description: "Getting-or-creating the per-key bucket is race-free (e.g. ConcurrentHashMap.computeIfAbsent / GetOrAdd / a lock), so two first-touch threads don't create two buckets.", weight: 25 },
        { id: "invariant", description: "The candidate explicitly states the no-over-admit / non-negative-tokens invariant and argues, with a concrete two-thread interleaving, why their synchronisation prevents violating it.", weight: 50 },
      ],
      canonicalApproach:
        "Store buckets in a concurrent map and create each key's bucket race-free (computeIfAbsent / GetOrAdd). Guard each " +
        "bucket's refill-then-consume with that bucket's own lock (lock (bucket) / a per-bucket mutex), so the whole " +
        "read-modify-write is atomic and different keys never contend. Inside the lock: refill from elapsed time, then " +
        "consume iff tokens >= 1. Per-key locking preserves throughput across keys; a single global lock is also correct " +
        "but serialises every key and should be named as the throughput tradeoff.",
      commonPitfalls: [
        "Locking only the map lookup but doing the refill/consume outside the lock — the check-then-act gap still over-admits.",
        "Using a plain dict/HashMap under concurrency, so two threads first-touching the same key create two buckets and each hands out a full capacity.",
        "An atomic integer decrement without the refill step being atomic too — refill and consume must be in the same critical section or a thread can consume against a stale token count.",
      ],
    },
    {
      stage: 4,
      title: "Per-client buckets with a memory bound",
      constraintAdded: "Unbounded keys would leak memory; idle buckets must be reclaimed.",
      narrative:
        "In production the key space is unbounded (one bucket per API key, per IP, per user) and buckets for keys that " +
        "went quiet sit in the map forever — a slow memory leak, and a DoS vector (spray unique keys to blow up the map). " +
        "This stage is about bounding memory without reintroducing the stage-3 race: reclaim buckets that have been full " +
        "and idle long enough that dropping them is behaviourally identical to keeping them.",
      prompt:
        "Bound the number of live buckets. Add reclamation of idle buckets — a bucket that has refilled back to full " +
        "capacity and hasn't been touched for some idle window carries no state worth keeping (recreating it full is " +
        "equivalent), so it can be evicted. Describe how you evict safely under concurrency (so you don't evict a bucket a " +
        "thread is mid-consume on, and don't double-count when a key reappears), and the tradeoff of your eviction trigger " +
        "(periodic sweep vs. size-capped LRU vs. evict-on-access).",
      skeletons: {
        csharp: {
          fileName: "RateLimiter.cs",
          code: `public class RateLimiter
{
    // ...capacity/refill/now and the concurrent bucket map from stage 3...

    public bool Allow(string key)
    {
        // unchanged from stage 3
        throw new NotImplementedException();
    }

    public void EvictIdle(long idleMs)
    {
        // TODO: reclaim buckets that are full (tokens == capacity) and whose
        // lastRefillMs is older than _now() - idleMs. Must be safe against a
        // concurrent Allow() on the same key.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "rate_limiter.py",
          code: `class RateLimiter:
    # ...capacity/refill/now and the concurrent bucket map from stage 3...

    def allow(self, key: str) -> bool:
        # unchanged from stage 3
        raise NotImplementedError

    def evict_idle(self, idle_ms: int) -> None:
        # TODO: reclaim buckets that are full (tokens == capacity) and whose
        # last_refill_ms is older than now() - idle_ms. Must be safe against a
        # concurrent allow() on the same key.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "RateLimiter.kt",
          code: `class RateLimiter(
    private val capacity: Double,
    private val refillPerSec: Double,
    private val now: () -> Long,
) {
    // ...concurrent bucket map from stage 3...

    fun allow(key: String): Boolean {
        // unchanged from stage 3
        TODO()
    }

    fun evictIdle(idleMs: Long) {
        // TODO: reclaim buckets that are full (tokens == capacity) and whose
        // lastRefillMs is older than now() - idleMs. Must be safe against a
        // concurrent allow() on the same key.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "safe-to-evict-condition", description: "Eviction only targets buckets whose state is reconstructable — full (at capacity) and idle — so dropping and later recreating them is behaviourally identical (no lost throttling).", weight: 30 },
        { id: "concurrent-eviction-safe", description: "Eviction can't drop a bucket a thread is mid-consume on, and a key reappearing after eviction starts fresh-but-full without double-admitting; the map remove is race-aware.", weight: 40 },
        { id: "trigger-tradeoff", description: "The candidate names the eviction trigger (periodic sweep / size-capped LRU / evict-on-access) and its memory-vs-CPU tradeoff.", weight: 30 },
      ],
      canonicalApproach:
        "Because a token bucket that has refilled to capacity is indistinguishable from a freshly created one, any full+idle " +
        "bucket is safe to drop and recreate on next touch. A periodic sweep (or a size-capped LRU) removes such buckets. " +
        "Do the remove under the same per-bucket lock and use a conditional remove (ConcurrentHashMap.remove(key, bucket) / " +
        "compare-and-remove) so you only delete the exact bucket instance you inspected — if a thread re-touched the key and " +
        "spent tokens in between, the value no longer matches and the remove is a no-op, avoiding the evict/consume race.",
      commonPitfalls: [
        "Evicting a partially-drained bucket, which resets it to full and lets a throttled client immediately burst again.",
        "Unconditional map.remove(key) racing an in-flight allow(), so a just-created bucket is deleted and the key gets a fresh full bucket — silently doubling its allowance.",
        "A global lock over the whole map for the sweep that stalls all allow() calls; a conditional per-entry remove keeps the sweep concurrent.",
      ],
    },
  ],
};
