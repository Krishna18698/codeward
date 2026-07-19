import type { CodeReviewExercise } from "./types";

export const structuredLogging: CodeReviewExercise = {
  slug: "structured-logging",
  title: "Add structured logging + metrics to the processor",
  brief:
    "The order processor needs basic instrumentation — logs around each stage and a throughput counter. Used the team's logging conventions doc. " +
    "Open to feedback on log levels and label choices.",
  language: "TypeScript",
  minutes: 12,
  files: [
    {
      name: "instrument.ts",
      code: `export async function processOrder(order: Order) {
  logger.info(\`processing order \${JSON.stringify(order)}\`);

  const result = await charge(order);

  logger.info("charge result: " + result.status + " for card " + order.cardNumber);
  metrics.increment("orders.processed", { orderId: order.id });

  return result;
}`,
    },
  ],
  bugs: [
    {
      id: "logs-pii-card",
      severity: 5,
      category: "security",
      description:
        "Two logs leak sensitive data: `JSON.stringify(order)` dumps the whole order (likely including PII and card data) and the second line logs `order.cardNumber` in plaintext. Card numbers in logs are a PCI violation and a breach waiting to happen. Never log full objects or card numbers — log an order id and a masked/tokenized reference only.",
    },
    {
      id: "high-cardinality-label",
      severity: 4,
      category: "observability",
      description:
        "`metrics.increment(\"orders.processed\", { orderId: order.id })` uses order id as a metric label. Order id is unbounded high-cardinality — every order creates a new time series, which explodes the metrics backend's memory and cost (a classic Prometheus foot-gun). Labels must be low-cardinality (status, region, card_brand), never per-entity ids.",
    },
    {
      id: "unstructured-log",
      severity: 3,
      category: "observability",
      description:
        "Despite the 'structured logging' goal, the messages are string-concatenated free text ('charge result: ' + ...). Structured logging means key/value fields (logger.info('charge_result', { status, orderId })) so logs are queryable — string interpolation defeats the purpose.",
    },
    {
      id: "wrong-log-level",
      severity: 2,
      category: "observability",
      description:
        "A per-order 'processing order' at info level on a high-throughput processor floods logs and cost. Routine per-message tracing belongs at debug; info should be reserved for notable events. And a failed charge should log at warn/error, which isn't handled here at all.",
    },
    {
      id: "no-error-path-instrumentation",
      severity: 2,
      category: "observability",
      description:
        "Only the success path is instrumented — there's no log or failure metric when charge throws, so the dashboards will show throughput but nothing about the failure rate, which is the number oncall actually needs.",
    },
  ],
};
