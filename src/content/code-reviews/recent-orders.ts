import type { CodeReviewExercise } from "./types";

export const recentOrders: CodeReviewExercise = {
  slug: "recent-orders",
  title: "Add recent-orders to the profile page",
  brief:
    "The profile page wants a 'recent orders' section — the user's last 10 orders with line items and product info. Hooked up to the existing repos. " +
    "Quick review before it goes on the profile.",
  language: "TypeScript",
  minutes: 10,
  files: [
    {
      name: "recent-orders.ts",
      code: `export async function recentOrders(userId: string) {
  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const result = [];
  for (const order of orders) {
    const items = await db.lineItem.findMany({ where: { orderId: order.id } });
    for (const item of items) {
      item.product = await db.product.findUnique({ where: { id: item.productId } });
    }
    result.push({ ...order, items });
  }
  return result;
}`,
    },
  ],
  bugs: [
    {
      id: "n-plus-one",
      severity: 4,
      category: "performance",
      description:
        "Classic N+1 (actually N+M): 1 query for orders, then 1 per order for its line items, then 1 per line item for its product. Ten orders with a few items each is dozens of sequential queries. Use a single query with includes/joins (Prisma `include: { items: { include: { product: true } } }`) or batch the product lookups.",
    },
    {
      id: "no-product-dedup",
      severity: 3,
      category: "performance",
      description:
        "The same product appears across many line items but is fetched fresh every time — no batching or caching of product lookups. Even without fixing the full N+1, products should be fetched once per distinct id (a single `findMany where id in [...]`).",
    },
    {
      id: "unbounded-items",
      severity: 2,
      category: "performance",
      description:
        "There's no bound on line items per order — a pathological order with thousands of items balloons the response and the per-item product loop. Consider limiting or paginating line items for the profile summary view.",
    },
    {
      id: "sequential-not-parallel",
      severity: 2,
      category: "performance",
      description:
        "Even keeping the per-order structure, the loops are fully sequential — each awaited in turn. The independent per-order fetches could at least run concurrently with Promise.all, though eliminating the N+1 is the real fix.",
    },
  ],
};
