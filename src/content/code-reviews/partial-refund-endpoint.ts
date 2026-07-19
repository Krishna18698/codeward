import type { CodeReviewExercise } from "./types";

export const partialRefundEndpoint: CodeReviewExercise = {
  slug: "partial-refund-endpoint",
  title: "Add partial-refund endpoint",
  brief:
    "Support has been processing partial refunds by hand through the PSP dashboard — slow, error-prone, no audit trail. " +
    "This exposes POST /charges/:id/refunds so the support tool can hit it directly. Review for correctness and the audit story.",
  language: "TypeScript",
  minutes: 12,
  files: [
    {
      name: "refund-endpoint.ts",
      code: `router.post("/charges/:id/refunds", async (req, res) => {
  const charge = await db.charge.findUnique({ where: { id: req.params.id } });
  const amount = req.body.amount;

  const refunds = await db.refund.findMany({ where: { chargeId: charge.id } });
  const alreadyRefunded = refunds.reduce((s, r) => s + r.amount, 0);

  if (amount > charge.amount - alreadyRefunded) {
    return res.status(400).json({ error: "amount exceeds refundable" });
  }

  const pspRefund = await psp.refund(charge.pspId, amount);
  await db.refund.create({
    data: { chargeId: charge.id, amount, pspRefundId: pspRefund.id },
  });

  res.json({ refunded: amount });
});`,
    },
  ],
  bugs: [
    {
      id: "no-authz",
      severity: 5,
      category: "security",
      description:
        "The endpoint issues real money refunds with no authentication or authorization check. Anyone who can reach it can refund any charge. Refunds must be gated to authenticated support staff with the right role, and ideally scoped/audited per operator.",
    },
    {
      id: "concurrent-over-refund",
      severity: 5,
      category: "correctness",
      description:
        "The read of prior refunds and the write of the new one are not atomic. Two concurrent partial refunds both read the same `alreadyRefunded`, both pass the check, and together exceed the charge — a check-then-act race that over-refunds. Needs row locking (SELECT ... FOR UPDATE on the charge) or a DB constraint enforcing sum(refunds) ≤ charge.amount.",
    },
    {
      id: "null-charge-crash",
      severity: 4,
      category: "correctness",
      description:
        "`charge` is used without a null check. An unknown :id makes findUnique return null and the next line (`charge.id`) throws, returning a 500 instead of a clean 404.",
    },
    {
      id: "no-amount-validation",
      severity: 4,
      category: "correctness",
      description:
        "`amount` is taken from the body with no validation — negative, zero, non-integer, or non-numeric values pass through. A negative amount could invert the refund logic; a float corrupts money. Validate it's a positive integer in minor units.",
    },
    {
      id: "not-idempotent",
      severity: 3,
      category: "correctness",
      description:
        "No idempotency key, so a retried request issues a second PSP refund and row. Support tools retry; partial refunds must dedupe on a client-supplied key.",
    },
    {
      id: "no-audit-record",
      severity: 3,
      category: "observability",
      description:
        "The brief explicitly wants an audit trail, but nothing records *who* issued the refund, when, or why. The refund row stores amount but no operator id / reason — the audit story is missing.",
    },
  ],
};
