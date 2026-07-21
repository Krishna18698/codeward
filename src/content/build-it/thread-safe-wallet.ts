import type { BuildItProblem } from "./types";

export const threadSafeWallet: BuildItProblem = {
  slug: "thread-safe-wallet",
  title: "Thread-Safe Wallet",
  category: "concurrency",
  brief:
    "An in-memory wallet that evolves across four stages: basic ops, atomic transfer, thread-safe " +
    "under contention, multi-currency. Each stage adds one constraint that the naive previous version violates.",
  totalMinutes: 90,
  stages: [
    {
      stage: 1,
      title: "Basic operations",
      constraintAdded: "None yet — this is the baseline.",
      narrative:
        "Product wants a Wallet with deposit and withdraw. Single caller, single thread, no other " +
        "requirements yet. This stage exists so stage 2 has something concrete to break.",
      prompt:
        "Design a Wallet with deposit(amount) and withdraw(amount). withdraw must reject an amount " +
        "greater than the current balance. Define the class/interface shape you'd actually ship.",
      skeletons: {
        csharp: {
          fileName: "Wallet.cs",
          code: `public class Wallet
{
    private decimal _balance;

    public Wallet(decimal openingBalance) => _balance = openingBalance;

    public decimal Balance => _balance;

    public void Deposit(decimal amount)
    {
        // TODO
    }

    public bool Withdraw(decimal amount)
    {
        // TODO: reject if amount > balance
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "wallet.py",
          code: `class Wallet:
    def __init__(self, opening_balance: float):
        self._balance = opening_balance

    @property
    def balance(self) -> float:
        return self._balance

    def deposit(self, amount: float) -> None:
        # TODO
        raise NotImplementedError

    def withdraw(self, amount: float) -> bool:
        # TODO: reject if amount > balance
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "Wallet.kt",
          code: `class Wallet(openingBalance: Double) {
    var balance: Double = openingBalance
        private set

    fun deposit(amount: Double) {
        // TODO
    }

    fun withdraw(amount: Double): Boolean {
        // TODO: reject if amount > balance
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "encapsulation", description: "Balance is private/encapsulated, not a public mutable field.", weight: 25 },
        { id: "withdraw-guard", description: "Withdraw correctly rejects amounts greater than the current balance.", weight: 40 },
        { id: "no-negative", description: "No path leaves the balance negative.", weight: 35 },
      ],
      canonicalApproach:
        "A Wallet class holding balance as a private field, exposing deposit/withdraw as the only mutators, " +
        "with withdraw checking the guard before mutating. Nothing about concurrency yet — that's stage 3's problem, " +
        "deliberately deferred so the candidate doesn't over-engineer stage 1.",
      commonPitfalls: [
        "Exposing balance as a public mutable field — looks fine until stage 3 makes it a liability.",
        "Allowing withdraw to leave balance negative on a race between the check and the mutation (irrelevant at stage 1, but candidates who guard against it here often carry the right instinct forward).",
      ],
      tests: {
        python: `# --- tests (read-only) ---
def _run():
    w = Wallet(100.0)
    assert w.balance == 100.0, "opening balance should be 100"
    w.deposit(50.0)
    assert w.balance == 150.0, "balance after deposit(50) should be 150"
    assert w.withdraw(30.0) is True, "withdraw(30) should return True"
    assert w.balance == 120.0, "balance after withdraw(30) should be 120"
    assert w.withdraw(1000.0) is False, "withdraw over balance should return False"
    assert w.balance == 120.0, "rejected withdraw must not change balance"
    print("__BUILD_IT_PASS__")

_run()`,
        kotlin: `// --- tests (read-only) ---
fun main() {
    val w = Wallet(100.0)
    check(w.balance == 100.0) { "opening balance should be 100" }
    w.deposit(50.0)
    check(w.balance == 150.0) { "balance after deposit(50) should be 150" }
    check(w.withdraw(30.0)) { "withdraw(30) should return true" }
    check(w.balance == 120.0) { "balance after withdraw(30) should be 120" }
    check(!w.withdraw(1000.0)) { "withdraw over balance should return false" }
    check(w.balance == 120.0) { "rejected withdraw must not change balance" }
    println("__BUILD_IT_PASS__")
}`,
        csharp: `// --- tests (read-only) ---
class TestRunner
{
    static void Check(bool cond, string msg)
    {
        if (!cond) throw new Exception("FAILED: " + msg);
    }

    static void Main()
    {
        var w = new Wallet(100m);
        Check(w.Balance == 100m, "opening balance should be 100");
        w.Deposit(50m);
        Check(w.Balance == 150m, "balance after Deposit(50) should be 150");
        Check(w.Withdraw(30m) == true, "Withdraw(30) should return true");
        Check(w.Balance == 120m, "balance after Withdraw(30) should be 120");
        Check(w.Withdraw(1000m) == false, "Withdraw over balance should return false");
        Check(w.Balance == 120m, "rejected withdraw must not change balance");
        Console.WriteLine("__BUILD_IT_PASS__");
    }
}`,
      },
    },
    {
      stage: 2,
      title: "Atomic transfer",
      constraintAdded: "transfer(to, amount) must move money between two wallets as a single atomic operation.",
      narrative:
        "Product now wants transfers between wallets, not just deposit/withdraw on one wallet. A transfer is a " +
        "withdraw from A plus a deposit to B — and if the process crashes (or throws) between the two, money either " +
        "vanishes or gets duplicated. A naive implementation calls A.withdraw() then B.deposit() as two separate steps.",
      prompt:
        "Add transfer(to: Wallet, amount) that debits this wallet and credits the target wallet as a single atomic " +
        "unit: either both happen or neither does. Assume single-threaded for this stage — the failure mode to design " +
        "against here is a partial failure (an exception between the two steps), not concurrency yet.",
      skeletons: {
        csharp: {
          fileName: "Wallet.cs",
          code: `public class Wallet
{
    private decimal _balance;

    // ...deposit/withdraw from stage 1...

    public void Transfer(Wallet to, decimal amount)
    {
        // TODO: debit this wallet and credit "to" atomically —
        // if anything throws partway through, neither side should have moved.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "wallet.py",
          code: `class Wallet:
    # ...deposit/withdraw from stage 1...

    def transfer(self, to: "Wallet", amount: float) -> None:
        # TODO: debit self and credit "to" atomically —
        # if anything throws partway through, neither side should have moved.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "Wallet.kt",
          code: `class Wallet(openingBalance: Double) {
    // ...deposit/withdraw from stage 1...

    fun transfer(to: Wallet, amount: Double) {
        // TODO: debit this wallet and credit "to" atomically —
        // if anything throws partway through, neither side should have moved.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "single-unit", description: "Debit and credit are treated as one unit of work with a clear rollback/undo path on failure.", weight: 40 },
        { id: "insufficient-funds", description: "Insufficient funds on the source wallet aborts before either side is touched.", weight: 30 },
        { id: "no-partial-state", description: "No code path leaves the source debited without the destination credited (or vice versa).", weight: 30 },
      ],
      canonicalApproach:
        "Validate sufficient funds first (fail fast, before mutating anything), then perform the debit, then the " +
        "credit, wrapped so an exception after the debit triggers a compensating re-credit — or, cleaner, compute both " +
        "new balances first and only then write both, so there's no window where one write succeeded and the other didn't.",
      commonPitfalls: [
        "Withdraw-then-deposit as two independent calls with no rollback — an exception between them silently destroys money.",
        "Checking sufficient funds after already deciding to proceed, rather than as a precondition that aborts the whole transfer.",
      ],
    },
    {
      stage: 3,
      title: "Thread-safe under contention",
      constraintAdded: "Multiple threads call transfer() concurrently on overlapping wallets.",
      narrative:
        "Now put stage 2 under load: many threads call transfer() concurrently, sometimes on the same pair of wallets, " +
        "sometimes on overlapping pairs (A→B and B→C at the same time). The naive stage-2 design has no locking at all — " +
        "two concurrent transfers out of the same wallet can both read the same starting balance, both pass the " +
        "sufficient-funds check, and both deduct, taking the wallet negative. This is the make-or-break stage.",
      prompt:
        "Make transfer() safe under concurrent calls from many threads, including concurrent transfers that touch the " +
        "same wallet from both sides (A→B and C→A at once). State the conservation invariant you're protecting and " +
        "argue — with a concrete interleaving — why your design can't violate it. Locking order matters here: if you " +
        "lock two wallets per transfer, a naive lock-A-then-lock-B under concurrent opposite-direction transfers " +
        "deadlocks.",
      invariant:
        "The sum of every wallet's balance in the system is constant across any sequence of concurrent transfers " +
        "(money is neither created nor destroyed), and no wallet's balance is ever observed to go negative.",
      skeletons: {
        csharp: {
          fileName: "Wallet.cs",
          code: `public class Wallet
{
    private readonly object _lock = new();
    private decimal _balance;
    public Guid Id { get; } = Guid.NewGuid();

    // ...deposit/withdraw/transfer from stages 1-2...

    public void Transfer(Wallet to, decimal amount)
    {
        // TODO: lock both wallets safely (watch lock ordering — two threads
        // transferring in opposite directions must not deadlock), then move
        // the funds. State + defend the conservation invariant.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "wallet.py",
          code: `import threading
import uuid

class Wallet:
    def __init__(self, opening_balance: float):
        self._balance = opening_balance
        self._lock = threading.Lock()
        self.id = uuid.uuid4()

    # ...deposit/withdraw/transfer from stages 1-2...

    def transfer(self, to: "Wallet", amount: float) -> None:
        # TODO: lock both wallets safely (watch lock ordering — two threads
        # transferring in opposite directions must not deadlock), then move
        # the funds. State + defend the conservation invariant.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "Wallet.kt",
          code: `import java.util.UUID
import java.util.concurrent.locks.ReentrantLock

class Wallet(openingBalance: Double) {
    val id: UUID = UUID.randomUUID()
    private val lock = ReentrantLock()
    private var balance = openingBalance

    // ...deposit/withdraw/transfer from stages 1-2...

    fun transfer(to: Wallet, amount: Double) {
        // TODO: lock both wallets safely (watch lock ordering — two threads
        // transferring in opposite directions must not deadlock), then move
        // the funds. State + defend the conservation invariant.
        TODO()
    }
}
`,
        },
      },
      rubric: [
        { id: "mutual-exclusion", description: "Both wallets involved in a transfer are protected by mutual exclusion for the duration of the balance check + mutation.", weight: 25 },
        { id: "lock-ordering", description: "Locks are acquired in a consistent global order (e.g. by wallet id) to prevent deadlock between opposite-direction concurrent transfers.", weight: 25 },
        { id: "invariant", description: "The candidate explicitly states the conservation invariant and argues, with a concrete race scenario, why their locking prevents violating it.", weight: 50 },
      ],
      canonicalApproach:
        "Give every wallet a stable, comparable identity (a GUID/UUID). When transferring between two wallets, acquire " +
        "their locks in a fixed order determined by that identity (e.g. lower id first) regardless of which wallet is " +
        "the source — this breaks the deadlock cycle because every thread, no matter the transfer direction, agrees on " +
        "acquisition order. Do the sufficient-funds check and both balance mutations while holding both locks, so no " +
        "other thread can observe or act on an intermediate state.",
      commonPitfalls: [
        "Locking the source wallet, then the destination wallet, in call order — deadlocks the instant two threads transfer in opposite directions between the same pair.",
        "A single global lock around all transfers — correct, but serializes every transfer in the system regardless of which wallets are involved, which the candidate should at least name as a throughput tradeoff.",
        "Using a lock per wallet but checking the balance before acquiring it — the check-then-act gap still allows two concurrent transfers to both pass the guard.",
      ],
    },
    {
      stage: 4,
      title: "Multi-currency",
      constraintAdded: "Wallets hold balances in multiple currencies; transfers may need conversion.",
      narrative:
        "Now the wallet needs to hold balances per currency (USD, EUR, INR, ...), and a transfer can move funds " +
        "between wallets that don't share a currency, requiring a conversion step. The stage-3 locking discipline still " +
        "applies — this stage is about correctly extending the data model without reintroducing the stage-3 race.",
      prompt:
        "Extend the wallet to hold a balance per currency. transfer(to, amount, currency) should debit the source in " +
        "its own currency and credit the destination — converting via an injected exchange-rate provider if the " +
        "destination's currency differs. Keep the stage-3 concurrency guarantees intact: the conservation invariant " +
        "now applies per-currency (or in a common reporting currency, if you convert for the invariant check) across " +
        "concurrent multi-currency transfers.",
      skeletons: {
        csharp: {
          fileName: "Wallet.cs",
          code: `public interface IExchangeRateProvider
{
    decimal GetRate(string fromCurrency, string toCurrency);
}

public class Wallet
{
    private readonly Dictionary<string, decimal> _balances = new();
    private readonly object _lock = new();
    public Guid Id { get; } = Guid.NewGuid();

    // ...stage 1-3 members...

    public void Transfer(Wallet to, decimal amount, string currency, IExchangeRateProvider rates)
    {
        // TODO: debit "currency" balance on this wallet; credit "to" in
        // whatever currency "to" holds, converting via "rates" if needed.
        // Preserve stage-3's lock ordering and conservation invariant.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "wallet.py",
          code: `from typing import Protocol

class ExchangeRateProvider(Protocol):
    def get_rate(self, from_currency: str, to_currency: str) -> float: ...

class Wallet:
    def __init__(self, opening_balances: dict[str, float]):
        self._balances = dict(opening_balances)
        # ...lock/id from stage 3...

    def transfer(self, to: "Wallet", amount: float, currency: str, rates: ExchangeRateProvider) -> None:
        # TODO: debit "currency" balance on this wallet; credit "to" in
        # whatever currency "to" holds, converting via "rates" if needed.
        # Preserve stage-3's lock ordering and conservation invariant.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "Wallet.kt",
          code: `fun interface ExchangeRateProvider {
    fun getRate(from: String, to: String): Double
}

class Wallet(openingBalances: Map<String, Double>) {
    private val balances = openingBalances.toMutableMap()
    // ...lock/id from stage 3...

    fun transfer(to: Wallet, amount: Double, currency: String, rates: ExchangeRateProvider) {
        // TODO: debit "currency" balance on this wallet; credit "to" in
        // whatever currency "to" holds, converting via "rates" if needed.
        // Preserve stage-3's lock ordering and conservation invariant.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "per-currency-model", description: "Balance is modeled per-currency (map/dictionary), not a single scalar.", weight: 20 },
        { id: "conversion-boundary", description: "Conversion happens at a clear boundary (via the injected rate provider), not hardcoded.", weight: 20 },
        { id: "concurrency-preserved", description: "The stage-3 locking discipline (consistent lock ordering, mutual exclusion across the whole operation) is preserved for multi-currency transfers.", weight: 30 },
        { id: "invariant-extended", description: "The candidate addresses how the conservation invariant is checked/preserved once multiple currencies are involved (e.g. converting to a common currency for the check, or asserting it per-currency plus a conversion-consistency argument).", weight: 30 },
      ],
      canonicalApproach:
        "Keep balances as a currency-keyed map guarded by the same per-wallet lock from stage 3. On transfer, look up " +
        "the rate once (outside the lock, since it's a pure read from an external provider), then acquire both wallet " +
        "locks in the stage-3 order and apply the debit/credit atomically using the rate captured beforehand — don't " +
        "re-fetch the rate while holding the locks, since a rate provider call is exactly the kind of blocking external " +
        "call that shouldn't happen inside a critical section.",
      commonPitfalls: [
        "Calling the exchange-rate provider while holding both wallet locks — turns a fast in-memory critical section into one that can block on I/O.",
        "Reusing stage-3's single-currency invariant unchanged — a candidate who doesn't address what 'conservation' even means across currencies is missing the point of this stage.",
      ],
    },
  ],
};
