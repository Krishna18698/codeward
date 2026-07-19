import type { CodeReviewExercise } from "./types";

export const ordersListingV2: CodeReviewExercise = {
  slug: "orders-listing-v2",
  title: "Add v2 orders listing endpoint",
  brief:
    "Customers want a v2 of the orders listing API — v1's response shape was painful to evolve. This mirrors v1's behavior with cleaner field names. " +
    "Tagging you for the once-over before partner docs go out.",
  language: "TypeScript",
  minutes: 12,
  files: [
    {
      name: "orders-v2.ts",
      code: `router.get("/v2/orders", async (req, res) => {
  const page = req.query.page || 1;
  const orders = await db.order.findMany({
    where: { accountId: req.account.id },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * 50,
    take: 50,
  });

  res.json(orders.map((o) => ({
    id: o.id,
    total: o.totalCents / 100,
    status: o.status,
    createdAt: o.createdAt,
    internalNotes: o.internalNotes,
  })));
});`,
    },
  ],
  bugs: [
    {
      id: "leaks-internal-field",
      severity: 5,
      category: "security",
      description:
        "`internalNotes` is exposed in a customer-facing, partner-documented API response. Internal fields must never be serialized to external clients — this leaks operational/PII data. The v2 shape should be an explicit allowlist of public fields.",
    },
    {
      id: "offset-pagination-string",
      severity: 4,
      category: "correctness",
      description:
        "`req.query.page` is a string; `(page - 1) * 50` does string arithmetic that coerces unpredictably (e.g. '2' works by luck, but '2abc' → NaN → skip NaN). Parse and validate page as a positive integer. More broadly, offset pagination on a large, growing table is slow and can skip/duplicate rows as data changes — cursor (keyset) pagination is the right choice for a v2 you're locking in.",
    },
    {
      id: "float-money-rounding",
      severity: 4,
      category: "correctness",
      description:
        "`o.totalCents / 100` converts integer cents to a floating-point dollar amount in the response — reintroducing the money-as-float problem at the API boundary (e.g. 1999 → 19.99 is fine, but sums and some values drift). Return integer minor units, or a string decimal, in the documented shape.",
    },
    {
      id: "unbounded-page-size",
      severity: 3,
      category: "api-design",
      description:
        "Page size is hardcoded to 50 with no client control and no documented max — but there's no validation that page isn't absurdly large (deep offsets scan huge ranges). A v2 API should define page-size limits and a max, and reject out-of-range values.",
    },
    {
      id: "no-total-or-next-cursor",
      severity: 2,
      category: "api-design",
      description:
        "The response is a bare array with no pagination metadata (total count, next cursor, or has-more). Partners can't tell when they've reached the end. A listing API should return a paged envelope.",
    },
  ],
};
