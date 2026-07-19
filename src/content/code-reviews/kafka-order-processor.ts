import type { CodeReviewExercise } from "./types";

export const kafkaOrderProcessor: CodeReviewExercise = {
  slug: "kafka-order-processor",
  title: "Migrate order processor to Kafka",
  brief:
    "Black Friday broke our polling-based order processor — we fell 40 minutes behind and customers got delayed confirmation emails. " +
    "This replaces the poller with a Kafka consumer for horizontal scale and backpressure. Review before we cut traffic over.",
  language: "TypeScript",
  minutes: 12,
  files: [
    {
      name: "processor.ts",
      code: `consumer.subscribe({ topic: "orders" });

consumer.run({
  eachMessage: async ({ message }) => {
    const order = JSON.parse(message.value.toString());

    await chargeCustomer(order);
    await sendConfirmationEmail(order);
    await db.order.update({
      where: { id: order.id },
      data: { status: "processed" },
    });
  },
});`,
    },
  ],
  bugs: [
    {
      id: "not-idempotent",
      severity: 5,
      category: "correctness",
      description:
        "Kafka is at-least-once: a consumer can crash after processing but before the offset commits, and the same message is redelivered. This handler charges the customer and sends an email with no dedup, so redelivery double-charges and double-emails. Processing must be idempotent — dedupe on the order id / a processed marker before charging.",
    },
    {
      id: "side-effects-order",
      severity: 4,
      category: "correctness",
      description:
        "The steps run charge → email → mark-processed with no atomicity. If the process dies after charging but before marking processed, redelivery re-charges (compounding the idempotency bug); if email fails, the whole message reprocesses and re-charges. The state update that records 'done' must be the guard that makes re-processing safe.",
    },
    {
      id: "poison-message-blocks",
      severity: 4,
      category: "correctness",
      description:
        "An un-parseable or un-processable message (bad JSON, a permanently failing charge) throws, the offset never commits, and the same message is retried forever — blocking the whole partition behind a poison pill. Needs a try/catch that routes terminal failures to a dead-letter topic so the partition can advance.",
    },
    {
      id: "no-partition-key-ordering",
      severity: 3,
      category: "correctness",
      description:
        "Nothing here (or in the note) confirms orders are keyed by a stable id on the producer side. Without a partition key, events for one customer/order can be spread across partitions and processed out of order — a status regression. Ordering guarantees depend on the partition key, which must be verified.",
    },
    {
      id: "unbounded-parallelism-note",
      severity: 2,
      category: "performance",
      description:
        "eachMessage processes one at a time per partition; scaling throughput means more partitions/consumers, but the charge+email work has external rate limits (PSP, email provider). Worth confirming those downstreams can absorb the new concurrency, or the migration just moves the bottleneck.",
    },
  ],
};
