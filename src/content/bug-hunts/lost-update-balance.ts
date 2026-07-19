import type { BugHuntExercise } from "./types";

export const lostUpdateBalance: BugHuntExercise = {
  slug: "lost-update-balance",
  title: "Wallet balance drifts under concurrent deposits",
  brief:
    "Two deposits that land at the same moment sometimes leave the balance short by one deposit. " +
    "Sequential deposits are always correct. Reconciliation catches it days later. Find the lost update.",
  language: "TypeScript",
  minutes: 13,
  files: [
    {
      name: "wallet.ts",
      code: `export async function deposit(userId: string, amount: number) {
  // Read the current balance
  const row = await db.query(
    "SELECT balance FROM wallets WHERE user_id = $1",
    [userId],
  );
  const newBalance = row.balance + amount;

  // Write the new balance back
  await db.query(
    "UPDATE wallets SET balance = $1 WHERE user_id = $2",
    [newBalance, userId],
  );

  return newBalance;
}`,
    },
  ],
  testOutput: `=== RUN   TestConcurrentDeposits
    starting balance: 100
    deposit A: +50  (concurrent)
    deposit B: +30  (concurrent)
--- FAIL: lost update (0.44s)
    want final balance: 180
    got  final balance: 150   (deposit B was lost)`,
  rootCause:
    "A read-modify-write race — the lost update problem. Both deposits read balance=100 before either writes. A computes 100+50=150 and writes it; B computes 100+30=130 and writes it (or vice versa). The second write overwrites the first based on a stale read, so one deposit vanishes. It's correct sequentially because there's no interleaving; it only fails when two transactions read the same value before either commits.",
  category: "concurrency",
  ruledOut: [
    "The amount arithmetic is wrong — no; each computation is individually correct. The bug is that both computations start from the same stale balance.",
    "A transaction is missing — wrapping these two statements in a transaction alone does NOT fix it under the default (read-committed) isolation; both transactions can still read the old balance. You need atomic update, row locking, or serializable isolation.",
    "The database dropped a write — both writes succeed; the second simply clobbers the first with a value derived from a stale read.",
  ],
  canonicalFix:
    "Make the update atomic so the read and write can't be split. Do the arithmetic in the database: `UPDATE wallets SET balance = balance + $1 WHERE user_id = $2` — a single statement the DB applies atomically, so concurrent deposits both add correctly. Alternatives: `SELECT ... FOR UPDATE` to lock the row before reading, optimistic concurrency with a version column (`WHERE version = $expected`), or serializable isolation. Never read-then-write a balance in application code without one of these.",
};
