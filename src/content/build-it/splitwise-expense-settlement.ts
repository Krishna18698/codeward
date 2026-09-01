import type { BuildItProblem } from "./types";

export const splitwiseExpenseSettlement: BuildItProblem = {
  slug: "splitwise-expense-settlement",
  title: "Splitwise Expense Settlement",
  category: "payments",
  brief:
    "A group expense-sharing ledger, across four stages: equal splits with net balances, unequal/exact splits with " +
    "validation, correct under concurrent expense additions, then debt simplification. Balances are signed (positive " +
    "= owed to you, negative = you owe). Each stage adds a constraint the previous design can't meet.",
  totalMinutes: 100,
  stages: [
    {
      stage: 1,
      title: "Equal split and net balances",
      constraintAdded: "None yet — this is the baseline.",
      narrative:
        "A group shares expenses: someone pays, and the cost is split among participants. You track each person's net " +
        "balance — how much the group owes them (positive) or they owe the group (negative). Single thread. Equal splits " +
        "only for now. This baseline exists so unequal splits (stage 2) and concurrency (stage 3) have something to break.",
      prompt:
        "Implement addUser(user), addExpense(payer, amount, participants) that splits amount equally among participants, " +
        "and getBalance(user) returning the signed net balance. Paying increases your balance by the amount paid; your " +
        "share decreases it. So if Alice pays 90 split among 3 people, Alice is +60 (paid 90, owes 30) and each other is " +
        "-30. Assume amounts divide evenly for this stage.",
      skeletons: {
        csharp: {
          fileName: "Splitwise.cs",
          code: `public class Splitwise
{
    private readonly Dictionary<string, double> _balance = new();

    public void AddUser(string user)
    {
        // TODO: register a user with a zero balance
        throw new NotImplementedException();
    }

    public void AddExpense(string payer, double amount, List<string> participants)
    {
        // TODO: split amount equally among participants. Payer's balance += amount;
        // each participant's balance -= their equal share.
        throw new NotImplementedException();
    }

    public double GetBalance(string user)
    {
        // TODO: signed net balance (positive = owed to them, negative = they owe)
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "splitwise.py",
          code: `class Splitwise:
    def __init__(self):
        self._balance: dict[str, float] = {}

    def add_user(self, user: str) -> None:
        # TODO: register a user with a zero balance
        raise NotImplementedError

    def add_expense(self, payer: str, amount: float, participants: list[str]) -> None:
        # TODO: split amount equally among participants. Payer's balance += amount;
        # each participant's balance -= their equal share.
        raise NotImplementedError

    def get_balance(self, user: str) -> float:
        # TODO: signed net balance (positive = owed to them, negative = they owe)
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "Splitwise.kt",
          code: `class Splitwise {
    private val balance = mutableMapOf<String, Double>()

    fun addUser(user: String) {
        // TODO: register a user with a zero balance
        TODO()
    }

    fun addExpense(payer: String, amount: Double, participants: List<String>) {
        // TODO: split amount equally among participants. Payer's balance += amount;
        // each participant's balance -= their equal share.
        TODO()
    }

    fun getBalance(user: String): Double {
        // TODO: signed net balance (positive = owed to them, negative = they owe)
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "equal-split", description: "addExpense splits the amount equally across participants (share = amount / participant count).", weight: 30 },
        { id: "payer-credit-participant-debit", description: "The payer's balance increases by the full amount paid; each participant's balance decreases by their share (the payer, if a participant, nets both).", weight: 40 },
        { id: "signed-balance", description: "getBalance returns the correct signed net (positive = owed to them, negative = they owe).", weight: 30 },
      ],
      canonicalApproach:
        "Keep a map from user to signed balance. On addExpense, add the full amount to the payer's balance, then subtract " +
        "amount/n from each participant's balance (including the payer if they're a participant, so they net to paid minus " +
        "their own share). getBalance is a lookup. Because every expense adds `amount` and subtracts n * (amount/n) = " +
        "amount, the sum over all users stays zero — the property stage 3 will have to defend under concurrency.",
      commonPitfalls: [
        "Not debiting the payer's own share when they're a participant, so their balance comes out too high and the books don't sum to zero.",
        "Storing who-owes-whom as directed pairs and trying to keep them consistent — net balances are simpler and the canonical model here.",
        "Integer-dividing the share and silently dropping the remainder (fine when amounts divide evenly, but name it — stage 2 and real money need a rounding policy).",
      ],
      tests: {
        python: `# --- tests (read-only) ---
def _run():
    s = Splitwise()
    for u in ("alice", "bob", "carol"):
        s.add_user(u)
    s.add_expense("alice", 90, ["alice", "bob", "carol"])   # 30 each
    assert s.get_balance("alice") == 60, "alice paid 90, owes 30 -> +60"
    assert s.get_balance("bob") == -30, "bob owes 30"
    assert s.get_balance("carol") == -30, "carol owes 30"
    s.add_expense("bob", 60, ["alice", "bob"])              # 30 each
    assert s.get_balance("alice") == 30, "alice -30 more -> 30"
    assert s.get_balance("bob") == 0, "bob paid 60, owes 30 -> nets to 0"
    assert s.get_balance("carol") == -30, "carol unchanged"
    total = s.get_balance("alice") + s.get_balance("bob") + s.get_balance("carol")
    assert total == 0, "the books always sum to zero"
    print("__BUILD_IT_PASS__")

_run()`,
        kotlin: `// --- tests (read-only) ---
fun main() {
    val s = Splitwise()
    for (u in listOf("alice", "bob", "carol")) s.addUser(u)
    s.addExpense("alice", 90.0, listOf("alice", "bob", "carol"))
    check(s.getBalance("alice") == 60.0) { "alice +60" }
    check(s.getBalance("bob") == -30.0) { "bob -30" }
    check(s.getBalance("carol") == -30.0) { "carol -30" }
    s.addExpense("bob", 60.0, listOf("alice", "bob"))
    check(s.getBalance("alice") == 30.0) { "alice 30" }
    check(s.getBalance("bob") == 0.0) { "bob 0" }
    check(s.getBalance("carol") == -30.0) { "carol unchanged" }
    val total = s.getBalance("alice") + s.getBalance("bob") + s.getBalance("carol")
    check(total == 0.0) { "books sum to zero" }
    println("__BUILD_IT_PASS__")
}`,
        csharp: `// --- tests (read-only) ---
class TestRunner
{
    static void Check(bool cond, string msg) { if (!cond) throw new Exception("FAILED: " + msg); }
    static void Main()
    {
        var s = new Splitwise();
        foreach (var u in new[] {"alice","bob","carol"}) s.AddUser(u);
        s.AddExpense("alice", 90, new List<string> {"alice","bob","carol"});
        Check(s.GetBalance("alice") == 60, "alice +60");
        Check(s.GetBalance("bob") == -30, "bob -30");
        Check(s.GetBalance("carol") == -30, "carol -30");
        s.AddExpense("bob", 60, new List<string> {"alice","bob"});
        Check(s.GetBalance("alice") == 30, "alice 30");
        Check(s.GetBalance("bob") == 0, "bob 0");
        Check(s.GetBalance("carol") == -30, "carol unchanged");
        Check(s.GetBalance("alice") + s.GetBalance("bob") + s.GetBalance("carol") == 0, "books sum to zero");
        Console.WriteLine("__BUILD_IT_PASS__");
    }
}`,
      },
    },
    {
      stage: 2,
      title: "Unequal / exact splits with validation",
      constraintAdded: "Expenses can be split by exact per-person shares that must sum to the amount.",
      narrative:
        "Real groups don't always split evenly — one person had the steak, someone else just a salad. Add exact splits: " +
        "the caller supplies each participant's share explicitly. This introduces the first validation the system must " +
        "enforce: the shares have to add up to the expense amount, or the books stop balancing. A rejected expense must " +
        "leave every balance untouched (all-or-nothing).",
      prompt:
        "Add addExpenseExact(payer, amount, shares) where shares maps each participant to the exact amount they owe. " +
        "Validate that the shares sum to amount (reject with an error otherwise) BEFORE mutating any balance — a rejected " +
        "expense changes nothing. On success, credit the payer the full amount and debit each participant their share. Keep " +
        "the stage-1 equal-split addExpense working (it's the special case where all shares are equal).",
      skeletons: {
        csharp: {
          fileName: "Splitwise.cs",
          code: `public class Splitwise
{
    private readonly Dictionary<string, double> _balance = new();

    // Given from stage 1:
    public void AddUser(string user) => _balance[user] = 0;
    public void AddExpense(string payer, double amount, List<string> participants)
    {
        double share = amount / participants.Count;
        _balance[payer] += amount;
        foreach (var p in participants) _balance[p] -= share;
    }
    public double GetBalance(string user) => _balance[user];

    public void AddExpenseExact(string payer, double amount, Dictionary<string, double> shares)
    {
        // TODO: validate sum(shares) == amount BEFORE mutating anything (reject
        // otherwise, leaving all balances untouched). Then credit payer, debit shares.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "splitwise.py",
          code: `class Splitwise:
    def __init__(self):
        self._balance: dict[str, float] = {}

    # Given from stage 1:
    def add_user(self, user: str) -> None:
        self._balance[user] = 0.0
    def add_expense(self, payer: str, amount: float, participants: list[str]) -> None:
        share = amount / len(participants)
        self._balance[payer] += amount
        for p in participants:
            self._balance[p] -= share
    def get_balance(self, user: str) -> float:
        return self._balance[user]

    def add_expense_exact(self, payer: str, amount: float, shares: dict[str, float]) -> None:
        # TODO: validate sum(shares) == amount BEFORE mutating anything (raise
        # otherwise, leaving all balances untouched). Then credit payer, debit shares.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "Splitwise.kt",
          code: `class Splitwise {
    private val balance = mutableMapOf<String, Double>()

    // Given from stage 1:
    fun addUser(user: String) { balance[user] = 0.0 }
    fun addExpense(payer: String, amount: Double, participants: List<String>) {
        val share = amount / participants.size
        balance[payer] = balance[payer]!! + amount
        for (p in participants) balance[p] = balance[p]!! - share
    }
    fun getBalance(user: String): Double = balance[user]!!

    fun addExpenseExact(payer: String, amount: Double, shares: Map<String, Double>) {
        // TODO: validate sum(shares) == amount BEFORE mutating anything (throw
        // otherwise, leaving all balances untouched). Then credit payer, debit shares.
        TODO()
    }
}`,
        },
      },
      tests: {
        python: `# --- tests (read-only) ---
def _run():
    s = Splitwise()
    for u in ("alice", "bob", "carol"):
        s.add_user(u)
    s.add_expense_exact("alice", 100, {"alice": 20, "bob": 30, "carol": 50})
    assert s.get_balance("alice") == 80, "alice paid 100, owes 20 -> +80"
    assert s.get_balance("bob") == -30, "bob owes 30"
    assert s.get_balance("carol") == -50, "carol owes 50"
    # invalid: shares sum to 80, not 100 -> rejected, balances untouched
    raised = False
    try:
        s.add_expense_exact("bob", 100, {"bob": 40, "alice": 40})
    except Exception:
        raised = True
    assert raised, "mismatched shares must be rejected"
    assert s.get_balance("alice") == 80, "rejected expense left alice untouched"
    assert s.get_balance("bob") == -30, "rejected expense left bob untouched"
    assert s.get_balance("carol") == -50, "rejected expense left carol untouched"
    print("__BUILD_IT_PASS__")

_run()`,
        kotlin: `// --- tests (read-only) ---
fun main() {
    val s = Splitwise()
    for (u in listOf("alice", "bob", "carol")) s.addUser(u)
    s.addExpenseExact("alice", 100.0, mapOf("alice" to 20.0, "bob" to 30.0, "carol" to 50.0))
    check(s.getBalance("alice") == 80.0) { "alice +80" }
    check(s.getBalance("bob") == -30.0) { "bob -30" }
    check(s.getBalance("carol") == -50.0) { "carol -50" }
    var raised = false
    try { s.addExpenseExact("bob", 100.0, mapOf("bob" to 40.0, "alice" to 40.0)) }
    catch (e: Throwable) { raised = true }
    check(raised) { "mismatched shares must be rejected" }
    check(s.getBalance("alice") == 80.0) { "alice untouched" }
    check(s.getBalance("bob") == -30.0) { "bob untouched" }
    check(s.getBalance("carol") == -50.0) { "carol untouched" }
    println("__BUILD_IT_PASS__")
}`,
        csharp: `// --- tests (read-only) ---
class TestRunner
{
    static void Check(bool cond, string msg) { if (!cond) throw new Exception("FAILED: " + msg); }
    static void Main()
    {
        var s = new Splitwise();
        foreach (var u in new[] {"alice","bob","carol"}) s.AddUser(u);
        s.AddExpenseExact("alice", 100, new Dictionary<string,double> {{"alice",20},{"bob",30},{"carol",50}});
        Check(s.GetBalance("alice") == 80, "alice +80");
        Check(s.GetBalance("bob") == -30, "bob -30");
        Check(s.GetBalance("carol") == -50, "carol -50");
        bool raised = false;
        try { s.AddExpenseExact("bob", 100, new Dictionary<string,double> {{"bob",40},{"alice",40}}); }
        catch (Exception) { raised = true; }
        Check(raised, "mismatched shares must be rejected");
        Check(s.GetBalance("alice") == 80, "alice untouched");
        Check(s.GetBalance("bob") == -30, "bob untouched");
        Check(s.GetBalance("carol") == -50, "carol untouched");
        Console.WriteLine("__BUILD_IT_PASS__");
    }
}`,
      },
      rubric: [
        { id: "validate-before-mutate", description: "Shares are validated to sum to the amount BEFORE any balance is touched; a mismatch is rejected.", weight: 35 },
        { id: "all-or-nothing", description: "A rejected expense leaves every balance exactly as it was — no partial application.", weight: 35 },
        { id: "exact-debits", description: "On success the payer is credited the full amount and each participant is debited exactly their listed share.", weight: 30 },
      ],
      canonicalApproach:
        "Sum the shares first and compare to amount (with a small epsilon for floating point, or use integer minor units " +
        "like cents to avoid the question entirely). If they don't match, throw before mutating. Only after validation " +
        "passes do you credit the payer and debit each share — that ordering is what makes it all-or-nothing without needing " +
        "a rollback. Equal split is just this with every share = amount/n.",
      commonPitfalls: [
        "Mutating balances as you iterate and only then discovering the shares don't add up — now you need to undo a partial write.",
        "Comparing floating-point sums with == and rejecting valid input due to rounding; use an epsilon or integer cents.",
        "Trusting the caller's shares without validation, so a typo silently unbalances the whole group's books.",
      ],
    },
    {
      stage: 3,
      title: "Correct under concurrent expense additions",
      constraintAdded: "Many threads add expenses concurrently, often touching overlapping users.",
      narrative:
        "The group is a live app and expenses stream in from many devices at once — concurrent addExpense/addExpenseExact " +
        "calls, frequently touching the same users (a shared payer, overlapping participants). Each expense is a multi-user " +
        "read-modify-write across the balance map; unsynchronised, two concurrent expenses can both read a user's balance " +
        "and one overwrites the other's update (a lost update), so the books stop summing to zero. This is the make-or-break " +
        "stage: money must be conserved exactly.",
      prompt:
        "Make expense addition safe under concurrency. State the conservation invariant and defend it with a concrete " +
        "two-thread interleaving showing how an unsynchronised version loses an update. Ensure each expense applies " +
        "atomically (all its debits and credits land together, or none do — preserving stage-2's all-or-nothing under " +
        "concurrency too). Discuss your locking granularity and its throughput tradeoff.",
      invariant:
        "After any set of concurrent expense additions, the sum of all users' net balances is exactly zero — no money is " +
        "created or lost — and every individual expense's shares still sum to its amount. Each expense's full set of " +
        "debits/credits is applied atomically: no other thread observes a state where some of an expense's legs landed and others didn't.",
      skeletons: {
        csharp: {
          fileName: "Splitwise.cs",
          code: `public class Splitwise
{
    private readonly Dictionary<string, double> _balance = new();
    private readonly object _lock = new();

    // ...addUser / addExpense / addExpenseExact / getBalance from stages 1-2...

    public void AddExpenseExact(string payer, double amount, Dictionary<string, double> shares)
    {
        // TODO: validate, then apply ALL legs of the expense atomically so no
        // concurrent expense can lose an update. Defend the conservation invariant.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "splitwise.py",
          code: `import threading

class Splitwise:
    def __init__(self):
        self._balance: dict[str, float] = {}
        self._lock = threading.Lock()

    # ...add_user / add_expense / add_expense_exact / get_balance from stages 1-2...

    def add_expense_exact(self, payer: str, amount: float, shares: dict[str, float]) -> None:
        # TODO: validate, then apply ALL legs of the expense atomically so no
        # concurrent expense can lose an update. Defend the conservation invariant.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "Splitwise.kt",
          code: `import java.util.concurrent.locks.ReentrantLock

class Splitwise {
    private val balance = mutableMapOf<String, Double>()
    private val lock = ReentrantLock()

    // ...addUser / addExpense / addExpenseExact / getBalance from stages 1-2...

    fun addExpenseExact(payer: String, amount: Double, shares: Map<String, Double>) {
        // TODO: validate, then apply ALL legs of the expense atomically so no
        // concurrent expense can lose an update. Defend the conservation invariant.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "atomic-expense", description: "All of an expense's balance updates (payer credit + every participant debit) happen inside one critical section, never interleaved with another expense's updates on the same users.", weight: 25 },
        { id: "no-lost-update", description: "Concurrent read-modify-writes on the same user's balance don't lose updates (no read-outside-lock then write-inside).", weight: 25 },
        { id: "invariant", description: "The candidate states the sum-of-balances-is-zero conservation invariant and argues, with a concrete interleaving, why their synchronisation preserves it.", weight: 50 },
      ],
      canonicalApproach:
        "Guard the balance map with a single lock and apply each expense's validate-then-mutate entirely inside it, so an " +
        "expense is atomic and no other thread reads or writes a user's balance mid-expense. Because the whole multi-user " +
        "update is serialised, no increment is lost and the books stay at zero. A single lock is the simplest correct " +
        "answer; if throughput demands it, per-user locks acquired in a consistent order (to avoid deadlock, like the " +
        "thread-safe-wallet problem) let non-overlapping expenses proceed in parallel — name the tradeoff either way.",
      commonPitfalls: [
        "Using a concurrent map for balances but doing balance[u] = balance[u] + x as read-then-write — the concurrent map makes each access safe but not the read-modify-write, so updates are still lost.",
        "Locking each individual balance update separately, so another expense interleaves between a payer credit and a participant debit and briefly (or permanently, on failure) unbalances the books.",
        "Per-user locks acquired in arrival order rather than a consistent global order, which deadlocks two expenses that touch the same two users in opposite orders.",
      ],
    },
    {
      stage: 4,
      title: "Debt simplification",
      constraintAdded: "Settle the group with the minimum number of transactions.",
      narrative:
        "Net balances tell each person their position, but settling naively (everyone pays back exactly who they split with) " +
        "produces a mess of tiny transfers. Groups want the fewest transactions that settle everyone: if Alice owes Bob 10 " +
        "and Bob owes Carol 10, Alice should just pay Carol 10 — one transfer, not two. This stage computes a minimal (or " +
        "near-minimal) settlement from the net balances.",
      prompt:
        "Add simplifyDebts() returning a list of transfers (from, to, amount) that settles every balance, minimising the " +
        "number of transfers. Work only from the net balances (positive = creditor, negative = debtor). Describe your " +
        "algorithm — the standard greedy is to repeatedly match the largest debtor against the largest creditor, settling " +
        "the smaller of the two magnitudes each step — and note that the exact minimum is NP-hard, so greedy is the accepted " +
        "practical answer; state its guarantee (at most n-1 transfers).",
      skeletons: {
        csharp: {
          fileName: "Splitwise.cs",
          code: `public record Transfer(string From, string To, double Amount);

public class Splitwise
{
    // ...thread-safe balances from stage 3...

    public List<Transfer> SimplifyDebts()
    {
        // TODO: from net balances, produce transfers that zero everyone out with
        // as few transfers as practical (greedy: largest debtor -> largest creditor).
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "splitwise.py",
          code: `class Splitwise:
    # ...thread-safe balances from stage 3...

    def simplify_debts(self) -> list[tuple[str, str, float]]:
        # TODO: from net balances, produce (from, to, amount) transfers that zero
        # everyone out with as few transfers as practical (greedy: largest debtor
        # -> largest creditor).
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "Splitwise.kt",
          code: `data class Transfer(val from: String, val to: String, val amount: Double)

class Splitwise {
    // ...thread-safe balances from stage 3...

    fun simplifyDebts(): List<Transfer> {
        // TODO: from net balances, produce transfers that zero everyone out with
        // as few transfers as practical (greedy: largest debtor -> largest creditor).
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "settles-everyone", description: "The returned transfers bring every user's balance to zero — total debtor outflow matches total creditor inflow.", weight: 35 },
        { id: "greedy-matching", description: "The algorithm greedily matches the largest debtor to the largest creditor, settling min(|debt|, |credit|) each step, producing at most n-1 transfers.", weight: 40 },
        { id: "complexity-honesty", description: "The candidate acknowledges the exact minimum is NP-hard and that greedy is the practical near-optimal answer (not always the true minimum).", weight: 25 },
      ],
      canonicalApproach:
        "Split users into debtors (negative) and creditors (positive). Repeatedly take the largest debtor and largest " +
        "creditor (max-heaps, or re-scan), transfer settle = min(|debt|, credit) from debtor to creditor, decrement both, " +
        "and drop anyone who hits zero. Each step zeroes at least one person, so it terminates in at most n-1 transfers. " +
        "This is greedy and near-optimal; the true minimum-transfer problem is NP-hard (it's related to subset-sum), so " +
        "greedy is what production systems ship and what the interviewer expects, stated honestly.",
      commonPitfalls: [
        "Emitting a transfer for every original who-owes-whom edge instead of working from net balances — that's the mess simplification is meant to remove.",
        "Floating-point residue leaving a user at 0.0000001 and generating a spurious micro-transfer; work in integer cents or snap near-zero to zero.",
        "Claiming greedy always yields the true minimum — it's near-optimal, and overclaiming is the trap the rubric checks for.",
      ],
    },
  ],
};
