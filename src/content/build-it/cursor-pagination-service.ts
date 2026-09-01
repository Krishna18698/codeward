import type { BuildItProblem } from "./types";

export const cursorPaginationService: BuildItProblem = {
  slug: "cursor-pagination-service",
  title: "Cursor-Based Pagination Service",
  category: "api",
  brief:
    "The pagination layer behind a list API, across four stages: offset paging, opaque cursors stable under writes, " +
    "consistent paging under concurrent inserts/deletes, then bidirectional paging with filtering and non-unique sort " +
    "keys. Items have an int sortKey and a string id, totally ordered by (sortKey, id). Each stage breaks the last.",
  totalMinutes: 90,
  stages: [
    {
      stage: 1,
      title: "Offset pagination",
      constraintAdded: "None yet — this is the baseline.",
      narrative:
        "A list endpoint returns items in a stable order (by sortKey, ties broken by id) and clients page through them. " +
        "The simplest scheme is offset/limit: skip offset items, return the next limit. Single thread, static data. This " +
        "baseline exists so the cursor design (stage 2) and concurrency (stage 3) have something concrete to break.",
      prompt:
        "Implement add(id, sortKey) to insert an item and pageOffset(offset, limit) returning the ids of items in total " +
        "order (sortKey ascending, ties broken by id ascending), skipping offset and taking up to limit. Return fewer " +
        "than limit (or empty) near/after the end.",
      skeletons: {
        csharp: {
          fileName: "Pagination.cs",
          code: `public class PaginationService
{
    // TODO: keep items totally ordered by (sortKey, id)

    public void Add(string id, int sortKey)
    {
        // TODO: insert keeping the (sortKey, id) order
        throw new NotImplementedException();
    }

    public List<string> PageOffset(int offset, int limit)
    {
        // TODO: skip offset items in order, return up to limit ids
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "pagination.py",
          code: `class PaginationService:
    def __init__(self):
        self._items: list[tuple[int, str]] = []  # (sortKey, id), kept ordered

    def add(self, id: str, sort_key: int) -> None:
        # TODO: insert keeping the (sortKey, id) order
        raise NotImplementedError

    def page_offset(self, offset: int, limit: int) -> list[str]:
        # TODO: skip offset items in order, return up to limit ids
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "Pagination.kt",
          code: `class PaginationService {
    // TODO: keep items totally ordered by (sortKey, id)

    fun add(id: String, sortKey: Int) {
        // TODO: insert keeping the (sortKey, id) order
        TODO()
    }

    fun pageOffset(offset: Int, limit: Int): List<String> {
        // TODO: skip offset items in order, return up to limit ids
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "total-order", description: "Items are returned in a total order by sortKey ascending, ties broken deterministically by id.", weight: 40 },
        { id: "offset-limit", description: "pageOffset skips exactly offset items and returns at most limit.", weight: 35 },
        { id: "end-handling", description: "Paging at or past the end returns the remaining items or an empty list, never an error.", weight: 25 },
      ],
      canonicalApproach:
        "Keep items sorted by the (sortKey, id) tuple (insert in order, or sort on read). pageOffset returns the slice " +
        "[offset, offset+limit). The tie-break on id is what makes the order total — without it, items with equal sortKeys " +
        "have no defined position, which quietly breaks paging (and becomes central in stage 4).",
      commonPitfalls: [
        "Ordering by sortKey only, leaving equal-sortKey items in an arbitrary/unstable order so pages overlap or drop them.",
        "Off-by-one on the slice bounds (returning limit+1 items, or starting at offset-1).",
        "Throwing when offset is past the end instead of returning an empty page.",
      ],
      tests: {
        python: `# --- tests (read-only) ---
def _run():
    svc = PaginationService()
    for sk, i in [(1, "a"), (2, "b"), (3, "c"), (4, "d"), (5, "e")]:
        svc.add(i, sk)
    assert svc.page_offset(0, 2) == ["a", "b"], "first page"
    assert svc.page_offset(2, 2) == ["c", "d"], "second page"
    assert svc.page_offset(4, 2) == ["e"], "partial last page"
    assert svc.page_offset(6, 2) == [], "past the end is empty"
    # insertion order doesn't matter — total order does
    svc.add("aa", 1)
    assert svc.page_offset(0, 2) == ["a", "aa"], "id breaks the sortKey=1 tie"
    print("__BUILD_IT_PASS__")

_run()`,
        kotlin: `// --- tests (read-only) ---
fun main() {
    val svc = PaginationService()
    for ((sk, i) in listOf(1 to "a", 2 to "b", 3 to "c", 4 to "d", 5 to "e")) svc.add(i, sk)
    check(svc.pageOffset(0, 2) == listOf("a", "b")) { "first page" }
    check(svc.pageOffset(2, 2) == listOf("c", "d")) { "second page" }
    check(svc.pageOffset(4, 2) == listOf("e")) { "partial last page" }
    check(svc.pageOffset(6, 2) == emptyList<String>()) { "past the end is empty" }
    svc.add("aa", 1)
    check(svc.pageOffset(0, 2) == listOf("a", "aa")) { "id breaks the sortKey=1 tie" }
    println("__BUILD_IT_PASS__")
}`,
        csharp: `// --- tests (read-only) ---
class TestRunner
{
    static void Check(bool cond, string msg) { if (!cond) throw new Exception("FAILED: " + msg); }
    static bool Eq(List<string> a, params string[] b)
    {
        if (a.Count != b.Length) return false;
        for (int i = 0; i < b.Length; i++) if (a[i] != b[i]) return false;
        return true;
    }
    static void Main()
    {
        var svc = new PaginationService();
        svc.Add("a", 1); svc.Add("b", 2); svc.Add("c", 3); svc.Add("d", 4); svc.Add("e", 5);
        Check(Eq(svc.PageOffset(0, 2), "a", "b"), "first page");
        Check(Eq(svc.PageOffset(2, 2), "c", "d"), "second page");
        Check(Eq(svc.PageOffset(4, 2), "e"), "partial last page");
        Check(Eq(svc.PageOffset(6, 2)), "past the end is empty");
        svc.Add("aa", 1);
        Check(Eq(svc.PageOffset(0, 2), "a", "aa"), "id breaks the sortKey=1 tie");
        Console.WriteLine("__BUILD_IT_PASS__");
    }
}`,
      },
    },
    {
      stage: 2,
      title: "Opaque cursors, stable under writes",
      constraintAdded: "Items are inserted/removed between page fetches; paging must not skip or duplicate.",
      narrative:
        "Offset paging breaks the moment the data changes between fetches: insert an item before the reader's position and " +
        "offset N now points one item earlier, so the next page repeats a row; delete one and a row is skipped. The fix is " +
        "a cursor that encodes WHERE you are in the total order — the last item you saw — not HOW MANY you've skipped. The " +
        "next page is 'everything strictly after this (sortKey, id)'.",
      prompt:
        "Implement pageAfter(cursor, limit) returning up to limit items strictly after the cursor in (sortKey, id) order, " +
        "plus a nextCursor to pass to the following call. A null/empty cursor starts from the beginning; nextCursor is the " +
        "cursor of the last returned item (null when the page is empty). Encode the cursor as an opaque token carrying the " +
        "(sortKey, id) of the last item. Inserting or deleting items elsewhere must not make a cursor skip or repeat rows.",
      skeletons: {
        csharp: {
          fileName: "Pagination.cs",
          code: `public class Page
{
    public List<string> Ids;
    public string NextCursor;
    public Page(List<string> ids, string nextCursor) { Ids = ids; NextCursor = nextCursor; }
}

public class PaginationService
{
    // ...ordered items from stage 1...

    public void Add(string id, int sortKey) { throw new NotImplementedException(); }

    public Page PageAfter(string cursor, int limit)
    {
        // TODO: decode cursor -> (sortKey, id) or start. Return up to limit
        // items strictly greater than it in (sortKey, id) order, plus the cursor
        // of the last returned item (null if the page is empty).
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "pagination.py",
          code: `from typing import Optional

class PaginationService:
    def __init__(self):
        self._items: list[tuple[int, str]] = []  # (sortKey, id), kept ordered

    def add(self, id: str, sort_key: int) -> None:
        ...  # as stage 1

    def page_after(self, cursor: Optional[str], limit: int) -> tuple[list[str], Optional[str]]:
        # TODO: decode cursor -> (sortKey, id) or start. Return up to limit
        # items strictly greater than it in (sortKey, id) order, plus the cursor
        # of the last returned item (None if the page is empty).
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "Pagination.kt",
          code: `data class Page(val ids: List<String>, val nextCursor: String?)

class PaginationService {
    // ...ordered items from stage 1...

    fun add(id: String, sortKey: Int) { TODO() }

    fun pageAfter(cursor: String?, limit: Int): Page {
        // TODO: decode cursor -> (sortKey, id) or start. Return up to limit
        // items strictly greater than it in (sortKey, id) order, plus the cursor
        // of the last returned item (null if the page is empty).
        TODO()
    }
}`,
        },
      },
      tests: {
        python: `# --- tests (read-only) ---
def _run():
    svc = PaginationService()
    for sk, i in [(1, "a"), (2, "b"), (3, "c"), (4, "d"), (5, "e")]:
        svc.add(i, sk)
    ids, cur = svc.page_after(None, 2)
    assert ids == ["a", "b"], "first page"
    # insert an item BEFORE the reader's position: offset paging would now repeat
    svc.add("z", 0)
    ids2, cur2 = svc.page_after(cur, 2)
    assert ids2 == ["c", "d"], "cursor continues after b despite the insert"
    # delete an already-seen item: still no skip
    ids3, cur3 = svc.page_after(cur2, 2)
    assert ids3 == ["e"], "last page, nothing skipped or duplicated"
    ids4, cur4 = svc.page_after(cur3, 2)
    assert ids4 == [] and cur4 is None, "end of list"
    print("__BUILD_IT_PASS__")

_run()`,
        kotlin: `// --- tests (read-only) ---
fun main() {
    val svc = PaginationService()
    for ((sk, i) in listOf(1 to "a", 2 to "b", 3 to "c", 4 to "d", 5 to "e")) svc.add(i, sk)
    val p1 = svc.pageAfter(null, 2)
    check(p1.ids == listOf("a", "b")) { "first page" }
    svc.add("z", 0)
    val p2 = svc.pageAfter(p1.nextCursor, 2)
    check(p2.ids == listOf("c", "d")) { "cursor continues after b despite the insert" }
    val p3 = svc.pageAfter(p2.nextCursor, 2)
    check(p3.ids == listOf("e")) { "last page, nothing skipped or duplicated" }
    val p4 = svc.pageAfter(p3.nextCursor, 2)
    check(p4.ids == emptyList<String>() && p4.nextCursor == null) { "end of list" }
    println("__BUILD_IT_PASS__")
}`,
        csharp: `// --- tests (read-only) ---
class TestRunner
{
    static void Check(bool cond, string msg) { if (!cond) throw new Exception("FAILED: " + msg); }
    static bool Eq(List<string> a, params string[] b)
    {
        if (a.Count != b.Length) return false;
        for (int i = 0; i < b.Length; i++) if (a[i] != b[i]) return false;
        return true;
    }
    static void Main()
    {
        var svc = new PaginationService();
        svc.Add("a", 1); svc.Add("b", 2); svc.Add("c", 3); svc.Add("d", 4); svc.Add("e", 5);
        var p1 = svc.PageAfter(null, 2);
        Check(Eq(p1.Ids, "a", "b"), "first page");
        svc.Add("z", 0);
        var p2 = svc.PageAfter(p1.NextCursor, 2);
        Check(Eq(p2.Ids, "c", "d"), "cursor continues after b despite the insert");
        var p3 = svc.PageAfter(p2.NextCursor, 2);
        Check(Eq(p3.Ids, "e"), "last page, nothing skipped or duplicated");
        var p4 = svc.PageAfter(p3.NextCursor, 2);
        Check(Eq(p4.Ids) && p4.NextCursor == null, "end of list");
        Console.WriteLine("__BUILD_IT_PASS__");
    }
}`,
      },
      rubric: [
        { id: "cursor-encodes-position", description: "The cursor carries the (sortKey, id) of the last seen item — a position in the total order, not a numeric offset/count.", weight: 35 },
        { id: "strictly-after", description: "pageAfter returns items strictly greater than the cursor's (sortKey, id), so the boundary item is neither repeated nor skipped.", weight: 40 },
        { id: "stable-under-writes", description: "Inserts/deletes elsewhere don't cause the next page to skip or duplicate rows (the defining advantage over offset paging).", weight: 25 },
      ],
      canonicalApproach:
        "Encode the cursor as the last item's (sortKey, id) — e.g. an opaque token like base64(\"sortKey:id\"). pageAfter " +
        "decodes it and returns items whose (sortKey, id) tuple is strictly greater, via a binary search (bisect-right on " +
        "the tuple) for O(log n) seek then a slice of limit. Because the cursor names a position rather than a count, an " +
        "insert or delete anywhere else just changes which items exist after that position — never which item the cursor " +
        "points at — so pages never overlap or gap.",
      commonPitfalls: [
        "Encoding the offset/index into the cursor, which reintroduces the exact skip/duplicate bug cursors exist to fix.",
        "Using >= instead of > on the boundary, so the last item of the previous page reappears as the first of the next.",
        "Cursoring on sortKey alone; when sortKeys aren't unique the boundary is ambiguous and rows get skipped (the tuple with id fixes it — central in stage 4).",
      ],
    },
    {
      stage: 3,
      title: "Consistent paging under concurrent writes",
      constraintAdded: "Reads and writes happen concurrently across many threads during a scan.",
      narrative:
        "Now the collection is mutated by writer threads while readers page through it. Two hazards appear. Concurrency: a " +
        "pageAfter that binary-searches and slices while a writer is inserting can read a torn structure (a mid-resize " +
        "array, a half-linked node). Consistency: even with each call made safe, we must be able to state exactly what " +
        "guarantee a full scan gives when the data changes underneath it. This is the make-or-break stage.",
      prompt:
        "Make add and pageAfter safe under concurrent access, and state precisely the scan guarantee you provide. Defend " +
        "this invariant: given the stable total order on (sortKey, id), a forward cursor scan returns every item that " +
        "exists for the entire scan exactly once, and never returns an item twice — regardless of concurrent inserts and " +
        "deletes (items added/removed mid-scan may or may not appear, but nothing stable is skipped or duplicated). Discuss " +
        "your synchronisation (lock vs. copy-on-write snapshot) and its read/write tradeoff.",
      invariant:
        "Under the fixed total order on (sortKey, id): across a forward scan by cursor, any item present for the whole scan " +
        "is returned exactly once and never more than once. Each pageAfter observes a consistent ordered structure (never a " +
        "torn/partial state), and the strictly-after cursor boundary guarantees no overlap or gap between consecutive pages.",
      skeletons: {
        csharp: {
          fileName: "Pagination.cs",
          code: `using System.Threading;

public class Page
{
    public List<string> Ids;
    public string NextCursor;
    public Page(List<string> ids, string nextCursor) { Ids = ids; NextCursor = nextCursor; }
}

public class PaginationService
{
    private readonly ReaderWriterLockSlim _lock = new();
    // ...ordered items from stages 1-2...

    public void Add(string id, int sortKey)
    {
        // TODO: mutate the ordered structure so no concurrent PageAfter sees a
        // torn state
        throw new NotImplementedException();
    }

    public Page PageAfter(string cursor, int limit)
    {
        // TODO: read a consistent ordered snapshot; strictly-after slice.
        // Defend the exactly-once scan invariant.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "pagination.py",
          code: `import threading
from typing import Optional

class PaginationService:
    def __init__(self):
        self._items: list[tuple[int, str]] = []
        self._lock = threading.RLock()

    def add(self, id: str, sort_key: int) -> None:
        # TODO: mutate the ordered structure so no concurrent page_after sees a
        # torn state
        raise NotImplementedError

    def page_after(self, cursor: Optional[str], limit: int) -> tuple[list[str], Optional[str]]:
        # TODO: read a consistent ordered snapshot; strictly-after slice.
        # Defend the exactly-once scan invariant.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "Pagination.kt",
          code: `import java.util.concurrent.locks.ReentrantReadWriteLock

data class Page(val ids: List<String>, val nextCursor: String?)

class PaginationService {
    private val lock = ReentrantReadWriteLock()
    // ...ordered items from stages 1-2...

    fun add(id: String, sortKey: Int) {
        // TODO: mutate the ordered structure so no concurrent pageAfter sees a
        // torn state
        TODO()
    }

    fun pageAfter(cursor: String?, limit: Int): Page {
        // TODO: read a consistent ordered snapshot; strictly-after slice.
        // Defend the exactly-once scan invariant.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "consistent-read", description: "Each pageAfter reads a complete, internally-consistent ordered structure — never a mid-mutation torn state (via a read lock or an immutable snapshot swapped atomically by writers).", weight: 25 },
        { id: "safe-writes", description: "add mutates the ordered structure under mutual exclusion (or by building and swapping a new snapshot), so concurrent writers don't corrupt the ordering.", weight: 25 },
        { id: "invariant", description: "The candidate states the exactly-once forward-scan guarantee and argues why the strictly-after cursor plus consistent reads prevents skips/duplicates for items stable across the scan, being explicit about what happens to items inserted/deleted mid-scan.", weight: 50 },
      ],
      canonicalApproach:
        "Reads dominate, so a read-write lock (readers share, writers exclusive) or copy-on-write (writers build a new " +
        "immutable sorted snapshot and atomically swap a reference; readers use whatever snapshot is current, lock-free) " +
        "both give each pageAfter a consistent view. The exactly-once guarantee comes from the cursor semantics, not from " +
        "locking the whole scan: because the cursor is a strictly-greater (sortKey, id) boundary and the order is stable, an " +
        "item that exists throughout is passed exactly once — it's either before the current boundary (already returned) or " +
        "after it (yet to come), never both. Items inserted/deleted mid-scan may or may not be seen, which is the accepted " +
        "semantics; you don't hold a lock across the client's think-time between pages.",
      commonPitfalls: [
        "Trying to give a 'stable snapshot for the whole scan' by holding a lock across pages — the client controls the pace between pages, so you'd pin the structure indefinitely.",
        "A concurrent list whose individual ops are safe but whose binary-search-then-slice spans multiple ops, so a write between them yields a torn read.",
        "Overclaiming that mid-scan inserts are always seen (or never seen); the honest guarantee is only about items stable for the whole scan.",
      ],
    },
    {
      stage: 4,
      title: "Bidirectional paging, filters, and non-unique sort keys",
      constraintAdded: "Page backwards too, apply filters, and handle many items sharing a sortKey.",
      narrative:
        "Product wants three things the cursor design must now absorb: paging backwards (a Previous button), filtering (only " +
        "items matching a predicate), and correct behaviour when many items share the same sortKey (e.g. sorting by a " +
        "coarse timestamp). Non-unique sortKeys are where naive cursors quietly corrupt — the (sortKey, id) tuple is exactly " +
        "what makes the boundary unambiguous, and this stage leans on it.",
      prompt:
        "Add pageBefore(cursor, limit) returning the limit items immediately BEFORE the cursor in order (for backward " +
        "paging), and an optional filter predicate applied to both directions. Ensure correctness when sortKeys collide: " +
        "the (sortKey, id) tuple must fully order tied items so forward+backward paging over them neither skips nor " +
        "duplicates. Describe how you keep pageBefore's result in forward order and how filtering interacts with limit " +
        "(you must return up to limit MATCHING items, scanning past non-matching ones).",
      skeletons: {
        csharp: {
          fileName: "Pagination.cs",
          code: `public class PaginationService
{
    // ...thread-safe ordered items from stage 3...

    public Page PageBefore(string cursor, int limit, Func<string, bool> filter)
    {
        // TODO: the limit items immediately before the cursor in (sortKey, id)
        // order that match filter, returned in forward order.
        throw new NotImplementedException();
    }

    public Page PageAfter(string cursor, int limit, Func<string, bool> filter)
    {
        // TODO: as stage 3 but skipping items that fail filter, still returning
        // up to limit MATCHING items.
        throw new NotImplementedException();
    }
}`,
        },
        python: {
          fileName: "pagination.py",
          code: `from typing import Optional, Callable

class PaginationService:
    # ...thread-safe ordered items from stage 3...

    def page_before(self, cursor: Optional[str], limit: int,
                    filter_fn: Optional[Callable[[str], bool]] = None) -> tuple[list[str], Optional[str]]:
        # TODO: the limit items immediately before the cursor in (sortKey, id)
        # order that match filter_fn, returned in forward order.
        raise NotImplementedError

    def page_after(self, cursor: Optional[str], limit: int,
                   filter_fn: Optional[Callable[[str], bool]] = None) -> tuple[list[str], Optional[str]]:
        # TODO: as stage 3 but skipping items that fail filter_fn, still returning
        # up to limit MATCHING items.
        raise NotImplementedError`,
        },
        kotlin: {
          fileName: "Pagination.kt",
          code: `class PaginationService {
    // ...thread-safe ordered items from stage 3...

    fun pageBefore(cursor: String?, limit: Int, filter: (String) -> Boolean = { true }): Page {
        // TODO: the limit items immediately before the cursor in (sortKey, id)
        // order that match filter, returned in forward order.
        TODO()
    }

    fun pageAfter(cursor: String?, limit: Int, filter: (String) -> Boolean = { true }): Page {
        // TODO: as stage 3 but skipping items that fail filter, still returning
        // up to limit MATCHING items.
        TODO()
    }
}`,
        },
      },
      rubric: [
        { id: "backward-paging", description: "pageBefore returns the items immediately before the cursor, in forward order, forming a clean inverse of pageAfter (a Previous that lands exactly where you came from).", weight: 30 },
        { id: "tuple-ordering-under-ties", description: "The full (sortKey, id) order disambiguates items sharing a sortKey, so forward/backward paging over a run of tied items neither skips nor duplicates.", weight: 40 },
        { id: "filter-with-limit", description: "Filtering returns up to limit MATCHING items by scanning past non-matching ones, rather than filtering a fixed-size page down to fewer results.", weight: 30 },
      ],
      canonicalApproach:
        "pageBefore is the mirror of pageAfter: binary-search the cursor tuple, walk backward collecting up to limit " +
        "matching items, then reverse so the result is in forward order and the returned cursor is the first item's tuple. " +
        "The (sortKey, id) tuple is the linchpin for ties — comparing on the tuple gives a strict total order even when " +
        "sortKeys repeat, so 'strictly after' and 'strictly before' remain unambiguous across a run of equal sortKeys. " +
        "Filtering means limit counts matching items: keep scanning in the paging direction, testing the predicate, until " +
        "you have limit matches or you hit the end — never just filter one fixed slice, which would return short pages.",
      commonPitfalls: [
        "Comparing on sortKey alone for the boundary; with duplicate sortKeys the cursor is ambiguous and tied items get skipped or repeated.",
        "Returning pageBefore results in reverse order, so the Previous page renders upside-down.",
        "Applying the filter after slicing a limit-sized page, so a page with mostly non-matching items comes back nearly empty instead of full.",
      ],
    },
  ],
};
