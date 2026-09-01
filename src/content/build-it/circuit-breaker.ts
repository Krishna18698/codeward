import type { BuildItProblem } from "./types";

export const circuitBreaker: BuildItProblem = {
  slug: "circuit-breaker",
  title: "Circuit Breaker",
  category: "distributed",
  brief:
    "The resilience wrapper that stops hammering a failing dependency, across four stages: trip open on repeated " +
    "failures, half-open probing after a cooldown, thread-safe state transitions under load, then a sliding-window " +
    "failure rate. The model is allow() + recordSuccess()/recordFailure(); time is an injected clock so it's testable.",
  totalMinutes: 90,
  stages: [
    {
      stage: 1,
      title: "Trip open on consecutive failures",
      constraintAdded: "None yet — this is the baseline.",
      narrative:
        "A downstream dependency starts failing and your service keeps calling it, piling up timeouts and making things " +
        "worse. A circuit breaker sits in front: while Closed, calls flow; after enough consecutive failures it trips to " +
        "Open and short-circuits (fail fast, don't call). Recovery comes in stage 2 — here the breaker just needs to trip. " +
        "The caller asks allow() before calling, then reports the outcome via recordSuccess()/recordFailure().",
      prompt:
        "Implement a breaker that starts Closed. allow() returns true while Closed. recordFailure() increments a " +
        "consecutive-failure count; when it reaches failureThreshold, trip to Open. recordSuccess() resets the " +
        "consecutive-failure count. Once Open, allow() returns false. (No time-based recovery yet — that's stage 2.)",
      skeletons: {
        csharp: {
          fileName: "CircuitBreaker.cs",
          code: `public class CircuitBreaker
{
    private readonly int _failureThreshold;
    // TODO: state (Closed/Open) + consecutive failure count

    public CircuitBreaker(int failureThreshold)
    {
        _failureThreshold = failureThreshold;
    }

    public bool Allow()
    {
        // TODO: true while Closed, false once Open
        throw new NotImplementedException();
    }

    public void RecordSuccess()
    {
        // TODO: reset the consecutive-failure count
        throw new NotImplementedException();
    }

    public void RecordFailure()
    {
        // TODO: count consecutive failures; trip to Open at _failureThreshold
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "circuit_breaker.py",
          code: `class CircuitBreaker:
    def __init__(self, failure_threshold: int):
        self._k = failure_threshold
        # TODO: state (Closed/Open) + consecutive failure count

    def allow(self) -> bool:
        # TODO: True while Closed, False once Open
        raise NotImplementedError

    def record_success(self) -> None:
        # TODO: reset the consecutive-failure count
        raise NotImplementedError

    def record_failure(self) -> None:
        # TODO: count consecutive failures; trip to Open at failure_threshold
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "CircuitBreaker.kt",
          code: `class CircuitBreaker(private val failureThreshold: Int) {
    // TODO: state (Closed/Open) + consecutive failure count

    fun allow(): Boolean {
        // TODO: true while Closed, false once Open
        TODO()
    }

    fun recordSuccess() {
        // TODO: reset the consecutive-failure count
        TODO()
    }

    fun recordFailure() {
        // TODO: count consecutive failures; trip to Open at failureThreshold
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "closed-allows", description: "While Closed, allow() returns true.", weight: 25 },
        { id: "trip-on-threshold", description: "Reaching failureThreshold consecutive failures trips the breaker to Open, after which allow() returns false.", weight: 40 },
        { id: "success-resets", description: "recordSuccess resets the consecutive-failure count, so non-consecutive failures don't trip it.", weight: 35 },
      ],
      canonicalApproach:
        "Hold a state (Closed/Open) and a consecutive-failure counter. allow() returns state == Closed. recordFailure " +
        "increments the counter and, if it reaches the threshold, sets state to Open. recordSuccess zeroes the counter. The " +
        "key detail is 'consecutive': a success in the middle resets the run, so only an unbroken streak of failures trips it.",
      commonPitfalls: [
        "Counting total failures ever, not consecutive ones, so the breaker trips on scattered unrelated failures.",
        "Not resetting on success, which is the same bug seen from the other side.",
        "Letting allow() still return true after tripping because the state check reads the counter instead of the state.",
      ],
      tests: {
        python: `# --- tests (read-only) ---
def _run():
    cb = CircuitBreaker(failure_threshold=3)
    assert cb.allow() is True, "starts closed"
    cb.record_failure(); cb.record_failure()      # 2 consecutive
    assert cb.allow() is True, "under threshold, still closed"
    cb.record_success()                            # resets the streak
    cb.record_failure(); cb.record_failure()      # 2 again
    assert cb.allow() is True, "streak was reset, still closed"
    cb.record_failure()                            # 3rd consecutive -> trip
    assert cb.allow() is False, "tripped open at threshold"
    print("__BUILD_IT_PASS__")

_run()`,
        kotlin: `// --- tests (read-only) ---
fun main() {
    val cb = CircuitBreaker(3)
    check(cb.allow()) { "starts closed" }
    cb.recordFailure(); cb.recordFailure()
    check(cb.allow()) { "under threshold, still closed" }
    cb.recordSuccess()
    cb.recordFailure(); cb.recordFailure()
    check(cb.allow()) { "streak was reset, still closed" }
    cb.recordFailure()
    check(!cb.allow()) { "tripped open at threshold" }
    println("__BUILD_IT_PASS__")
}`,
        csharp: `// --- tests (read-only) ---
class TestRunner
{
    static void Check(bool cond, string msg) { if (!cond) throw new Exception("FAILED: " + msg); }
    static void Main()
    {
        var cb = new CircuitBreaker(3);
        Check(cb.Allow(), "starts closed");
        cb.RecordFailure(); cb.RecordFailure();
        Check(cb.Allow(), "under threshold, still closed");
        cb.RecordSuccess();
        cb.RecordFailure(); cb.RecordFailure();
        Check(cb.Allow(), "streak was reset, still closed");
        cb.RecordFailure();
        Check(!cb.Allow(), "tripped open at threshold");
        Console.WriteLine("__BUILD_IT_PASS__");
    }
}`,
      },
    },
    {
      stage: 2,
      title: "Half-open probing after a cooldown",
      constraintAdded: "After a cooldown the breaker must test recovery with a single probe before fully closing.",
      narrative:
        "A breaker that trips and stays Open forever is useless — the dependency recovers and you never notice. Add a " +
        "reset timeout: after the breaker has been Open for resetTimeoutMs, it moves to Half-Open and lets a single probe " +
        "request through. If that probe succeeds, close the breaker; if it fails, go back to Open and restart the cooldown. " +
        "Time comes from the injected now() clock so this is deterministic.",
      prompt:
        "Add a reset timeout and a Half-Open state. When Open and now() - openedAt >= resetTimeoutMs, the next allow() " +
        "transitions to Half-Open and returns true for exactly ONE probe; further allow() calls while the probe is in " +
        "flight return false. In Half-Open, recordSuccess() closes the breaker (reset counters); recordFailure() reopens it " +
        "and restarts the cooldown from now().",
      skeletons: {
        csharp: {
          fileName: "CircuitBreaker.cs",
          code: `public class CircuitBreaker
{
    private readonly int _failureThreshold;
    private readonly long _resetTimeoutMs;
    private readonly Func<long> _now;
    // TODO: state (Closed/Open/HalfOpen), failure count, openedAt, probe-in-flight flag

    public CircuitBreaker(int failureThreshold, long resetTimeoutMs, Func<long> now)
    {
        _failureThreshold = failureThreshold;
        _resetTimeoutMs = resetTimeoutMs;
        _now = now;
    }

    public bool Allow()
    {
        // TODO: Closed -> true. Open -> if cooldown elapsed, go HalfOpen and allow
        // ONE probe (else false). HalfOpen -> allow only if no probe already in flight.
        throw new NotImplementedException();
    }

    public void RecordSuccess()
    {
        // TODO: HalfOpen -> Closed (reset). Closed -> reset failure count.
        throw new NotImplementedException();
    }

    public void RecordFailure()
    {
        // TODO: HalfOpen -> Open (restart cooldown at _now()). Closed -> count/trip.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "circuit_breaker.py",
          code: `from typing import Callable

class CircuitBreaker:
    CLOSED, OPEN, HALF_OPEN = "closed", "open", "half_open"

    def __init__(self, failure_threshold: int, reset_timeout_ms: int, now: Callable[[], int]):
        self._k = failure_threshold
        self._reset = reset_timeout_ms
        self._now = now
        # TODO: state, failure count, opened_at, probe-in-flight flag

    def allow(self) -> bool:
        # TODO: Closed -> True. Open -> if cooldown elapsed, go HalfOpen and allow
        # ONE probe (else False). HalfOpen -> allow only if no probe already in flight.
        raise NotImplementedError

    def record_success(self) -> None:
        # TODO: HalfOpen -> Closed (reset). Closed -> reset failure count.
        raise NotImplementedError

    def record_failure(self) -> None:
        # TODO: HalfOpen -> Open (restart cooldown at now()). Closed -> count/trip.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "CircuitBreaker.kt",
          code: `class CircuitBreaker(
    private val failureThreshold: Int,
    private val resetTimeoutMs: Long,
    private val now: () -> Long,
) {
    private enum class State { CLOSED, OPEN, HALF_OPEN }
    // TODO: state, failure count, openedAt, probe-in-flight flag

    fun allow(): Boolean {
        // TODO: Closed -> true. Open -> if cooldown elapsed, go HalfOpen and allow
        // ONE probe (else false). HalfOpen -> allow only if no probe already in flight.
        TODO()
    }

    fun recordSuccess() {
        // TODO: HalfOpen -> Closed (reset). Closed -> reset failure count.
        TODO()
    }

    fun recordFailure() {
        // TODO: HalfOpen -> Open (restart cooldown at now()). Closed -> count/trip.
        TODO()
    }
}`,
        },
      },
      tests: {
        python: `# --- tests (read-only) ---
def _run():
    t = [0]
    cb = CircuitBreaker(2, 1000, now=lambda: t[0])
    cb.record_failure(); cb.record_failure()   # trip open at t=0
    assert cb.allow() is False, "open within cooldown"
    t[0] = 1000
    assert cb.allow() is True, "cooldown elapsed -> one probe allowed"
    assert cb.allow() is False, "only one probe in half-open"
    cb.record_failure()                         # probe fails -> reopen at t=1000
    assert cb.allow() is False, "reopened, cooldown restarted"
    t[0] = 2000
    assert cb.allow() is True, "cooldown elapsed again -> probe"
    cb.record_success()                         # probe succeeds -> closed
    assert cb.allow() is True, "closed after successful probe"
    assert cb.allow() is True, "closed allows freely"
    print("__BUILD_IT_PASS__")

_run()`,
        kotlin: `// --- tests (read-only) ---
fun main() {
    var t = 0L
    val cb = CircuitBreaker(2, 1000) { t }
    cb.recordFailure(); cb.recordFailure()
    check(!cb.allow()) { "open within cooldown" }
    t = 1000
    check(cb.allow()) { "cooldown elapsed -> one probe allowed" }
    check(!cb.allow()) { "only one probe in half-open" }
    cb.recordFailure()
    check(!cb.allow()) { "reopened, cooldown restarted" }
    t = 2000
    check(cb.allow()) { "cooldown elapsed again -> probe" }
    cb.recordSuccess()
    check(cb.allow()) { "closed after successful probe" }
    check(cb.allow()) { "closed allows freely" }
    println("__BUILD_IT_PASS__")
}`,
        csharp: `// --- tests (read-only) ---
class TestRunner
{
    static void Check(bool cond, string msg) { if (!cond) throw new Exception("FAILED: " + msg); }
    static void Main()
    {
        long t = 0;
        var cb = new CircuitBreaker(2, 1000, () => t);
        cb.RecordFailure(); cb.RecordFailure();
        Check(!cb.Allow(), "open within cooldown");
        t = 1000;
        Check(cb.Allow(), "cooldown elapsed -> one probe allowed");
        Check(!cb.Allow(), "only one probe in half-open");
        cb.RecordFailure();
        Check(!cb.Allow(), "reopened, cooldown restarted");
        t = 2000;
        Check(cb.Allow(), "cooldown elapsed again -> probe");
        cb.RecordSuccess();
        Check(cb.Allow(), "closed after successful probe");
        Check(cb.Allow(), "closed allows freely");
        Console.WriteLine("__BUILD_IT_PASS__");
    }
}`,
      },
      rubric: [
        { id: "cooldown-to-halfopen", description: "After resetTimeoutMs Open, allow() transitions to Half-Open and permits a probe; before that it stays Open and returns false.", weight: 25 },
        { id: "single-probe", description: "Half-Open admits exactly one probe; further allow() calls while the probe is unresolved return false.", weight: 35 },
        { id: "probe-outcome", description: "A Half-Open success closes the breaker (counters reset); a Half-Open failure reopens it and restarts the cooldown from now().", weight: 40 },
      ],
      canonicalApproach:
        "Add openedAt (set on every trip) and a probeInFlight flag. allow(): Closed -> true; Open -> if now()-openedAt >= " +
        "resetTimeoutMs, move to Half-Open, set probeInFlight, return true, else false; Half-Open -> return true only if " +
        "probeInFlight is not already set. recordSuccess in Half-Open -> Closed and clear counters/flag; recordFailure in " +
        "Half-Open -> Open, openedAt = now(), clear flag. The single-probe flag is what stops a herd of half-open requests " +
        "from all hitting a still-sick dependency.",
      commonPitfalls: [
        "Allowing every request through in Half-Open, so recovery testing becomes another flood on a fragile dependency.",
        "Not restarting the cooldown when the probe fails, so the breaker re-probes immediately on the next call.",
        "Comparing elapsed time against a relative duration stored at trip time instead of an absolute openedAt + timeout, drifting as the clock moves.",
      ],
    },
    {
      stage: 3,
      title: "Thread-safe state transitions under load",
      constraintAdded: "Many threads call allow()/record* concurrently around the breaker.",
      narrative:
        "The breaker fronts a dependency called from a whole thread pool, so allow(), recordSuccess() and recordFailure() " +
        "fire concurrently. The stage-2 logic does read-modify-write on state, counters, and the probe flag with no " +
        "synchronisation. Under concurrency this breaks in nasty ways: two threads both see the cooldown elapsed and both " +
        "get admitted as 'the one probe'; interleaved recordFailure calls lose increments so the breaker never trips; a " +
        "thread reads Closed while another is mid-transition to Open. This is the make-or-break stage.",
      prompt:
        "Make the breaker correct under concurrent allow()/recordSuccess()/recordFailure(). State the invariants precisely " +
        "and defend them with a concrete interleaving. In particular guarantee that Half-Open admits at most one probe no " +
        "matter how many threads call allow() simultaneously, that failure counting loses no updates, and that a state " +
        "transition is atomic (no thread acts on a half-changed breaker). Discuss your synchronisation choice.",
      invariant:
        "At most one probe request is ever admitted per Half-Open episode, regardless of how many threads call allow() at " +
        "once. State transitions are atomic — no two threads drive conflicting transitions and no thread observes a " +
        "partially-applied change — and no recordFailure increment is lost, so the breaker trips at exactly the threshold.",
      skeletons: {
        csharp: {
          fileName: "CircuitBreaker.cs",
          code: `public class CircuitBreaker
{
    private readonly int _failureThreshold;
    private readonly long _resetTimeoutMs;
    private readonly Func<long> _now;
    private readonly object _lock = new();
    // ...state, count, openedAt, probeInFlight from stage 2...

    public CircuitBreaker(int failureThreshold, long resetTimeoutMs, Func<long> now)
    {
        _failureThreshold = failureThreshold; _resetTimeoutMs = resetTimeoutMs; _now = now;
    }

    public bool Allow()
    {
        // TODO: make the read-decide-transition one atomic step so only ONE
        // thread wins the half-open probe. Defend the invariants.
        throw new NotImplementedException();
    }

    public void RecordSuccess() { throw new NotImplementedException(); }
    public void RecordFailure() { throw new NotImplementedException(); }
}`,
        },
        python: {
          fileName: "circuit_breaker.py",
          code: `import threading
from typing import Callable

class CircuitBreaker:
    CLOSED, OPEN, HALF_OPEN = "closed", "open", "half_open"

    def __init__(self, failure_threshold: int, reset_timeout_ms: int, now: Callable[[], int]):
        self._k = failure_threshold
        self._reset = reset_timeout_ms
        self._now = now
        self._lock = threading.Lock()
        # ...state, count, opened_at, probe_in_flight from stage 2...

    def allow(self) -> bool:
        # TODO: make the read-decide-transition one atomic step so only ONE
        # thread wins the half-open probe. Defend the invariants.
        raise NotImplementedError

    def record_success(self) -> None:
        raise NotImplementedError

    def record_failure(self) -> None:
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "CircuitBreaker.kt",
          code: `import java.util.concurrent.locks.ReentrantLock

class CircuitBreaker(
    private val failureThreshold: Int,
    private val resetTimeoutMs: Long,
    private val now: () -> Long,
) {
    private enum class State { CLOSED, OPEN, HALF_OPEN }
    private val lock = ReentrantLock()
    // ...state, count, openedAt, probeInFlight from stage 2...

    fun allow(): Boolean {
        // TODO: make the read-decide-transition one atomic step so only ONE
        // thread wins the half-open probe. Defend the invariants.
        TODO()
    }

    fun recordSuccess() { TODO() }
    fun recordFailure() { TODO() }
}`,
        },
      },
      rubric: [
        { id: "atomic-transition", description: "The read-decide-transition in allow() (and the counter/state changes in record*) happen inside one critical section, so no thread acts on a half-changed breaker.", weight: 25 },
        { id: "no-lost-increments", description: "Concurrent recordFailure calls each count (no lost updates), so the breaker trips at exactly the threshold rather than sailing past it.", weight: 25 },
        { id: "invariant", description: "The candidate states the single-probe + atomic-transition + no-lost-increment invariant and argues, with a concrete interleaving (e.g. two threads both finding the cooldown elapsed), why only one probe is admitted.", weight: 50 },
      ],
      canonicalApproach:
        "Guard the whole breaker with one mutex and take it for the entirety of allow() and both record* methods — each is " +
        "a short read-modify-write, so contention is minimal and a lock is simpler and safer than a hand-rolled lock-free " +
        "state machine. The key move is that deciding 'the cooldown elapsed' and setting probeInFlight happen in the same " +
        "locked section, so a second thread that enters allow() sees probeInFlight already set and is refused. A CAS-based " +
        "lock-free version is possible (compare-and-set the state Open->HalfOpen; only the winner probes) and worth naming, " +
        "but the lock is the expected answer.",
      commonPitfalls: [
        "Checking the state, then locking (or not) and transitioning — the check-then-act gap lets two threads both become 'the probe'.",
        "A non-atomic failure counter (plain field increment) that loses updates under contention, so the breaker never reaches the threshold.",
        "Locking record* but leaving allow() lock-free (or vice versa), so a transition still races a read.",
      ],
    },
    {
      stage: 4,
      title: "Sliding-window failure rate",
      constraintAdded: "Trip on failure RATE over a rolling window, not a raw consecutive count.",
      narrative:
        "Consecutive-failure counting is crude: a dependency that fails 40% of the time (clearly unhealthy) might never " +
        "string together enough consecutive failures to trip, while an otherwise-healthy dependency trips on a brief blip. " +
        "Production breakers trip on a failure RATE over a rolling time window (e.g. >50% failures over the last 10s, given " +
        "a minimum sample count). This stage swaps the trip condition without disturbing the stage-3 concurrency safety.",
      prompt:
        "Replace the consecutive-failure trigger with a sliding-window one: track successes and failures over the last " +
        "windowMs and trip from Closed to Open when the failure rate exceeds a threshold, provided a minimum number of " +
        "samples has been seen (so one early failure doesn't trip at 100%). Describe your window representation (ring of " +
        "time buckets vs. timestamped events) and how you keep the stage-3 atomicity while evicting old samples.",
      skeletons: {
        csharp: {
          fileName: "CircuitBreaker.cs",
          code: `public class CircuitBreaker
{
    // ...thread-safe breaker from stage 3, now with a rolling window...

    public CircuitBreaker(double failureRateThreshold, int minSamples, long windowMs,
                          long resetTimeoutMs, Func<long> now)
    {
        // TODO
    }

    // record* now append a timestamped outcome to the window; Closed trips when
    // failureRate(last windowMs) > failureRateThreshold AND samples >= minSamples.
    public void RecordSuccess() { throw new NotImplementedException(); }
    public void RecordFailure() { throw new NotImplementedException(); }
    public bool Allow() { throw new NotImplementedException(); }
}`,
        },
        python: {
          fileName: "circuit_breaker.py",
          code: `from typing import Callable

class CircuitBreaker:
    # ...thread-safe breaker from stage 3, now with a rolling window...

    def __init__(self, failure_rate_threshold: float, min_samples: int, window_ms: int,
                 reset_timeout_ms: int, now: Callable[[], int]):
        ...  # TODO

    # record* append a timestamped outcome to the window; Closed trips when
    # failure_rate(last window_ms) > failure_rate_threshold AND samples >= min_samples.
    def record_success(self) -> None: raise NotImplementedError
    def record_failure(self) -> None: raise NotImplementedError
    def allow(self) -> bool: raise NotImplementedError`,
        },
        kotlin: {
          fileName: "CircuitBreaker.kt",
          code: `class CircuitBreaker(
    private val failureRateThreshold: Double,
    private val minSamples: Int,
    private val windowMs: Long,
    private val resetTimeoutMs: Long,
    private val now: () -> Long,
) {
    // ...thread-safe breaker from stage 3, now with a rolling window...

    // record* append a timestamped outcome to the window; Closed trips when
    // failureRate(last windowMs) > failureRateThreshold AND samples >= minSamples.
    fun recordSuccess() { TODO() }
    fun recordFailure() { TODO() }
    fun allow(): Boolean { TODO() }
}`,
        },
      },
      rubric: [
        { id: "rate-over-window", description: "Trip decision is based on the failure rate over the last windowMs, computed from outcomes that are evicted once older than the window.", weight: 35 },
        { id: "min-samples-guard", description: "The breaker only trips once at least minSamples outcomes are in the window, so a single early failure at 100% doesn't trip it.", weight: 30 },
        { id: "atomicity-preserved", description: "Appending/evicting window samples and the trip check stay atomic (the stage-3 locking still covers the whole read-modify-write), and Half-Open probing is unchanged.", weight: 35 },
      ],
      canonicalApproach:
        "Represent the window as a ring of fixed time buckets (e.g. ten 1-second buckets), each holding success/failure " +
        "counts; on each record, roll the ring forward to now() (zeroing buckets you skipped past) and bump the current " +
        "bucket. The failure rate is failures/(failures+successes) summed across live buckets; trip if that exceeds the " +
        "threshold and total samples >= minSamples. Bucketing bounds memory and makes eviction O(1) vs. a growing list of " +
        "timestamps. All of it runs inside the stage-3 lock so the window update and trip check remain one atomic step.",
      commonPitfalls: [
        "An unbounded list of timestamped events that grows without eviction — a memory leak under sustained traffic.",
        "Dropping the min-samples guard, so the very first request failing trips the breaker at a 100% rate.",
        "Rolling the window outside the lock, so a concurrent record sees a partially-evicted window and computes a bogus rate.",
      ],
    },
  ],
};
