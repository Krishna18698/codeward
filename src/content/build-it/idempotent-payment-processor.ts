import type { BuildItProblem } from "./types";

export const idempotentPaymentProcessor: BuildItProblem = {
  slug: "idempotent-payment-processor",
  title: "Idempotent Payment Processor",
  category: "payments",
  brief:
    "An idempotent payment processor that evolves across four stages: payment state machine, response replay on " +
    "retry, safe under concurrent duplicates, transactional outbox.",
  totalMinutes: 100,
  stages: [
    {
      stage: 1,
      title: "Payment state machine",
      constraintAdded: "None yet — this is the baseline.",
      narrative:
        "A charge request calls out to a payment gateway and records the result. Product wants a clear state per " +
        "payment — pending while in flight, then succeeded or failed — rather than just a boolean.",
      prompt:
        "Design a PaymentProcessor with charge(amount) that creates a payment record in Pending state, calls the " +
        "gateway, and transitions to Succeeded or Failed based on the result. Define the state machine explicitly.",
      skeletons: {
        csharp: {
          fileName: "PaymentProcessor.cs",
          code: `public enum PaymentState { Pending, Succeeded, Failed }

public class PaymentProcessor
{
    public Payment Charge(decimal amount, IGateway gateway)
    {
        // TODO: create Pending, call gateway, transition to Succeeded/Failed
        throw new NotImplementedException();
    }
}

public class Payment
{
    public Guid Id { get; }
    public decimal Amount { get; }
    public PaymentState State { get; }
    public Payment(Guid id, decimal amount, PaymentState state) { Id = id; Amount = amount; State = state; }
}
public interface IGateway { GatewayResult Charge(decimal amount); }
public class GatewayResult
{
    public bool Success { get; }
    public string TransactionId { get; }
    public GatewayResult(bool success, string transactionId) { Success = success; TransactionId = transactionId; }
}`,
        },
        python: {
          fileName: "payment_processor.py",
          code: `from dataclasses import dataclass
from enum import Enum, auto
from typing import Protocol

class PaymentState(Enum):
    PENDING = auto()
    SUCCEEDED = auto()
    FAILED = auto()

@dataclass
class Payment:
    id: str
    amount: float
    state: PaymentState

class Gateway(Protocol):
    def charge(self, amount: float) -> "GatewayResult": ...

@dataclass
class GatewayResult:
    success: bool
    transaction_id: str

class PaymentProcessor:
    def charge(self, amount: float, gateway: Gateway) -> Payment:
        # TODO: create PENDING, call gateway, transition to SUCCEEDED/FAILED
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "PaymentProcessor.kt",
          code: `import java.util.UUID

enum class PaymentState { PENDING, SUCCEEDED, FAILED }

data class Payment(val id: UUID, val amount: Double, val state: PaymentState)
data class GatewayResult(val success: Boolean, val transactionId: String)
fun interface Gateway { fun charge(amount: Double): GatewayResult }

class PaymentProcessor {
    fun charge(amount: Double, gateway: Gateway): Payment {
        // TODO: create PENDING, call gateway, transition to SUCCEEDED/FAILED
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "pending-first", description: "A payment is recorded as Pending before the gateway call, not only after it returns.", weight: 30 },
        { id: "explicit-transition", description: "The transition to Succeeded/Failed is explicit and based on the gateway result, not assumed.", weight: 40 },
        { id: "record-persisted", description: "The payment record (not just the gateway's own response) is what the caller gets back / can query later.", weight: 30 },
      ],
      canonicalApproach:
        "Persist a Pending payment record before calling the gateway (so there's a durable record even if the process " +
        "crashes mid-call), call the gateway, then update the record's state based on the result. This ordering — " +
        "record first, then call — is what stage 2's replay and stage 3's concurrency safety both build on.",
      commonPitfalls: [
        "Calling the gateway first and only creating a record afterward — if the process crashes after the gateway " +
        "call succeeds but before the record is written, there's no evidence the charge happened, and a naive retry " +
        "double-charges.",
      ],
      tests: {
        python: `# --- tests (read-only) ---
def _run():
    class OkGateway:
        def charge(self, amount):
            return GatewayResult(True, "txn-1")
    class FailGateway:
        def charge(self, amount):
            return GatewayResult(False, "")
    p = PaymentProcessor()
    ok = p.charge(100.0, OkGateway())
    assert ok.state == PaymentState.SUCCEEDED, "successful gateway → SUCCEEDED"
    assert ok.amount == 100.0, "amount recorded on the payment"
    bad = p.charge(50.0, FailGateway())
    assert bad.state == PaymentState.FAILED, "failed gateway → FAILED"
    print("__BUILD_IT_PASS__")

_run()`,
        kotlin: `// --- tests (read-only) ---
fun main() {
    val ok = PaymentProcessor().charge(100.0, Gateway { GatewayResult(true, "txn-1") })
    check(ok.state == PaymentState.SUCCEEDED) { "successful gateway → SUCCEEDED" }
    check(ok.amount == 100.0) { "amount recorded on the payment" }
    val bad = PaymentProcessor().charge(50.0, Gateway { GatewayResult(false, "") })
    check(bad.state == PaymentState.FAILED) { "failed gateway → FAILED" }
    println("__BUILD_IT_PASS__")
}`,
        csharp: `// --- tests (read-only) ---
class OkGateway : IGateway { public GatewayResult Charge(decimal amount) => new GatewayResult(true, "txn-1"); }
class FailGateway : IGateway { public GatewayResult Charge(decimal amount) => new GatewayResult(false, ""); }

class TestRunner
{
    static void Check(bool cond, string msg) { if (!cond) throw new Exception("FAILED: " + msg); }
    static void Main()
    {
        var ok = new PaymentProcessor().Charge(100m, new OkGateway());
        Check(ok.State == PaymentState.Succeeded, "successful gateway → Succeeded");
        Check(ok.Amount == 100m, "amount recorded on the payment");
        var bad = new PaymentProcessor().Charge(50m, new FailGateway());
        Check(bad.State == PaymentState.Failed, "failed gateway → Failed");
        Console.WriteLine("__BUILD_IT_PASS__");
    }
}`,
      },
    },
    {
      stage: 2,
      title: "Response replay on retry",
      constraintAdded: "The same logical request (idempotency key) may arrive more than once; a retry must get back the original result, not a new charge.",
      narrative:
        "Clients retry on timeout — the first charge may have actually succeeded even though the response never made " +
        "it back. Product wants an idempotency key per logical request: the same key seen again should return the " +
        "original payment's result instead of charging again.",
      prompt:
        "Add an idempotency key to charge(key, amount). If a payment already exists for that key, return its " +
        "existing result (whatever state it's in) instead of calling the gateway again. Only a genuinely new key " +
        "triggers a new gateway call.",
      skeletons: {
        csharp: {
          fileName: "PaymentProcessor.cs",
          code: `public class PaymentProcessor
{
    private readonly Dictionary<string, Payment> _byKey = new();

    public Payment Charge(string idempotencyKey, decimal amount, IGateway gateway)
    {
        // TODO: return the existing payment if this key has been seen before;
        // otherwise create + charge as in stage 1.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "payment_processor.py",
          code: `class PaymentProcessor:
    def __init__(self):
        self._by_key: dict[str, Payment] = {}

    def charge(self, idempotency_key: str, amount: float, gateway: Gateway) -> Payment:
        # TODO: return the existing payment if this key has been seen before;
        # otherwise create + charge as in stage 1.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "PaymentProcessor.kt",
          code: `class PaymentProcessor {
    private val byKey = mutableMapOf<String, Payment>()

    fun charge(idempotencyKey: String, amount: Double, gateway: Gateway): Payment {
        // TODO: return the existing payment if this key has been seen before;
        // otherwise create + charge as in stage 1.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "key-lookup-first", description: "charge() checks for an existing payment under the key before doing anything else.", weight: 35 },
        { id: "replay-not-recharge", description: "A known key returns the stored result without invoking the gateway again.", weight: 40 },
        { id: "new-key-unaffected", description: "A genuinely new key still goes through the full stage-1 flow.", weight: 25 },
      ],
      canonicalApproach:
        "Key the payment store by idempotency key (not just an internally generated id). charge() looks up the key " +
        "first; if found, return the stored Payment as-is (whatever state, including Pending — the caller can poll); " +
        "if not found, proceed with the stage-1 flow and store the result under that key before returning.",
      commonPitfalls: [
        "Keying storage only by an internally generated payment id and treating idempotencyKey as metadata — makes lookup-by-key impossible and defeats the point.",
        "Only replaying Succeeded payments and re-charging for Pending/Failed ones — a request that's still genuinely in flight (Pending) shouldn't trigger a second concurrent gateway call either; that's exactly stage 3's problem.",
      ],
    },
    {
      stage: 3,
      title: "Safe under concurrent duplicates",
      constraintAdded: "The same idempotency key can arrive many times concurrently, not just as a sequential retry.",
      narrative:
        "A client's retry logic (or a flaky proxy) can fire the same logical request multiple times within " +
        "milliseconds — genuinely concurrently, not one after another. Stage 2's \"check the map, then charge\" is a " +
        "check-then-act race: N concurrent requests for the same new key can all miss the lookup and all call the " +
        "gateway. This is the make-or-break stage.",
      prompt:
        "Make charge() safe when up to 100 concurrent requests arrive for the exact same idempotency key at the same " +
        "instant. Exactly one of them may call the gateway; the rest must wait for (or be redirected to) that one " +
        "call's result. State the invariant and argue, with a concrete concurrent scenario, why your design holds it.",
      invariant:
        "For any single idempotency key, the payment gateway is invoked at most once, regardless of how many " +
        "concurrent charge() calls arrive for that key at the same instant.",
      skeletons: {
        csharp: {
          fileName: "PaymentProcessor.cs",
          code: `public class PaymentProcessor
{
    private readonly object _lock = new();
    // ...stage 2's keyed store...

    public Payment Charge(string idempotencyKey, decimal amount, IGateway gateway)
    {
        // TODO: exactly one concurrent caller per key may reach the gateway;
        // the rest wait for / receive that call's result.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "payment_processor.py",
          code: `import threading

class PaymentProcessor:
    def __init__(self):
        self._lock = threading.Lock()
        # ...stage 2's keyed store, plus per-key locks or in-flight futures...

    def charge(self, idempotency_key: str, amount: float, gateway: Gateway) -> Payment:
        # TODO: exactly one concurrent caller per key may reach the gateway;
        # the rest wait for / receive that call's result.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "PaymentProcessor.kt",
          code: `import java.util.concurrent.ConcurrentHashMap

class PaymentProcessor {
    // ...stage 2's keyed store, plus a way to coordinate concurrent callers per key...
    private val inFlight = ConcurrentHashMap<String, Any>()

    fun charge(idempotencyKey: String, amount: Double, gateway: Gateway): Payment {
        // TODO: exactly one concurrent caller per key may reach the gateway;
        // the rest wait for / receive that call's result.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "single-winner", description: "Exactly one concurrent caller per key reaches the gateway; a clear mechanism decides the winner atomically (not a check-then-act on a plain map).", weight: 35 },
        { id: "losers-wait-or-return", description: "Non-winning concurrent callers either block until the winner's result is available, or are correctly redirected to it — they don't independently call the gateway.", weight: 35 },
        { id: "invariant", description: "States the at-most-once-per-key gateway invocation invariant and argues, with a concrete N-concurrent-callers scenario, why the chosen primitive prevents more than one from winning.", weight: 30 },
      ],
      canonicalApproach:
        "Use an atomic insert-if-absent on the keyed store (a ConcurrentDictionary's GetOrAdd/TryAdd in C#, a lock " +
        "around a dict in Python, or a ConcurrentHashMap's computeIfAbsent in Kotlin) to atomically claim the key with " +
        "a Pending placeholder — only the caller whose insert actually wins proceeds to the gateway; every other " +
        "concurrent caller's insert fails (key already present) and they instead wait on that placeholder (a shared " +
        "future/task/deferred) for the winner's eventual result. At the database layer, the equivalent is a unique " +
        "constraint on the idempotency key column and catching the constraint violation on a losing insert.",
      commonPitfalls: [
        "A per-key check-then-insert with no atomicity ('if key not in dict: dict[key] = ...') — under N concurrent callers this is exactly the race that lets all N reach the gateway.",
        "A single global lock around the entire charge() method — correct, but serializes unrelated keys too, which the candidate should at least flag as a throughput cost worth avoiding with a per-key primitive instead.",
        "Locking around the store write but not around the gateway call itself, while still holding the lock during the (possibly slow) gateway call for ALL keys — blocks unrelated payments for no reason; the lock/atomicity should be scoped per-key, not global.",
      ],
    },
    {
      stage: 4,
      title: "Transactional outbox",
      constraintAdded: "A successful charge must also emit an event (e.g. 'payment.succeeded') exactly once, consistently with the DB state.",
      narrative:
        "Other services need to react to a successful payment — but writing the payment's new state to the database " +
        "and publishing an event to a message broker are two separate operations. If the process crashes between " +
        "them, either the DB says succeeded with no event ever published, or (with a naive publish-then-write order) " +
        "an event goes out for a payment that a crash left un-persisted.",
      prompt:
        "Describe (and sketch the interfaces for) a transactional outbox: the payment state change and the intent to " +
        "publish an event are written together, atomically, in the same local transaction; a separate relay process " +
        "reads unpublished outbox rows and actually sends them to the broker, marking them sent only after " +
        "confirmed delivery. Explain why this guarantees the event is eventually published at least once for every " +
        "state change that was actually committed — and how the event consumer should handle at-least-once delivery.",
      skeletons: {
        csharp: {
          fileName: "PaymentProcessor.cs",
          code: `public interface IOutboxStore
{
    // Written in the SAME local transaction as the payment state change.
    void SaveWithOutboxEvent(Payment payment, OutboxEvent evt);
}

public record OutboxEvent(Guid Id, string Type, string PayloadJson, bool Published);

public class OutboxRelay
{
    public void RelayPendingEvents(IOutboxStore store, IEventBus bus)
    {
        // TODO: read unpublished outbox rows, publish, mark sent —
        // must be safe to run this loop more than once for the same row.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "payment_processor.py",
          code: `class OutboxStore(Protocol):
    def save_with_outbox_event(self, payment: Payment, event: "OutboxEvent") -> None:
        """Written in the SAME local transaction as the payment state change."""
        ...

@dataclass
class OutboxEvent:
    id: str
    type: str
    payload_json: str
    published: bool

class OutboxRelay:
    def relay_pending_events(self, store: OutboxStore, bus) -> None:
        # TODO: read unpublished outbox rows, publish, mark sent —
        # must be safe to run this loop more than once for the same row.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "PaymentProcessor.kt",
          code: `interface OutboxStore {
    // Written in the SAME local transaction as the payment state change.
    fun saveWithOutboxEvent(payment: Payment, event: OutboxEvent)
}

data class OutboxEvent(val id: UUID, val type: String, val payloadJson: String, val published: Boolean)

class OutboxRelay {
    fun relayPendingEvents(store: OutboxStore, bus: EventBus) {
        // TODO: read unpublished outbox rows, publish, mark sent —
        // must be safe to run this loop more than once for the same row.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "same-transaction-write", description: "The payment state change and the outbox event row are written in the same local transaction — not two separate writes to two separate systems.", weight: 35 },
        { id: "relay-decoupled", description: "A separate relay process/loop is responsible for actually publishing outbox rows to the broker, decoupled from the request path.", weight: 20 },
        { id: "at-least-once-argued", description: "Explains why this guarantees at-least-once delivery of the event for every committed state change (a crash before commit means neither the state change nor the event happened; a crash after commit but before relay just delays the event, which the relay will eventually send).", weight: 25 },
        { id: "consumer-idempotency", description: "Notes that since the guarantee is at-least-once (a relay can publish, then crash before marking sent, then publish again), the event consumer must itself handle duplicate delivery — e.g. its own idempotency key on the event id.", weight: 20 },
      ],
      canonicalApproach:
        "The charge() path, on success, writes the payment's new state AND an outbox row (event type + payload + " +
        "published=false) in one local database transaction — so either both happen or neither does, no separate " +
        "distributed transaction needed. A relay (polling loop or CDC/log-tailing process) reads published=false rows, " +
        "publishes to the broker, and marks published=true only after the broker confirms — if the relay crashes " +
        "after publishing but before marking sent, the next relay pass re-reads the row and re-publishes, which is " +
        "why the consumer side must be idempotent on the event's own id, not just on the payment's idempotency key.",
      commonPitfalls: [
        "Publishing the event directly inside charge() right after the DB write, as two separate operations with no outbox — a crash between them either loses the event or (if publish comes first) publishes for a payment that never actually committed.",
        "Marking the outbox row published=true before the broker confirms delivery — a crash in that window loses the event silently, which is worse than the at-least-once duplicate the correct ordering risks instead.",
        "Assuming the outbox guarantees exactly-once instead of at-least-once, and therefore skipping idempotency on the consumer side.",
      ],
    },
  ],
};
