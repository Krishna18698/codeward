import type { BuildItProblem } from "./types";

export const notificationDeliveryService: BuildItProblem = {
  slug: "notification-delivery-service",
  title: "Notification Delivery Service",
  category: "api",
  brief:
    "A notification delivery service that evolves across four stages: devices + fan-out, preferences + " +
    "cancellation, bounded concurrent delivery, retry/invalid-token/expiry.",
  totalMinutes: 100,
  stages: [
    {
      stage: 1,
      title: "Devices and fan-out",
      constraintAdded: "None yet — this is the baseline.",
      narrative:
        "A user can register multiple devices (phone, tablet, ...). Sending a notification to a user means fanning " +
        "it out to every device they've registered.",
      prompt:
        "Design a NotificationService with registerDevice(userId, token) and notify(userId, message), where " +
        "notify sends the message to every token registered for that user.",
      skeletons: {
        csharp: {
          fileName: "NotificationService.cs",
          code: `public class NotificationService
{
    public void RegisterDevice(string userId, string token)
    {
        // TODO
        throw new NotImplementedException();
    }

    public void Notify(string userId, string message, IPushProvider provider)
    {
        // TODO: send to every token registered for userId
        throw new NotImplementedException();
    }
}

public interface IPushProvider { void Send(string token, string message); }`,
        },
        python: {
          fileName: "notification_service.py",
          code: `from typing import Protocol

class PushProvider(Protocol):
    def send(self, token: str, message: str) -> None: ...

class NotificationService:
    def register_device(self, user_id: str, token: str) -> None:
        # TODO
        raise NotImplementedError

    def notify(self, user_id: str, message: str, provider: PushProvider) -> None:
        # TODO: send to every token registered for user_id
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "NotificationService.kt",
          code: `fun interface PushProvider { fun send(token: String, message: String) }

class NotificationService {
    fun registerDevice(userId: String, token: String) {
        // TODO
        TODO()
    }

    fun notify(userId: String, message: String, provider: PushProvider) {
        // TODO: send to every token registered for userId
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "multi-device", description: "A user can have multiple registered tokens; the data model supports a set/list per user, not a single token overwritten.", weight: 40 },
        { id: "fan-out", description: "notify() sends to every currently-registered token for that user.", weight: 40 },
        { id: "dedup-registration", description: "Registering the same token twice doesn't create a duplicate send target.", weight: 20 },
      ],
      canonicalApproach:
        "A user-to-tokens map (set, not list, so re-registering the same token is naturally a no-op). notify() looks " +
        "up the set and calls the provider once per token, sequentially at this stage — concurrency comes in stage 3.",
      commonPitfalls: [
        "Storing one token per user (overwriting on each registerDevice call) instead of a set — silently breaks multi-device fan-out.",
      ],
      tests: {
        python: `# --- tests (read-only) ---
def _run():
    sent = []
    class FakeProvider:
        def send(self, token, message):
            sent.append((token, message))
    svc = NotificationService()
    svc.register_device("u1", "tokenA")
    svc.register_device("u1", "tokenB")
    svc.register_device("u2", "tokenC")
    svc.notify("u1", "hello", FakeProvider())
    tokens = sorted(t for t, _ in sent)
    assert tokens == ["tokenA", "tokenB"], "notify fans out to all of u1's devices and no others"
    assert all(m == "hello" for _, m in sent), "message is delivered as-is"
    print("__BUILD_IT_PASS__")

_run()`,
        kotlin: `// --- tests (read-only) ---
fun main() {
    val sent = mutableListOf<Pair<String, String>>()
    val provider = PushProvider { token, message -> sent.add(token to message) }
    val svc = NotificationService()
    svc.registerDevice("u1", "tokenA")
    svc.registerDevice("u1", "tokenB")
    svc.registerDevice("u2", "tokenC")
    svc.notify("u1", "hello", provider)
    val tokens = sent.map { it.first }.sorted()
    check(tokens == listOf("tokenA", "tokenB")) { "notify fans out to all of u1's devices and no others" }
    check(sent.all { it.second == "hello" }) { "message is delivered as-is" }
    println("__BUILD_IT_PASS__")
}`,
        csharp: `// --- tests (read-only) ---
class CapturingProvider : IPushProvider
{
    public List<string> Tokens = new();
    public List<string> Messages = new();
    public void Send(string token, string message) { Tokens.Add(token); Messages.Add(message); }
}

class TestRunner
{
    static void Check(bool cond, string msg) { if (!cond) throw new Exception("FAILED: " + msg); }
    static void Main()
    {
        var provider = new CapturingProvider();
        var svc = new NotificationService();
        svc.RegisterDevice("u1", "tokenA");
        svc.RegisterDevice("u1", "tokenB");
        svc.RegisterDevice("u2", "tokenC");
        svc.Notify("u1", "hello", provider);
        provider.Tokens.Sort();
        Check(provider.Tokens.Count == 2 && provider.Tokens[0] == "tokenA" && provider.Tokens[1] == "tokenB", "notify fans out to all of u1's devices and no others");
        Check(provider.Messages.TrueForAll(m => m == "hello"), "message is delivered as-is");
        Console.WriteLine("__BUILD_IT_PASS__");
    }
}`,
      },
    },
    {
      stage: 2,
      title: "Preferences and cancellation",
      constraintAdded: "Users can opt out per notification category, and an in-flight notification can be cancelled before it's fully sent.",
      narrative:
        "Not every notification should go to every device — users have per-category preferences (e.g. opted out of " +
        "'marketing' but not 'security'). Separately, a notification already queued for fan-out (large campaign, " +
        "still sending to remaining devices) should be cancellable — a cancelled notification stops sending to any " +
        "device it hasn't already reached, but doesn't unsend what's already gone out.",
      prompt:
        "Add a category to notify(userId, category, message) and a per-user preference map so notify() skips users " +
        "who've opted out of that category. Add cancel(notificationId) that, for a notification currently mid-fan-out, " +
        "stops any remaining un-sent deliveries without affecting ones already sent.",
      skeletons: {
        csharp: {
          fileName: "NotificationService.cs",
          code: `public class NotificationService
{
    // ...stage 1 device registry...
    private readonly Dictionary<string, HashSet<string>> _optOuts = new(); // userId -> categories

    public void SetPreference(string userId, string category, bool optedIn)
    {
        // TODO
        throw new NotImplementedException();
    }

    public Guid Notify(string userId, string category, string message, IPushProvider provider)
    {
        // TODO: skip if opted out; return an id that cancel() can reference mid-fan-out
        throw new NotImplementedException();
    }

    public void Cancel(Guid notificationId)
    {
        // TODO: stop remaining un-sent deliveries; already-sent ones are unaffected
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "notification_service.py",
          code: `class NotificationService:
    def __init__(self):
        # ...stage 1 device registry...
        self._opt_outs: dict[str, set[str]] = {}  # user_id -> categories

    def set_preference(self, user_id: str, category: str, opted_in: bool) -> None:
        # TODO
        raise NotImplementedError

    def notify(self, user_id: str, category: str, message: str, provider: PushProvider) -> str:
        # TODO: skip if opted out; return an id that cancel() can reference mid-fan-out
        raise NotImplementedError

    def cancel(self, notification_id: str) -> None:
        # TODO: stop remaining un-sent deliveries; already-sent ones are unaffected
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "NotificationService.kt",
          code: `class NotificationService {
    // ...stage 1 device registry...
    private val optOuts = mutableMapOf<String, MutableSet<String>>() // userId -> categories

    fun setPreference(userId: String, category: String, optedIn: Boolean) {
        // TODO
        TODO()
    }

    fun notify(userId: String, category: String, message: String, provider: PushProvider): UUID {
        // TODO: skip if opted out; return an id that cancel() can reference mid-fan-out
        TODO()
    }

    fun cancel(notificationId: UUID) {
        // TODO: stop remaining un-sent deliveries; already-sent ones are unaffected
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "preference-checked-per-send", description: "The opt-out check happens per-category before fan-out proceeds for that user.", weight: 30 },
        { id: "cancellable-fan-out", description: "A notification's fan-out is modeled as an ongoing/inspectable operation (not a single synchronous call that's already finished by the time cancel() could matter), with an id cancel() can reference.", weight: 40 },
        { id: "partial-cancel-semantics", description: "Cancelling stops only remaining deliveries — already-sent ones are correctly left alone, not retracted or double-counted.", weight: 30 },
      ],
      canonicalApproach:
        "notify() checks the opt-out set before doing anything else; if opted out, it's a no-op. For cancellation, " +
        "model fan-out as iterating a device list with a per-notification cancelled flag checked before each " +
        "individual send — cancel() just sets that flag, and the in-progress fan-out loop (however it's structured: " +
        "synchronous loop, background task, or queue of per-device send jobs) checks it before each send and stops " +
        "issuing new ones once set.",
      commonPitfalls: [
        "Treating notify() as atomic/instantaneous, so there's no meaningful window for cancel() to interrupt — this misses the point of the stage; a real fan-out to many devices takes real time and should be interruptible mid-flight.",
        "Cancelling by trying to recall already-sent pushes — not possible with a push provider and not what's being asked; cancellation only affects what hasn't gone out yet.",
      ],
    },
    {
      stage: 3,
      title: "Bounded concurrent delivery",
      constraintAdded: "Fan-out to a large audience must happen concurrently, but never exceed the provider's concurrency ceiling.",
      narrative:
        "Sequential fan-out (stage 1-2) is too slow for a large audience — a campaign to a million devices needs " +
        "concurrent sends. But the push provider enforces a hard concurrency ceiling (e.g. at most 50 in-flight " +
        "requests at once) and will reject or throttle anything over that. This is the make-or-break stage.",
      prompt:
        "Fan out to a large audience using bounded concurrency: many sends in flight at once, but never more than a " +
        "fixed ceiling, and a failed/throwing send must not leak a concurrency slot (permanently reducing throughput). " +
        "State the invariant and argue, with a concrete failure scenario, why a throwing send can't leak a permit.",
      invariant:
        "The number of in-flight sends to the provider never exceeds the configured concurrency ceiling, and a send " +
        "that throws releases its slot exactly like a send that succeeds — no execution path leaks a permit.",
      skeletons: {
        csharp: {
          fileName: "NotificationService.cs",
          code: `public class NotificationService
{
    private readonly SemaphoreSlim _sendSlots;
    // ...stages 1-2...

    public NotificationService(int maxConcurrentSends) =>
        _sendSlots = new SemaphoreSlim(maxConcurrentSends);

    public async Task NotifyManyAsync(IEnumerable<string> tokens, string message, IPushProvider provider)
    {
        // TODO: send concurrently, never exceeding the semaphore's capacity,
        // and never leaking a slot when a send throws.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "notification_service.py",
          code: `import asyncio

class NotificationService:
    def __init__(self, max_concurrent_sends: int):
        self._send_slots = asyncio.Semaphore(max_concurrent_sends)
        # ...stages 1-2...

    async def notify_many(self, tokens: list[str], message: str, provider) -> None:
        # TODO: send concurrently, never exceeding the semaphore's capacity,
        # and never leaking a slot when a send throws.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "NotificationService.kt",
          code: `import kotlinx.coroutines.sync.Semaphore

class NotificationService(maxConcurrentSends: Int) {
    private val sendSlots = Semaphore(maxConcurrentSends)
    // ...stages 1-2...

    suspend fun notifyMany(tokens: List<String>, message: String, provider: PushProvider) {
        // TODO: send concurrently, never exceeding the semaphore's capacity,
        // and never leaking a slot when a send throws.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "bounded-concurrency-primitive", description: "Uses a correct bounding primitive (semaphore or equivalent worker-pool-with-fixed-size) rather than launching unbounded concurrent tasks.", weight: 30 },
        { id: "permit-release-guaranteed", description: "The slot/permit is released in a finally-equivalent path so a throwing send still releases it — not only on the success path.", weight: 40 },
        { id: "invariant", description: "States the never-exceed-ceiling-and-never-leak-a-permit invariant and argues, with a concrete 'send throws' scenario, why the release is guaranteed regardless of outcome.", weight: 30 },
      ],
      canonicalApproach:
        "Acquire a semaphore slot before each send and release it in a finally block (or the language's equivalent " +
        "structured resource-cleanup — `using`/`try-finally`/`try-finally` in Kotlin) wrapping the send call, so an " +
        "exception thrown by the provider still triggers the release. Launch all sends as concurrent tasks that each " +
        "acquire-send-release independently, relying on the semaphore itself (not manual counting) to cap how many " +
        "run at once.",
      commonPitfalls: [
        "Acquiring the slot, calling send(), then releasing — with no exception handling, a throwing send skips the release line entirely and permanently reduces available concurrency by one for every failure.",
        "Batching into fixed-size groups and awaiting each batch fully before starting the next — bounds concurrency correctly but wastes capacity: one slow send in a batch blocks the next batch from starting even though other slots are free. A semaphore-per-send lets a finished slot immediately pick up the next item regardless of what else in its 'batch' is still running.",
      ],
    },
    {
      stage: 4,
      title: "Retry, invalid token, and expiry",
      constraintAdded: "Sends can fail for different reasons that need different responses: transient, invalid token, expired token.",
      narrative:
        "Not every provider failure is the same. A transient error (timeout, 5xx) should be retried. An invalid-token " +
        "error means the device unregistered the app — that token should be removed so future notifications don't " +
        "waste a send on it. An expired-token error means the client needs to re-register — similarly remove it, but " +
        "the distinction from 'invalid' might matter for logging/metrics even if the immediate action is the same.",
      prompt:
        "Extend send handling to branch on failure type: transient failures get retried (bounded, with backoff — " +
        "reuse the same idea as a job queue's retry logic); invalid-token and expired-token failures remove that " +
        "token from the user's device registry so it's never sent to again. Make sure a token removed mid-fan-out " +
        "doesn't corrupt the bounded-concurrency bookkeeping from stage 3.",
      skeletons: {
        csharp: {
          fileName: "NotificationService.cs",
          code: `public enum SendFailureKind { Transient, InvalidToken, TokenExpired }
public class SendException : Exception
{
    public SendFailureKind Kind { get; }
    public SendException(SendFailureKind kind) => Kind = kind;
}

public class NotificationService
{
    // ...stages 1-3...

    private async Task SendOneAsync(string userId, string token, string message, IPushProvider provider)
    {
        // TODO: branch on SendException.Kind — retry transient (bounded),
        // deregister the token on InvalidToken/TokenExpired.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "notification_service.py",
          code: `from enum import Enum, auto

class SendFailureKind(Enum):
    TRANSIENT = auto()
    INVALID_TOKEN = auto()
    TOKEN_EXPIRED = auto()

class SendError(Exception):
    def __init__(self, kind: SendFailureKind):
        self.kind = kind

class NotificationService:
    # ...stages 1-3...

    async def _send_one(self, user_id: str, token: str, message: str, provider) -> None:
        # TODO: branch on SendError.kind — retry transient (bounded),
        # deregister the token on INVALID_TOKEN/TOKEN_EXPIRED.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "NotificationService.kt",
          code: `enum class SendFailureKind { TRANSIENT, INVALID_TOKEN, TOKEN_EXPIRED }
class SendException(val kind: SendFailureKind) : Exception()

class NotificationService {
    // ...stages 1-3...

    private suspend fun sendOne(userId: String, token: String, message: String, provider: PushProvider) {
        // TODO: branch on SendException.kind — retry transient (bounded),
        // deregister the token on INVALID_TOKEN/TOKEN_EXPIRED.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "failure-branching", description: "Distinguishes failure kinds and handles each differently, rather than one generic catch-and-log.", weight: 30 },
        { id: "bounded-retry-transient", description: "Transient failures are retried with a bound (count and/or backoff), not retried forever or not at all.", weight: 30 },
        { id: "token-deregistration", description: "InvalidToken/TokenExpired failures remove that token from the device registry so future notify() calls don't target it.", weight: 25 },
        { id: "concurrency-bookkeeping-intact", description: "Deregistering a token mid-fan-out doesn't corrupt the stage-3 semaphore accounting (e.g. removing from the registry is independent of releasing the in-flight send's permit — the two aren't conflated).", weight: 15 },
      ],
      canonicalApproach:
        "Catch the provider's typed failure, switch on its kind: Transient re-enqueues the send with an attempt " +
        "count and backoff (bounded, same shape as a job queue's retry logic); InvalidToken/TokenExpired remove the " +
        "token from that user's device set and stop, without retrying — resending to a token the provider has " +
        "rejected as invalid is guaranteed to fail again. All of this happens inside the same acquire-send-release " +
        "structure from stage 3, so the semaphore slot is released exactly once per send attempt regardless of which " +
        "branch runs — token deregistration is a separate, independent side effect from permit release, not a " +
        "replacement for it.",
      commonPitfalls: [
        "Retrying InvalidToken failures the same as transient ones — wastes retry budget on something that will never succeed and delays noticing the token needs to be dropped.",
        "Removing the token from the registry as part of the same operation that releases the semaphore permit, coupling two independent concerns — makes it easy to accidentally skip one when refactoring either.",
      ],
    },
  ],
};
