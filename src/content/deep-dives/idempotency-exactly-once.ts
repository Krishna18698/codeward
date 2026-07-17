export const idempotencyExactlyOnce = {
  slug: "idempotency-exactly-once",
  title: "Idempotency & Exactly-Once Effects in Payments",
  hook: "Networks lose responses. Clients retry. Without protection, that retry charges the card twice. The protocol every backend engineer must know cold.",
  tags: ["Payments", "Distributed Systems"],
  minutes: 25,
  body: `
## The duplicate charge

The most common correctness failure in distributed payment systems is the duplicate charge. It happens when a client retries a request that actually *succeeded* — the payment provider charged the card, but the response was lost in transit. The client saw a timeout, assumed failure, and sent the request again.

The uncomfortable truth: **from the client's side, a timeout is indistinguishable from a failure.** The request may have never arrived, may have been processed and the response lost, or may still be in flight. Any retry policy that doesn't account for this will eventually double-charge someone.

This isn't rare. Mobile networks drop responses constantly. Load balancers time out long requests. Deploys kill in-flight connections. If your endpoint mutates money and a client retries it, you have this bug — the only question is how often it fires.

## The fix: idempotency keys

An idempotency key is a **client-generated unique ID** (usually a UUID) attached to each *logical* operation — not each HTTP request. If the user taps "Pay" once and the app retries three times, all four requests carry the same key.

The server's contract:

1. First time it sees a key → process the operation, **store the result against the key**, return it.
2. Any later request with the same key → **return the stored result** without re-processing.

\`\`\`ts
// The naive version — DO NOT ship this
async function charge(req: Request) {
  const key = req.headers["idempotency-key"];
  const cached = await store.get(key);
  if (cached) return cached;          // replay

  const result = await psp.charge(req.body.amount);
  await store.set(key, result);       // record
  return result;
}
\`\`\`

This looks right and fails in production. Interviewers plant exactly these bugs:

**Bug 1 — the race window.** Two concurrent requests with the same key both miss the cache (neither has stored yet), and both call \`psp.charge\`. Double charge. The check and the reservation must be **atomic**: an \`INSERT ... ON CONFLICT DO NOTHING\` on a unique key column, or Redis \`SET key value NX\`. The loser of the race must either wait for the winner's result or return \`409 Conflict\` / \`retry later\`.

**Bug 2 — volatile storage.** An in-memory map loses every key on restart or deploy. Idempotency state must live in durable shared storage (Postgres, Redis with persistence) — and it must be shared across *all* instances, or a retry landing on a different pod re-charges.

**Bug 3 — storing only success.** If the PSP call throws and you store nothing, a retry re-executes — usually what you want. But if the PSP call *succeeded and your process crashed before storing*, the retry double-charges. The robust order is: reserve the key first (state \`pending\`), call the PSP, then update to \`completed\` with the result. A retry that finds \`pending\` waits or errors; it never re-executes.

**Bug 4 — no key scoping or expiry.** Keys should be scoped per user/merchant (so one client can't replay another's) and expired after a window (24h is common) so storage doesn't grow forever.

## What "exactly-once" really means

You will hear "exactly-once delivery is impossible" — true, and worth saying in an interview. Messages can always be delivered twice or not at all; that's the Two Generals problem. What systems actually implement is **at-least-once delivery + idempotent processing = exactly-once *effects***.

That reframing is the interview answer: *"I can't guarantee the message arrives exactly once, but I can guarantee processing it twice has the same effect as processing it once."*

## Idempotency beyond HTTP

- **Queue consumers**: Kafka/SQS redeliver on consumer crash between processing and offset commit/ack. Consumers must dedupe on a message ID or business key — same pattern, different transport.
- **Database writes**: \`INSERT\` is not idempotent; \`INSERT ... ON CONFLICT DO UPDATE\` (upsert) is. \`UPDATE balance = balance - 100\` is not idempotent; \`UPDATE balance = 400 WHERE version = 7\` (optimistic concurrency) is.
- **Ledgers**: append-only ledgers make dedupe natural — the entry's unique reference IS the idempotency key, enforced by a unique constraint. This is why real money systems are ledgers, not mutable balance columns.

## Interview traps

1. *"Just check if the charge exists first."* — Check-then-act is the race in Bug 1. The reservation must be atomic.
2. *"Use the request body hash as the key."* — Two legitimate identical payments (same user, same amount, twice in a day) would collide. The key must identify the *intent instance*, which only the client knows — that's why the client generates it.
3. *"Store it in Redis with a 60s TTL."* — Mobile retries arrive minutes later; webhook retries arrive hours later. TTL must exceed the longest realistic retry window.
4. *"Return 200 with the cached response."* — Mostly right, but include a header like \`Idempotent-Replay: true\` so clients and debugging humans can tell a replay from a fresh execution.
5. What if the *response shape* changed between attempts (deploy in between)? Store the serialized response, not a pointer to re-render it — the replay must be byte-faithful to what the first caller was promised.

## The 60-second interview summary

> Every mutating endpoint accepts a client-generated idempotency key. The server atomically reserves the key (unique constraint / SET NX) in durable shared storage with state \`pending\`, executes the side effect, then stores the final response against the key. Retries replay the stored response; concurrent duplicates lose the atomic reservation and wait or 409. Exactly-once delivery is impossible — exactly-once *effects* via at-least-once delivery plus idempotent processing is the achievable, expected answer.
`,
};
