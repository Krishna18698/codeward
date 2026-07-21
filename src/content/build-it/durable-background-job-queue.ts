import type { BuildItProblem } from "./types";

export const durableBackgroundJobQueue: BuildItProblem = {
  slug: "durable-background-job-queue",
  title: "Durable Background Job Queue",
  category: "distributed",
  brief:
    "A durable background job queue that evolves across four stages: enqueue/ack, retries with backoff, worker " +
    "leases under concurrency, dead-letter + idempotency. The hard part is ownership.",
  totalMinutes: 110,
  stages: [
    {
      stage: 1,
      title: "Enqueue and ack",
      constraintAdded: "None yet — this is the baseline.",
      narrative:
        "One producer enqueues jobs; one worker dequeues and processes them one at a time, acking on success so the " +
        "job is removed. No concurrency, no failure handling yet — just the basic shape.",
      prompt:
        "Design a JobQueue with enqueue(job) and a way for a worker to dequeue the next job and ack(jobId) when " +
        "processing succeeds. An acked job is gone; an un-acked job stays in the queue.",
      skeletons: {
        csharp: {
          fileName: "JobQueue.cs",
          code: `public class JobQueue
{
    public Guid Enqueue(string payload)
    {
        // TODO
        throw new NotImplementedException();
    }

    public Job Dequeue()
    {
        // TODO: return the next unprocessed job, or null if empty
        throw new NotImplementedException();
    }

    public void Ack(Guid jobId)
    {
        // TODO: remove the job — it's done
        throw new NotImplementedException();
    }
}

public class Job
{
    public Guid Id { get; }
    public string Payload { get; }
    public Job(Guid id, string payload) { Id = id; Payload = payload; }
}`,
        },
        python: {
          fileName: "job_queue.py",
          code: `from dataclasses import dataclass
import uuid

@dataclass
class Job:
    id: uuid.UUID
    payload: str

class JobQueue:
    def enqueue(self, payload: str) -> uuid.UUID:
        # TODO
        raise NotImplementedError

    def dequeue(self) -> "Job | None":
        # TODO: return the next unprocessed job, or None if empty
        raise NotImplementedError

    def ack(self, job_id: uuid.UUID) -> None:
        # TODO: remove the job — it's done
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "JobQueue.kt",
          code: `import java.util.UUID

data class Job(val id: UUID, val payload: String)

class JobQueue {
    fun enqueue(payload: String): UUID {
        // TODO
        TODO()
    }

    fun dequeue(): Job? {
        // TODO: return the next unprocessed job, or null if empty
        TODO()
    }

    fun ack(jobId: UUID) {
        // TODO: remove the job — it's done
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "fifo-shape", description: "Jobs come out in a well-defined order (FIFO is the reasonable default) with a stable identity.", weight: 30 },
        { id: "ack-removes", description: "ack() removes the job; an un-acked job remains dequeue-able (or at least isn't silently lost).", weight: 40 },
        { id: "dequeue-doesnt-double-hand", description: "A single dequeue() call doesn't hand the same job to two callers before either acks.", weight: 30 },
      ],
      canonicalApproach:
        "A simple in-memory FIFO structure (queue + a map of in-flight jobs) where dequeue() moves a job from " +
        "pending to in-flight, and ack() removes it from in-flight entirely. This stage deliberately doesn't handle " +
        "failure — that's stage 2.",
      commonPitfalls: [
        "Removing the job from the queue on dequeue() with no in-flight tracking at all, so a crash between dequeue and ack loses the job permanently — the exact problem stage 2 exists to fix, but worth not accidentally solving early in a way that breaks the stage-1 contract.",
      ],
      tests: {
        python: `# --- tests (read-only) ---
def _run():
    q = JobQueue()
    q.enqueue("a")
    q.enqueue("b")
    j1 = q.dequeue()
    assert j1 is not None, "dequeue returns a job when the queue is non-empty"
    assert j1.payload in ("a", "b"), "dequeued job carries a real payload"
    q.ack(j1.id)
    j2 = q.dequeue()
    assert j2 is not None, "second job is still available"
    assert j2.payload in ("a", "b"), "second job carries a real payload"
    q.ack(j2.id)
    assert q.dequeue() is None, "queue is empty after both jobs are acked"
    print("__BUILD_IT_PASS__")

_run()`,
        kotlin: `// --- tests (read-only) ---
fun main() {
    val q = JobQueue()
    q.enqueue("a")
    q.enqueue("b")
    val j1 = q.dequeue()
    checkNotNull(j1) { "dequeue returns a job when the queue is non-empty" }
    check(j1.payload == "a" || j1.payload == "b") { "dequeued job carries a real payload" }
    q.ack(j1.id)
    val j2 = q.dequeue()
    checkNotNull(j2) { "second job is still available" }
    q.ack(j2.id)
    check(q.dequeue() == null) { "queue is empty after both jobs are acked" }
    println("__BUILD_IT_PASS__")
}`,
        csharp: `// --- tests (read-only) ---
class TestRunner
{
    static void Check(bool cond, string msg) { if (!cond) throw new Exception("FAILED: " + msg); }
    static void Main()
    {
        var q = new JobQueue();
        q.Enqueue("a");
        q.Enqueue("b");
        var j1 = q.Dequeue();
        Check(j1 != null, "dequeue returns a job when the queue is non-empty");
        Check(j1.Payload == "a" || j1.Payload == "b", "dequeued job carries a real payload");
        q.Ack(j1.Id);
        var j2 = q.Dequeue();
        Check(j2 != null, "second job is still available");
        q.Ack(j2.Id);
        Check(q.Dequeue() == null, "queue is empty after both jobs are acked");
        Console.WriteLine("__BUILD_IT_PASS__");
    }
}`,
      },
    },
    {
      stage: 2,
      title: "Retries with backoff",
      constraintAdded: "A job that fails (or is never acked) must be retried, with increasing delay between attempts.",
      narrative:
        "Workers crash mid-job, or a job's handler throws. Product wants failed jobs retried automatically, but not " +
        "hammered immediately — each retry should wait longer than the last (exponential backoff), and after enough " +
        "failures, the job needs somewhere to go (dead-letter is stage 4; for now, cap retries and stop).",
      prompt:
        "Add nack(jobId) for explicit failure and a way for a job to become eligible for retry again after a " +
        "backoff delay that grows with each attempt. Track attempt count per job. A job should not be retried before " +
        "its backoff window has elapsed.",
      skeletons: {
        csharp: {
          fileName: "JobQueue.cs",
          code: `public class JobQueue
{
    // ...enqueue/dequeue/ack from stage 1...

    public void Nack(Guid jobId)
    {
        // TODO: increment attempt count, schedule for retry after backoff(attempt)
        throw new NotImplementedException();
    }

    private static TimeSpan Backoff(int attempt) =>
        TimeSpan.FromSeconds(Math.Pow(2, attempt)); // TODO: use or replace
}`,
        },
        python: {
          fileName: "job_queue.py",
          code: `class JobQueue:
    # ...enqueue/dequeue/ack from stage 1...

    def nack(self, job_id) -> None:
        # TODO: increment attempt count, schedule for retry after backoff(attempt)
        raise NotImplementedError

    @staticmethod
    def _backoff(attempt: int) -> float:
        return 2 ** attempt  # TODO: use or replace`,
        },
        kotlin: {
          fileName: "JobQueue.kt",
          code: `class JobQueue {
    // ...enqueue/dequeue/ack from stage 1...

    fun nack(jobId: UUID) {
        // TODO: increment attempt count, schedule for retry after backoff(attempt)
        TODO()
    }

    private fun backoff(attempt: Int): Duration =
        Duration.ofSeconds(2.0.pow(attempt).toLong()) // TODO: use or replace
}`,
        },
      },
      rubric: [
        { id: "attempt-tracking", description: "Each job tracks its own attempt count, incremented on nack/failure.", weight: 25 },
        { id: "growing-backoff", description: "The delay before a retry becomes eligible grows with attempt count (exponential or similar), not a fixed delay.", weight: 30 },
        { id: "backoff-enforced", description: "A job isn't handed back out by dequeue before its backoff window elapses.", weight: 30 },
        { id: "retry-cap", description: "There's a maximum attempt count after which the job stops being retried (even if what happens next isn't fully specified until stage 4).", weight: 15 },
      ],
      canonicalApproach:
        "Each job record carries attempts and nextEligibleAt. nack() increments attempts and sets nextEligibleAt = " +
        "now + backoff(attempts). dequeue() only considers jobs whose nextEligibleAt has passed. A job hitting a max " +
        "attempt count is excluded from further retries (parked, pending stage 4's dead-letter handling).",
      commonPitfalls: [
        "Retrying immediately on nack with no backoff at all — under a systemic failure (e.g. a downstream outage), this turns one failing job into a tight retry loop hammering the same dependency.",
        "Tracking backoff as a fixed sleep in the worker rather than a per-job eligibility timestamp the queue itself enforces — lets a misbehaving worker retry early.",
      ],
    },
    {
      stage: 3,
      title: "Worker leases under concurrency",
      constraintAdded: "Multiple worker processes pull from the same queue concurrently.",
      narrative:
        "One worker becomes a fleet. Now dequeue() is called concurrently by many workers, and a worker can crash " +
        "mid-job without ever calling ack or nack. The queue needs to grant temporary, exclusive ownership of a job to " +
        "whichever worker dequeues it — a lease — so a crashed worker's job eventually becomes available to someone " +
        "else, but two live workers never believe they both own the same job at once. This is the make-or-break stage.",
      prompt:
        "Turn dequeue() into a leased handout: the returned job is exclusively owned by that worker until it acks, " +
        "nacks, or the lease expires (worker presumed dead). While a lease is live, no other worker's dequeue() may " +
        "return that job. State the ownership invariant and argue, with a concrete interleaving of two workers " +
        "dequeuing concurrently, why it can't be violated.",
      invariant:
        "At any instant, at most one worker holds a live (non-expired) lease on a given job — two workers must never " +
        "both believe they currently own the same job.",
      skeletons: {
        csharp: {
          fileName: "JobQueue.cs",
          code: `public class JobQueue
{
    private readonly object _lock = new();
    // ...stages 1-2, plus per-job leaseExpiry/ownerId...

    public Job? Dequeue(string workerId, TimeSpan leaseDuration)
    {
        // TODO: atomically hand out a job no other live-leased worker holds,
        // and record who holds it + until when.
        throw new NotImplementedException();
    }

    public bool Ack(Guid jobId, string workerId)
    {
        // TODO: only the current lease holder may ack.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "job_queue.py",
          code: `import threading

class JobQueue:
    def __init__(self):
        self._lock = threading.Lock()
        # ...stages 1-2, plus per-job lease_expiry/owner_id...

    def dequeue(self, worker_id: str, lease_duration_seconds: float):
        # TODO: atomically hand out a job no other live-leased worker holds,
        # and record who holds it + until when.
        raise NotImplementedError

    def ack(self, job_id, worker_id: str) -> bool:
        # TODO: only the current lease holder may ack.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "JobQueue.kt",
          code: `import java.util.concurrent.locks.ReentrantLock

class JobQueue {
    private val lock = ReentrantLock()
    // ...stages 1-2, plus per-job leaseExpiry/ownerId...

    fun dequeue(workerId: String, leaseDuration: Duration): Job? {
        // TODO: atomically hand out a job no other live-leased worker holds,
        // and record who holds it + until when.
        TODO()
    }

    fun ack(jobId: UUID, workerId: String): Boolean {
        // TODO: only the current lease holder may ack.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "atomic-handout", description: "Selecting a job and marking it leased happen as one atomic step under concurrent dequeue() calls — no two workers can both select the same job.", weight: 30 },
        { id: "lease-expiry", description: "A lease has an expiry; an expired lease makes the job eligible for handout again (worker presumed dead).", weight: 25 },
        { id: "owner-checked-ack", description: "ack/nack verifies the caller is the current lease holder — a worker whose lease already expired can't ack a job someone else now owns.", weight: 20 },
        { id: "invariant", description: "States the single-owner invariant explicitly and argues, with a concrete two-worker race for the same job, why the atomic handout prevents double-ownership.", weight: 25 },
      ],
      canonicalApproach:
        "Guard the select-and-lease step with a lock (or, at the data layer, an atomic conditional update: `UPDATE " +
        "jobs SET owner = :worker, lease_until = :t WHERE id = :job AND (owner IS NULL OR lease_until < now())`, which " +
        "the database serializes without an application lock). ack/nack check `owner == callingWorker AND " +
        "lease_until >= now()` before accepting — a worker whose lease lapsed and got reassigned is rejected instead " +
        "of silently completing a job it no longer owns.",
      commonPitfalls: [
        "Checking 'is this job currently unowned' and then setting the owner as two separate steps — two workers both see unowned, both proceed, both believe they hold the lease.",
        "Letting ack() succeed purely based on job id, without checking the caller still holds a live lease — a slow worker whose lease already expired and was reassigned can ack a job it no longer owns, corrupting whoever picked it up next.",
        "No lease expiry at all — a crashed worker's job is leased forever and never retried.",
      ],
    },
    {
      stage: 4,
      title: "Dead-letter and idempotency",
      constraintAdded: "Jobs that exhaust their retry budget move to a dead-letter queue; processing must be idempotent.",
      narrative:
        "Stage 2 capped retries but didn't say what happens next — those jobs need to land somewhere inspectable " +
        "(a dead-letter queue) rather than vanishing. Separately: a worker can crash after successfully processing a " +
        "job's side effect but before acking — the lease expires, another worker picks up the same job, and processes " +
        "it again. The job handler itself needs to be safe to run more than once for the same job.",
      prompt:
        "When a job's attempt count exceeds its retry budget, move it to a dead-letter store instead of retrying " +
        "forever or silently dropping it. Separately, since stage 3's lease expiry means a job can be handed out more " +
        "than once (the previous worker may have already completed the side effect before its lease lapsed), describe " +
        "how you'd make job processing idempotent — the queue itself can't guarantee this alone; what contract does " +
        "it need from the job handler, and what would you add to the job record to support it?",
      skeletons: {
        csharp: {
          fileName: "JobQueue.cs",
          code: `public class JobQueue
{
    // ...stages 1-3...
    private readonly List<Job> _deadLetter = new();

    public void Nack(Guid jobId)
    {
        // TODO: on exceeding max attempts, move to dead-letter instead of
        // rescheduling. Also: how does the job record support idempotent
        // re-processing after a reclaimed lease?
        throw new NotImplementedException();
    }

    public IReadOnlyList<Job> DeadLetterQueue => _deadLetter;
}`,
        },
        python: {
          fileName: "job_queue.py",
          code: `class JobQueue:
    def __init__(self):
        # ...stages 1-3...
        self._dead_letter: list = []

    def nack(self, job_id) -> None:
        # TODO: on exceeding max attempts, move to dead-letter instead of
        # rescheduling. Also: how does the job record support idempotent
        # re-processing after a reclaimed lease?
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "JobQueue.kt",
          code: `class JobQueue {
    // ...stages 1-3...
    private val deadLetter = mutableListOf<Job>()

    fun nack(jobId: UUID) {
        // TODO: on exceeding max attempts, move to dead-letter instead of
        // rescheduling. Also: how does the job record support idempotent
        // re-processing after a reclaimed lease?
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "dlq-transition", description: "A job exceeding its retry budget is moved to a dead-letter store, not retried indefinitely or dropped silently.", weight: 30 },
        { id: "dlq-inspectable", description: "Dead-lettered jobs remain inspectable (payload + failure history retained), not just discarded.", weight: 20 },
        { id: "idempotency-contract", description: "Articulates a concrete idempotency mechanism — e.g. an idempotency key on the job carried through to the handler's side effect, or a processed-marker checked before re-running the side effect — not just 'the handler should be idempotent' as an unexamined assertion.", weight: 50 },
      ],
      canonicalApproach:
        "nack() checks attempts against the max after incrementing; once exceeded, move the job (payload + attempt " +
        "history) into the dead-letter store instead of computing a new backoff. For idempotency: give each job a " +
        "stable key that the handler's side effect uses as its own idempotency token (e.g. the same pattern as the " +
        "Idempotent Payment Processor problem) — the queue's job id is a natural fit, since it's stable across " +
        "leases and retries of the same logical unit of work. The handler, not the queue, is responsible for using it " +
        "(check-before-act against a processed-ids store, or an idempotent underlying operation), but the queue must " +
        "guarantee the same job id is reused across all attempts of the same logical job for that contract to work.",
      commonPitfalls: [
        "Treating 'the handler should be idempotent' as a solved problem without saying how — the grading rubric here specifically wants a concrete mechanism, not just an assertion.",
        "Generating a new id per attempt instead of reusing the original job id — breaks any idempotency key the handler tries to derive from it.",
        "Dropping dead-lettered jobs entirely rather than retaining them for inspection — defeats the operational purpose of a dead-letter queue.",
      ],
    },
  ],
};
