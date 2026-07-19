import type { BugHuntExercise } from "./types";

export const deadlockInventory: BugHuntExercise = {
  slug: "deadlock-inventory",
  title: "Two orders deadlock updating inventory",
  brief:
    "Concurrent orders that touch the same two SKUs occasionally hang until the database kills one with a deadlock error. " +
    "It's rare and only under load. Find why two orders can deadlock each other.",
  language: "TypeScript",
  minutes: 13,
  files: [
    {
      name: "reserve.ts",
      code: `export async function reserveItems(orderId: string, items: Item[]) {
  return db.transaction(async (tx) => {
    // Lock and decrement each SKU's stock, in the order they appear on the order
    for (const item of items) {
      await tx.query(
        "SELECT stock FROM inventory WHERE sku = $1 FOR UPDATE",
        [item.sku],
      );
      await tx.query(
        "UPDATE inventory SET stock = stock - $1 WHERE sku = $2",
        [item.qty, item.sku],
      );
    }
    await tx.query(
      "INSERT INTO reservations (order_id, items) VALUES ($1, $2)",
      [orderId, JSON.stringify(items)],
    );
  });
}`,
    },
  ],
  testOutput: `=== RUN   TestConcurrentReservations
--- FAIL: deadlock under concurrent orders (6.02s)
    order A items: [SKU-77, SKU-12]
    order B items: [SKU-12, SKU-77]
    ERROR: deadlock detected
    DETAIL: Process A waits for ShareLock on SKU-12; blocked by Process B.
            Process B waits for ShareLock on SKU-77; blocked by Process A.
    HINT: transaction A was rolled back`,
  rootCause:
    "The transaction locks SKUs in the order they appear on the order (`FOR UPDATE` per row, in array order), and different orders list their items in different orders. Order A locks SKU-77 then waits for SKU-12; Order B locks SKU-12 then waits for SKU-77. Each holds what the other needs — a classic lock-ordering deadlock (circular wait). It's rare because it only triggers when two orders touch the same SKUs in opposite relative order and interleave.",
  category: "concurrency",
  ruledOut: [
    "The database is overloaded — no; the DB correctly detects the deadlock and kills one transaction. The bug is in the application's lock acquisition order, not DB capacity.",
    "The transaction is too long — shortening it reduces the window but doesn't remove the circular wait; even a fast transaction can deadlock if the lock order differs.",
    "FOR UPDATE is the wrong lock — the lock type is fine; the problem is acquiring multiple locks in an inconsistent order across transactions.",
  ],
  canonicalFix:
    "Impose a consistent global lock order. Sort the items by SKU (a total order, e.g. lexicographic) before locking, so every transaction acquires locks in the same sequence. With a consistent order, a circular wait is impossible — the classic prevention for the four Coffman deadlock conditions. `items.sort((a,b) => a.sku.localeCompare(b.sku))` before the loop.",
};
