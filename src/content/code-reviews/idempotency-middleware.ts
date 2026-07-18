import type { CodeReviewExercise } from "./types";

export const idempotencyMiddleware: CodeReviewExercise = {
  slug: "idempotency-middleware",
  title: "Add idempotency middleware to the charge API",
  brief:
    "Support flagged three customers double-charged when the mobile app retried after a flaky network. " +
    "We're adding an Idempotency-Key header + middleware so retries return the original response instead of re-charging. " +
    "Review for production-readiness before we route real traffic through it.",
  language: "TypeScript",
  minutes: 12,
  files: [
    {
      name: "idempotency.ts",
      code: `import type { Request, Response, NextFunction } from "express";
import { psp } from "./psp-client";

// Cache of idempotency-key -> response body
const store: Record<string, unknown> = {};

export async function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const key = req.headers["idempotency-key"] as string;

  if (store[key]) {
    // Seen this key before — replay the stored response
    res.status(200).json(store[key]);
    return;
  }

  next();
}

export async function chargeHandler(req: Request, res: Response) {
  const key = req.headers["idempotency-key"] as string;
  const amount = parseFloat(req.body.amount);

  try {
    const result = await psp.charge({
      amount: amount * 100, // convert to cents
      currency: req.body.currency,
      source: req.body.source,
    });

    store[key] = result;
    res.status(200).json(result);
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
}`,
    },
  ],
  bugs: [
    {
      id: "race-window",
      severity: 5,
      category: "correctness",
      description:
        "Check-then-act race: two concurrent requests with the same key both miss the store (neither has written yet) and both call psp.charge — the exact double-charge this PR is meant to prevent. The key must be reserved atomically before charging.",
    },
    {
      id: "in-memory-store",
      severity: 4,
      category: "correctness",
      description:
        "The store is an in-process object: all idempotency state is lost on restart/deploy, and it isn't shared across instances — a retry landing on another pod re-charges. Must be durable shared storage (Postgres/Redis).",
    },
    {
      id: "float-money",
      severity: 4,
      category: "correctness",
      description:
        "parseFloat + `amount * 100` uses binary floating point for money — 19.99 * 100 = 1998.9999…, and rounding differences will drift charges/refunds. Amounts must be integer minor units end-to-end.",
    },
    {
      id: "missing-key-validation",
      severity: 3,
      category: "api-design",
      description:
        "No validation that the Idempotency-Key header exists (undefined key means every keyless request shares the store entry `undefined`) or that it's well-formed/bounded. Missing key should be a 400.",
    },
    {
      id: "store-only-on-success",
      severity: 3,
      category: "correctness",
      description:
        "The key is written only after a successful charge. If the PSP call succeeds but the process crashes before store[key] = result, the retry re-charges. Reserve the key as pending before calling the PSP, then finalize.",
    },
    {
      id: "unbounded-store",
      severity: 2,
      category: "performance",
      description:
        "Keys are never expired or evicted — memory grows without bound (and in a real store, storage). Idempotency records need a TTL (e.g. 24h).",
    },
  ],
};
