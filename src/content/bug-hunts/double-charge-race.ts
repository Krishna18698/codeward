import type { BugHuntExercise } from "./types";

export const doubleChargeRace: BugHuntExercise = {
  slug: "double-charge-race",
  title: "Customers double-charged under retry",
  brief:
    "Support flagged three customers charged twice when the mobile app retried after a flaky network. " +
    "The idempotency guard is supposed to stop this. Two tests fail; one passes. Find the root cause.",
  language: "TypeScript",
  minutes: 12,
  files: [
    {
      name: "charge-service.ts",
      code: `const store: Record<string, ChargeResult> = {};

export async function charge(key: string, amount: number): Promise<ChargeResult> {
  // Idempotency guard: replay if we've seen this key
  if (store[key]) {
    return store[key];
  }

  const result = await psp.charge(amount);
  store[key] = result;
  return result;
}`,
    },
  ],
  testOutput: `=== RUN   TestChargeIdempotency
--- FAIL: duplicate charge on concurrent retry (2.31s)
    want: 1 charge created
    got:  2 charges (txn-4821, txn-4822)

=== RUN   TestConcurrentSameKey
--- FAIL: race detected (1.84s)
    DATA RACE: concurrent writes to store[key]
    write at 0x00c000118040 by goroutine 7
    write at 0x00c000118040 by goroutine 9

=== RUN   TestBasicCharge
--- PASS: single charge succeeds (0.12s)

FAIL  charge-service  4.27s`,
  rootCause:
    "The idempotency check and the store write are not atomic. Two concurrent requests with the same key both evaluate `store[key]` as empty before either writes, so both call psp.charge — a check-then-act race. The single-request test passes because there's no concurrency; the guard only works when requests are serialized.",
  category: "concurrency",
  ruledOut: [
    "The PSP failed to deduplicate on its end — no, the service sends two distinct charges; the PSP correctly processed both.",
    "The network stripped the idempotency key on retry — no, both requests carry the same key; the key is present, the guard just isn't atomic.",
    "The store is losing data — no, the store works; the problem is two readers passing the guard before either writes.",
  ],
  canonicalFix:
    "Make the check-and-reserve atomic. Replace the in-memory object with a store that supports atomic insert (`INSERT ... ON CONFLICT DO NOTHING`, or Redis `SET key NX`). The first request reserves the key; concurrent duplicates lose the reservation and either wait for the winner's result or return 409. The reservation must happen before the psp.charge call, not after.",
};
