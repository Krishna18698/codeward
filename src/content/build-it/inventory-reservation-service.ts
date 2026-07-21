import type { BuildItProblem } from "./types";

export const inventoryReservationService: BuildItProblem = {
  slug: "inventory-reservation-service",
  title: "Inventory Reservation Service",
  category: "concurrency",
  brief:
    "An inventory reservation service that evolves across four stages: stock + reservations, confirm/cancel with " +
    "idempotent states, no overselling under contention, time-based expiry.",
  totalMinutes: 100,
  stages: [
    {
      stage: 1,
      title: "Stock and reservations",
      constraintAdded: "None yet — this is the baseline.",
      narrative:
        "A product has a fixed stock count. Reserving units for checkout should reduce what's available to other " +
        "buyers without yet deciding the sale is final — that's confirm, which comes in stage 2.",
      prompt:
        "Design an InventoryItem with a fixed stock and a reserve(quantity) operation that reduces available stock, " +
        "rejecting the request if there isn't enough available. Track available separately from the original stock " +
        "count — you'll need both later.",
      skeletons: {
        csharp: {
          fileName: "InventoryItem.cs",
          code: `public class InventoryItem
{
    public int Stock { get; }
    private int _reserved;

    public InventoryItem(int stock) => Stock = stock;

    public int Available => Stock - _reserved;

    public bool Reserve(int quantity)
    {
        // TODO: reject if quantity > Available
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "inventory_item.py",
          code: `class InventoryItem:
    def __init__(self, stock: int):
        self.stock = stock
        self._reserved = 0

    @property
    def available(self) -> int:
        return self.stock - self._reserved

    def reserve(self, quantity: int) -> bool:
        # TODO: reject if quantity > available
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "InventoryItem.kt",
          code: `class InventoryItem(val stock: Int) {
    private var reserved: Int = 0

    val available: Int
        get() = stock - reserved

    fun reserve(quantity: Int): Boolean {
        // TODO: reject if quantity > available
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "separate-counters", description: "Stock (fixed) and reserved (mutable) are tracked separately, with available derived.", weight: 40 },
        { id: "reserve-guard", description: "reserve() rejects a quantity greater than what's currently available.", weight: 40 },
        { id: "no-mutation-on-reject", description: "A rejected reservation doesn't mutate the reserved count.", weight: 20 },
      ],
      canonicalApproach:
        "Model stock as immutable and reserved as the only mutable counter, with available computed as stock minus " +
        "reserved. reserve() checks the guard before incrementing reserved, and only increments on success.",
      commonPitfalls: [
        "Mutating stock directly on reservation instead of tracking a separate reserved counter — loses the distinction stage 2 needs between 'reserved' and 'sold'.",
      ],
      tests: {
        python: `# --- tests (read-only) ---
def _run():
    item = InventoryItem(10)
    assert item.available == 10, "starts with full stock available"
    assert item.reserve(4) is True, "reserving 4 of 10 succeeds"
    assert item.available == 6, "available reduced to 6 after reserving 4"
    assert item.reserve(100) is False, "reserving more than available is rejected"
    assert item.available == 6, "rejected reservation doesn't change available"
    print("__BUILD_IT_PASS__")

_run()`,
        kotlin: `// --- tests (read-only) ---
fun main() {
    val item = InventoryItem(10)
    check(item.available == 10) { "starts with full stock available" }
    check(item.reserve(4)) { "reserving 4 of 10 succeeds" }
    check(item.available == 6) { "available reduced to 6 after reserving 4" }
    check(!item.reserve(100)) { "reserving more than available is rejected" }
    check(item.available == 6) { "rejected reservation doesn't change available" }
    println("__BUILD_IT_PASS__")
}`,
        csharp: `// --- tests (read-only) ---
class TestRunner
{
    static void Check(bool cond, string msg) { if (!cond) throw new Exception("FAILED: " + msg); }
    static void Main()
    {
        var item = new InventoryItem(10);
        Check(item.Available == 10, "starts with full stock available");
        Check(item.Reserve(4) == true, "reserving 4 of 10 succeeds");
        Check(item.Available == 6, "available reduced to 6 after reserving 4");
        Check(item.Reserve(100) == false, "reserving more than available is rejected");
        Check(item.Available == 6, "rejected reservation doesn't change available");
        Console.WriteLine("__BUILD_IT_PASS__");
    }
}`,
      },
    },
    {
      stage: 2,
      title: "Confirm, cancel, and idempotent states",
      constraintAdded: "A reservation must move through explicit states: reserved → confirmed or reserved → cancelled.",
      narrative:
        "Reserving isn't the sale — checkout can still fail (payment declines, user abandons cart). Product wants " +
        "confirm() to finalize a reservation into a sale, and cancel() to release it back to available stock. Network " +
        "retries mean confirm/cancel can be called more than once for the same reservation — calling confirm() twice " +
        "must not double-sell the same units.",
      prompt:
        "Give each reservation an explicit state (reserved, confirmed, cancelled) and add confirm(reservationId) / " +
        "cancel(reservationId). Both must be idempotent: calling confirm on an already-confirmed reservation is a " +
        "no-op that returns success, not a double-sale; calling cancel on an already-cancelled reservation is " +
        "likewise a no-op. Confirming a cancelled reservation (or vice versa) should fail.",
      skeletons: {
        csharp: {
          fileName: "InventoryItem.cs",
          code: `public enum ReservationState { Reserved, Confirmed, Cancelled }

public class InventoryItem
{
    // ...stock/available from stage 1...
    private readonly Dictionary<Guid, ReservationState> _reservations = new();
    private int _sold;

    public Guid Reserve(int quantity) => throw new NotImplementedException(); // now returns an id

    public bool Confirm(Guid reservationId)
    {
        // TODO: idempotent — confirming twice is a no-op success, not a double-sale.
        throw new NotImplementedException();
    }

    public bool Cancel(Guid reservationId)
    {
        // TODO: idempotent — cancelling twice is a no-op success.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "inventory_item.py",
          code: `from enum import Enum, auto
import uuid

class ReservationState(Enum):
    RESERVED = auto()
    CONFIRMED = auto()
    CANCELLED = auto()

class InventoryItem:
    # ...stock/available from stage 1...

    def reserve(self, quantity: int) -> uuid.UUID:
        raise NotImplementedError  # now returns an id

    def confirm(self, reservation_id: uuid.UUID) -> bool:
        # TODO: idempotent — confirming twice is a no-op success, not a double-sale.
        raise NotImplementedError

    def cancel(self, reservation_id: uuid.UUID) -> bool:
        # TODO: idempotent — cancelling twice is a no-op success.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "InventoryItem.kt",
          code: `enum class ReservationState { RESERVED, CONFIRMED, CANCELLED }

class InventoryItem(val stock: Int) {
    // ...available from stage 1...
    private val reservations = mutableMapOf<UUID, ReservationState>()

    fun reserve(quantity: Int): UUID {
        TODO() // now returns an id
    }

    fun confirm(reservationId: UUID): Boolean {
        // TODO: idempotent — confirming twice is a no-op success, not a double-sale.
        TODO()
    }

    fun cancel(reservationId: UUID): Boolean {
        // TODO: idempotent — cancelling twice is a no-op success.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "explicit-state", description: "Each reservation carries an explicit state (reserved/confirmed/cancelled), not just presence/absence in a map.", weight: 25 },
        { id: "confirm-idempotent", description: "Calling confirm on an already-confirmed reservation is a no-op success, not a second sale.", weight: 30 },
        { id: "cancel-idempotent", description: "Calling cancel on an already-cancelled reservation is a no-op success.", weight: 20 },
        { id: "invalid-transition", description: "Confirming a cancelled reservation (or cancelling a confirmed one) is rejected as an invalid transition.", weight: 25 },
      ],
      canonicalApproach:
        "A state machine per reservation: RESERVED is the only state confirm/cancel can transition out of. confirm() " +
        "on an already-CONFIRMED reservation checks current state first and returns success without re-incrementing " +
        "sold. confirm() on a CANCELLED reservation returns failure. The state transition and any counter update " +
        "(reserved → sold) happen together, not as separate steps.",
      commonPitfalls: [
        "Using reservation presence in a map as the only signal, so a second confirm() call re-runs the full confirm logic (including incrementing a sold counter) instead of short-circuiting on already-confirmed state.",
        "Allowing confirm() to succeed on a cancelled reservation because the code only checks 'does this id exist' rather than 'is this id still in the RESERVED state'.",
      ],
    },
    {
      stage: 3,
      title: "No overselling under contention",
      constraintAdded: "Many concurrent reserve() calls race for the same limited stock.",
      narrative:
        "A flash sale drops 100 units at once and thousands of buyers hit reserve() in the same second. The stage-1 " +
        "guard (\"reject if quantity > available\") is a check-then-act race if reserve() isn't atomic: two threads can " +
        "both read available as sufficient, both pass the guard, and both decrement — overselling. This is the " +
        "make-or-break stage.",
      prompt:
        "Make reserve() safe under high concurrent contention for the same item: a flash sale of exactly 100 units " +
        "must never result in more than 100 successful reservations, no matter how many buyers race for the last few " +
        "units. State the invariant you're protecting and argue, with a concrete concurrent interleaving, why your " +
        "design holds it.",
      invariant:
        "available + reserved + sold always equals the original stock count, after every transition and under any " +
        "number of concurrent requests — equivalently, the total of successful reservations plus confirmed sales can " +
        "never exceed stock.",
      skeletons: {
        csharp: {
          fileName: "InventoryItem.cs",
          code: `public class InventoryItem
{
    private readonly object _lock = new();
    // ...stock/reservations/sold from stages 1-2...

    public Guid? Reserve(int quantity)
    {
        // TODO: make the check-and-decrement atomic under concurrent callers.
        // A flash sale of exactly "Stock" units must never oversell.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "inventory_item.py",
          code: `import threading

class InventoryItem:
    def __init__(self, stock: int):
        self._lock = threading.Lock()
        # ...stock/reservations/sold from stages 1-2...

    def reserve(self, quantity: int) -> "uuid.UUID | None":
        # TODO: make the check-and-decrement atomic under concurrent callers.
        # A flash sale of exactly "stock" units must never oversell.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "InventoryItem.kt",
          code: `import java.util.concurrent.locks.ReentrantLock

class InventoryItem(val stock: Int) {
    private val lock = ReentrantLock()
    // ...reservations/sold from stages 1-2...

    fun reserve(quantity: Int): UUID? {
        // TODO: make the check-and-decrement atomic under concurrent callers.
        // A flash sale of exactly "stock" units must never oversell.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "atomic-check-and-decrement", description: "The available-quantity check and the reservation decrement happen as one atomic unit — no window where two threads can both pass the check.", weight: 40 },
        { id: "correct-primitive", description: "Uses a correct concurrency primitive for the scale implied (a lock is fine for a single process; the candidate should at least name what changes for a distributed/multi-instance deployment, e.g. a DB-level atomic decrement or a distributed lock).", weight: 25 },
        { id: "invariant", description: "States the available + reserved + sold invariant explicitly and argues, with a concrete race scenario (e.g. two threads both reading available=1 for the last unit), why it can't be violated.", weight: 35 },
      ],
      canonicalApproach:
        "Guard the check-then-decrement with a lock scoped to the item (or, in a real distributed system, an atomic " +
        "conditional update at the data layer — e.g. `UPDATE items SET reserved = reserved + :q WHERE stock - reserved " +
        ">= :q`, which the database executes atomically without an application-level lock at all). The key property " +
        "either way: the read of current availability and the decision to decrement must be indivisible from any " +
        "other thread's perspective.",
      commonPitfalls: [
        "Checking available, then — outside any lock — decrementing reserved. Two threads for the last unit both see available=1, both pass, reserved ends up incremented twice: overselling by exactly the race window's width.",
        "Locking around the decrement but not around the check that precedes it, which doesn't actually close the race.",
        "A single global lock across all inventory items when only per-item exclusivity is needed — correct, but needlessly serializes unrelated items; worth naming as a scalability tradeoff even if not required to fix.",
      ],
    },
    {
      stage: 4,
      title: "Time-based expiry",
      constraintAdded: "Reservations that aren't confirmed within a TTL automatically return to available stock.",
      narrative:
        "Buyers who reserve but abandon checkout shouldn't lock up inventory forever. Reservations now carry an " +
        "expiry — after the TTL, an un-confirmed reservation should stop counting against available stock, without " +
        "requiring a client to explicitly cancel it.",
      prompt:
        "Add an expiry to each reservation. A RESERVED reservation whose TTL has passed should behave as if cancelled " +
        "— it must not block a subsequent reserve() for those units, and confirm() on an expired reservation must " +
        "fail. Decide whether expiry is enforced actively (a background sweep) or lazily (checked at the moment " +
        "confirm/cancel/reserve touches that reservation) and justify the tradeoff — and make sure your answer still " +
        "holds the stage-3 invariant under concurrent expiry + reservation.",
      skeletons: {
        csharp: {
          fileName: "InventoryItem.cs",
          code: `public class InventoryItem
{
    // ...stages 1-3...

    public Guid? Reserve(int quantity, TimeSpan ttl)
    {
        // TODO: attach an expiry; expired RESERVED reservations must free their units.
        throw new NotImplementedException();
    }

    public bool Confirm(Guid reservationId)
    {
        // TODO: fail if the reservation has expired.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "inventory_item.py",
          code: `import time

class InventoryItem:
    # ...stages 1-3...

    def reserve(self, quantity: int, ttl_seconds: float):
        # TODO: attach an expiry; expired RESERVED reservations must free their units.
        raise NotImplementedError

    def confirm(self, reservation_id) -> bool:
        # TODO: fail if the reservation has expired.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "InventoryItem.kt",
          code: `import java.time.Duration
import java.time.Instant

class InventoryItem(val stock: Int) {
    // ...stages 1-3...

    fun reserve(quantity: Int, ttl: Duration): UUID? {
        // TODO: attach an expiry; expired RESERVED reservations must free their units.
        TODO()
    }

    fun confirm(reservationId: UUID): Boolean {
        // TODO: fail if the reservation has expired.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "expiry-tracked", description: "Each reservation carries an expiry timestamp, not a fire-and-forget timer.", weight: 20 },
        { id: "expired-frees-stock", description: "An expired RESERVED reservation is treated as freed — its units are available to a subsequent reserve() — either via active sweep or lazy check.", weight: 30 },
        { id: "confirm-rejects-expired", description: "confirm() on an expired reservation fails rather than completing the sale.", weight: 25 },
        { id: "tradeoff-named", description: "The candidate names the active-sweep vs. lazy-check tradeoff (sweep costs a background process; lazy check risks stale available() reads between touches) and picks one deliberately.", weight: 25 },
      ],
      canonicalApproach:
        "Lazy expiry checked at every read/mutation touching a reservation (confirm, cancel, and the available() " +
        "computation itself treat an expired RESERVED entry as if it were CANCELLED) is simpler to reason about under " +
        "the stage-3 locking than a background sweep, which introduces its own concurrent-mutation-during-sweep race. " +
        "A production system often wants both — lazy correctness as the guarantee, plus an active sweep purely to " +
        "reclaim map memory — but the correctness argument should rest on the lazy check alone.",
      commonPitfalls: [
        "A background timer per reservation (e.g. a scheduled task) that mutates shared state without going through the same lock stage 3 established — reintroduces the overselling race from a different angle.",
        "Treating expiry as a one-time event instead of a continuously-checked condition, so a reservation that expires while no sweep has run yet still blocks available stock.",
      ],
    },
  ],
};
