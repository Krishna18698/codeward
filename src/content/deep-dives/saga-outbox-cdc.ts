export const sagaOutboxCdc = {
  slug: "saga-outbox-cdc",
  title: "Saga, Outbox & CDC for Payments",
  hook: "One local transaction can't span a multi-service payment flow. A saga coordinates committed steps, reliable events, compensation, and forward recovery — and the outbox is what makes the events reliable.",
  tags: ["Payments", "Microservices"],
  minutes: 30,
  level: "Senior IC",
  prerequisites: "Database transactions, message queues, and the idempotency deep dive.",
  afterThis: "Two-Phase Commit — the blocking alternative sagas are designed to avoid.",
  suggestedFirstPass: "Read why dual writes fail first; the outbox pattern only makes sense once you feel that pain.",
  references: [
    { label: "Debezium (change data capture)", url: "https://debezium.io/" },
    { label: "Chris Richardson — Saga pattern (microservices.io)" },
  ],
  body: `
## The problem a saga solves

A single database transaction is atomic: everything commits or nothing does. That guarantee evaporates the moment a business operation spans services. "Place order" might mean: reserve inventory (inventory service), charge the card (payment service), and create the shipment (fulfilment service) — three databases, three transactions, no shared commit. Halfway through, the payment succeeds but inventory reservation fails. Now what?

You cannot use a distributed transaction (2PC) across microservices in practice — it's slow, it blocks, and it couples the services' availability (covered in the two-phase-commit dive). The industry answer is the **saga**: model the operation as a sequence of local transactions, each with a **compensating action** that semantically undoes it. If step 3 fails, run the compensations for steps 2 and 1 in reverse.

Key reframing for interviews: **a saga trades atomicity for eventual consistency plus explicit compensation.** There is a window where the system is partially done. You accept that window and design for it.

## Orchestration vs choreography

Two ways to coordinate the steps:

**Choreography** — each service listens for events and reacts. Payment service hears \`InventoryReserved\`, charges, emits \`PaymentCompleted\`; fulfilment hears that and ships. No central brain.
- Pro: no coordinator, loosely coupled, services own their logic.
- Con: the overall flow lives *nowhere* — it's emergent. Debugging "why did this order get stuck?" means tracing events across five services. Cyclic dependencies creep in. Hard to see the whole saga.

**Orchestration** — a central orchestrator (a saga coordinator / state machine) explicitly calls each step and decides what's next, including compensations.
- Pro: the flow is in one place, visible and testable; easy to add steps, add timeouts, reason about state.
- Con: the orchestrator is a component to build and operate; risk of it becoming a god-service if it holds business logic that belongs in the services.

The senior take: **choreography for simple 2-3 step flows; orchestration once the flow has branches, timeouts, and more than a few steps** — which payment flows always do. Name the trade; don't dogmatically pick one.

## Compensation isn't rollback

A rollback restores previous state exactly. A **compensation** is a *new* action that semantically offsets a completed one — and the difference matters:

- You charged the card; the compensation is a **refund**, not "un-charge." The refund is itself a real, observable transaction (and must be idempotent — see the idempotency dive).
- You sent a confirmation email; you cannot un-send it. The compensation is a follow-up "your order was cancelled" email.
- You reserved inventory; the compensation releases it — but if someone else grabbed it in the meantime, releasing is fine, but the *reserve* can't be assumed reversible without side effects.

This is why sagas are described as having **semantic** (not physical) rollback. Interviewers probe whether you understand that compensations can fail too, and can't always fully undo — you design for "eventually consistent and reconciled," not "as if nothing happened."

## The outbox pattern: the actually-hard part

Here's the bug that sinks naive saga implementations — the **dual-write problem**. A step needs to both (a) commit its local DB change and (b) publish an event so the next step runs. If you do:

\`\`\`ts
await db.transaction(async (tx) => {
  await tx.payment.create({ status: "completed" });
});
await kafka.publish("PaymentCompleted", { ... }); // ← crash here?
\`\`\`

...and the process crashes *between* the commit and the publish, the payment is recorded but the event never fires. The saga stalls forever. Reverse the order and you publish an event for a payment that then fails to commit — a phantom event. **There is no ordering of two separate systems that's crash-safe.**

The **transactional outbox** fixes it: write the event into an \`outbox\` table *in the same local transaction* as the business change.

\`\`\`ts
await db.transaction(async (tx) => {
  await tx.payment.create({ status: "completed" });
  await tx.outbox.insert({ topic: "PaymentCompleted", payload, published: false });
});
\`\`\`

Now the business row and the intent-to-publish commit atomically — one transaction, real atomicity. A separate **relay** reads unpublished outbox rows and pushes them to the broker, marking them published (at-least-once — the relay can crash after publishing but before marking, so consumers must dedupe — idempotency again). The event *will* eventually fire because it's durably committed alongside the thing it describes.

## CDC: the outbox without a relay

**Change Data Capture** reads the database's replication log (Postgres WAL, MySQL binlog) and streams row changes as events — tools like Debezium do this. Point CDC at the outbox table and it publishes new outbox rows automatically; you don't write or operate a relay poller. Some designs skip the outbox table entirely and CDC the business tables directly, deriving events from row changes.

Trade-offs to name:
- CDC on the **outbox table** is clean: you control the event shape, the log stays business-meaningful.
- CDC on **business tables** couples your event contract to your schema — a column rename becomes a breaking event change, and you emit events for changes you didn't mean to publish.
- CDC adds an operational dependency (the connector, its offsets, its failure modes) — but removes the relay you'd otherwise build.

## Putting it together — the interview narrative

> Place-order is a saga: reserve inventory → charge → ship, each a local transaction with a compensation (release, refund, cancel-shipment). I orchestrate it with a state machine so the flow, timeouts, and compensations live in one place. Each step publishes its event via the transactional outbox — the event row commits with the business row, so a crash can't lose it — and either a relay or Debezium CDC ships outbox rows to Kafka at-least-once. Consumers are idempotent, so redelivery is safe. The system is eventually consistent with explicit compensation, not atomic — and that's the correct trade for cross-service payments.

## Interview traps

1. *"Just use a distributed transaction."* — 2PC across microservices blocks and couples availability; the whole point of the saga is to avoid it.
2. *"Publish the event after committing."* — the dual-write crash window. Outbox or CDC, always.
3. *"Compensation = rollback."* — no; it's a new offsetting action that can itself fail and can't always fully undo.
4. *"The orchestrator holds all the logic."* — that recreates a monolith; the orchestrator sequences steps, services own their rules.
5. Forgetting **idempotent consumers** — at-least-once delivery means every step can run twice; without dedupe, a saga double-charges or double-ships.

## The 60-second summary

> Model a cross-service operation as a sequence of local transactions, each with a compensating action; orchestrate them with a state machine once the flow is non-trivial. Make event publication crash-safe with the transactional outbox — the event commits in the same transaction as the business change — and ship outbox rows via a relay or CDC at-least-once. Consumers dedupe. You get eventual consistency with explicit compensation, which is the achievable substitute for the atomicity you can't have across services.
`,
};
