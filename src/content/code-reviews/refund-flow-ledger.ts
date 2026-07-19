import type { CodeReviewExercise } from "./types";

export const refundFlowLedger: CodeReviewExercise = {
  slug: "refund-flow-ledger",
  title: "Refactor refund flow to use ledger entries",
  brief:
    "Finance flagged that monthly reconciliation between our ledger and the PSP's settlement report drifts since refunds went live. " +
    "This has the refund handler write a reversing ledger entry after a successful PSP refund so the books match. Review whether it closes the drift.",
  language: "TypeScript",
  minutes: 12,
  files: [
    {
      name: "refund.ts",
      code: `export async function refund(chargeId: string, amount: number) {
  const charge = await db.charge.findUnique({ where: { id: chargeId } });
  if (!charge) throw new Error("charge not found");

  // Issue the refund at the PSP
  const pspRefund = await psp.refund(charge.pspId, amount);

  // Write a reversing entry to our ledger
  await db.ledgerEntry.create({
    data: {
      account: charge.account,
      amount: amount,           // positive
      type: "refund",
      chargeId: charge.id,
    },
  });

  return pspRefund;
}`,
    },
  ],
  bugs: [
    {
      id: "not-atomic-psp-ledger",
      severity: 5,
      category: "correctness",
      description:
        "The PSP refund and the ledger write are two separate operations with no transaction spanning them. If the process crashes after psp.refund succeeds but before the ledgerEntry write, the money left the PSP but the ledger has no record — the exact reconciliation drift this is meant to fix. Needs the outbox pattern or a durable reversal record written before/with the PSP call and reconciled.",
    },
    {
      id: "reversal-sign-wrong",
      severity: 5,
      category: "correctness",
      description:
        "A refund is a *reversing* entry, so it must offset the original charge — the amount should be negative (a credit), not positive. Writing a positive 'refund' entry makes the ledger balance move the wrong way, corrupting the account balance and worsening reconciliation.",
    },
    {
      id: "no-refund-amount-validation",
      severity: 4,
      category: "correctness",
      description:
        "There's no check that `amount` is ≤ the charge amount minus already-refunded amounts. You can refund more than was charged, or refund a charge twice, over-refunding the customer. Must validate against remaining refundable balance.",
    },
    {
      id: "not-idempotent",
      severity: 4,
      category: "correctness",
      description:
        "No idempotency key. A retried refund request (client timeout, queue redelivery) issues a second PSP refund and a second ledger entry — double refund. The refund must be idempotent on a client key or a (chargeId, requestId) uniqueness constraint.",
    },
    {
      id: "float-amount",
      severity: 3,
      category: "correctness",
      description:
        "`amount: number` for money invites floating-point drift in the ledger. Monetary amounts should be integer minor units (or a decimal type), consistent with the rest of the ledger.",
    },
  ],
};
