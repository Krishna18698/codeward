/** Pattern metadata — the single source for both the sheets and the bank.
 *
 *  These are TECHNIQUES, not data structures. The old enum mixed the two:
 *  "ARRAYS" and "TREES" sat beside "TWO_POINTERS", so grouping by topic nested
 *  each structure inside itself ("Arrays > arrays") and 59% of problems carried
 *  no information about how to actually solve them. Every value here names a
 *  method you can recognise and apply.
 *
 *  - `cue`  — the recognition signal. What in the problem statement points here.
 *  - `description` — what the technique does, once you've spotted it.
 */
export type PatternMeta = { cue: string; description: string };

export const PATTERNS: Record<string, PatternMeta> = {
  // ── Arrays & hashing ──
  HASHING: {
    cue: "Membership, counting, or \"have I seen this before?\" in one pass.",
    description: "Trade space for time — a map or set turns a nested scan into a single pass.",
  },
  PREFIX_SUM: {
    cue: "Range sums, subarray sums, or a running total queried many times.",
    description: "Precompute cumulative totals so any range answers in O(1).",
  },
  KADANE: {
    cue: "The maximum or minimum sum/product of a CONTIGUOUS subarray.",
    description: "Carry the best run ending here, and reset whenever it stops helping.",
  },
  SORTING: {
    cue: "Order is the answer, or ordering first makes the rest trivial.",
    description: "Sort to expose adjacency, then solve in one linear pass.",
  },
  CYCLIC_SORT: {
    cue: "Values are 1..n and you need the missing or duplicated one, in O(1) space.",
    description: "Put each value at its own index; whatever sits in the wrong place is the answer.",
  },
  MATRIX: {
    cue: "A 2D grid traversed in place — layers, rotation, or marking rows and columns.",
    description: "Index arithmetic and in-place marking instead of a second grid.",
  },

  // ── Pointers & windows ──
  TWO_POINTERS: {
    cue: "A sorted array plus a target pair or triplet, or a sweep from both ends.",
    description: "Two indices moving towards or away from each other, cutting redundant comparisons.",
  },
  FAST_SLOW_POINTERS: {
    cue: "A cycle, the middle of a list, or the nth node from the end.",
    description: "Two pointers at different speeds — the gap between them is the answer.",
  },
  SLIDING_WINDOW: {
    cue: "The longest or shortest CONTIGUOUS run that satisfies some condition.",
    description: "Expand the window until it breaks the condition, then shrink from the left.",
  },

  // ── Stacks ──
  MONOTONIC_STACK: {
    cue: "\"Next greater\", \"previous smaller\", or spans in a histogram.",
    description: "A stack kept sorted — each element pops everything it dominates.",
  },
  STACK_SIMULATION: {
    cue: "Matching brackets, nested structure, or undo/most-recent semantics.",
    description: "Push context, pop when it closes; the stack IS the state.",
  },

  // ── Search ──
  BINARY_SEARCH: {
    cue: "A sorted input, or a monotonic \"is X feasible?\" you can answer yes/no on.",
    description: "Halve the search space each step — including over an answer range, not just an array.",
  },

  // ── Linked lists ──
  LINKED_LIST_REVERSAL: {
    cue: "Reversing, reordering, or rewiring pointers in place.",
    description: "Track prev/curr/next and relink as you walk — no extra storage.",
  },

  // ── Trees ──
  TREE_DFS: {
    cue: "Depth, paths, or an answer built from what the children return.",
    description: "Recurse to the leaves and combine results on the way back up.",
  },
  TREE_BFS: {
    cue: "Anything phrased per LEVEL — level order, right side view, minimum depth.",
    description: "A queue processed one full level at a time.",
  },
  BST: {
    cue: "A binary SEARCH tree, where the ordering invariant does the work.",
    description: "Left < node < right, so an inorder walk is sorted and search is O(h).",
  },
  TRIE: {
    cue: "Prefixes, autocomplete, or many words queried against each other.",
    description: "A character-per-edge tree, so shared prefixes are stored and searched once.",
  },

  // ── Graphs ──
  GRAPH_DFS: {
    cue: "Connected regions, flood fill, or exploring one path fully before backing out.",
    description: "Recurse or use an explicit stack, marking visited as you go.",
  },
  GRAPH_BFS: {
    cue: "Fewest steps, shortest path on an UNWEIGHTED graph, or spreading outwards.",
    description: "A queue expanding level by level — the first time you arrive is the shortest way.",
  },
  UNION_FIND: {
    cue: "Merging groups, or repeatedly asking \"are these two connected?\"",
    description: "Disjoint sets with path compression — near-constant union and find.",
  },
  TOPOLOGICAL_SORT: {
    cue: "Prerequisites, build order, or any \"A must come before B\" ordering.",
    description: "Repeatedly take nodes with no remaining dependencies; leftovers mean a cycle.",
  },
  SHORTEST_PATH: {
    cue: "A WEIGHTED graph — cheapest route, minimum cost to connect, or a delay time.",
    description: "Dijkstra, Bellman-Ford or an MST, depending on negative edges and what you're minimising.",
  },

  // ── Heaps, intervals, greedy ──
  TOP_K_HEAP: {
    cue: "Top-k, k-th largest, or a running median — you need the extreme, not a full sort.",
    description: "A heap of size k, so each element costs log k instead of a re-sort.",
  },
  INTERVALS: {
    cue: "Start/end pairs — overlaps, merging, meeting rooms, or minimum removals.",
    description: "Sort by start or end, then sweep and compare each interval to the last kept one.",
  },
  GREEDY: {
    cue: "A locally best choice at each step provably reaches the global best.",
    description: "Commit to the best immediate option and never reconsider — the hard part is proving it holds.",
  },

  // ── Recursion & DP ──
  BACKTRACKING: {
    cue: "Return ALL combinations, permutations or arrangements — you must enumerate, not count.",
    description: "Build a candidate, recurse, then undo the choice and try the next one.",
  },
  DP_1D: {
    cue: "Each state depends on a few earlier ones along a single axis.",
    description: "One array (or a couple of variables) filled in order — the sequence carries the answer.",
  },
  DP_2D: {
    cue: "Two sequences compared, or a grid where state depends on row AND column.",
    description: "A table over both dimensions; each cell is decided by its neighbours.",
  },
  DIVIDE_CONQUER: {
    cue: "Split in half, solve each half independently, merge the results.",
    description: "Recursion where the combine step does the real work — merge sort and its relatives.",
  },

  // ── Math, bits, design ──
  BIT_MANIPULATION: {
    cue: "Powers of two, XOR pairing, or a subset encoded into a single integer.",
    description: "Bitwise operators for constant space and constant-time set operations.",
  },
  MATH: {
    cue: "Digits, overflow, geometry, or a closed-form result with no data structure in sight.",
    description: "Number theory and arithmetic reasoning rather than traversal.",
  },
  DESIGN: {
    cue: "\"Implement a class that supports…\" with operations that must hit a time bound.",
    description: "Compose two structures so every required operation is O(1) or O(log n).",
  },
};

/** Display order — roughly the order they're worth learning in. */
export const PATTERN_ORDER = [
  "HASHING", "PREFIX_SUM", "KADANE", "SORTING", "CYCLIC_SORT", "MATRIX",
  "TWO_POINTERS", "FAST_SLOW_POINTERS", "SLIDING_WINDOW",
  "MONOTONIC_STACK", "STACK_SIMULATION",
  "BINARY_SEARCH",
  "LINKED_LIST_REVERSAL",
  "TREE_DFS", "TREE_BFS", "BST", "TRIE",
  "GRAPH_DFS", "GRAPH_BFS", "UNION_FIND", "TOPOLOGICAL_SORT", "SHORTEST_PATH",
  "TOP_K_HEAP", "INTERVALS", "GREEDY",
  "BACKTRACKING", "DP_1D", "DP_2D", "DIVIDE_CONQUER",
  "BIT_MANIPULATION", "MATH", "DESIGN",
];

export const patternRank = (p: string) => {
  const i = PATTERN_ORDER.indexOf(p);
  return i === -1 ? PATTERN_ORDER.length : i;
};

/** "SLIDING_WINDOW" -> "sliding window". Rendered with `capitalize`. */
export const patternLabel = (p: string) => {
  const special: Record<string, string> = {
    DP_1D: "1D dynamic programming",
    DP_2D: "2D dynamic programming",
    BST: "binary search tree",
    KADANE: "Kadane's algorithm",
    TOP_K_HEAP: "top-k with a heap",
    TREE_DFS: "tree DFS",
    TREE_BFS: "tree BFS",
    GRAPH_DFS: "graph DFS",
    GRAPH_BFS: "graph BFS",
    MATH: "math",
  };
  return special[p] ?? p.replace(/_/g, " ").toLowerCase();
};

/** Topics — the level above patterns.
 *
 *  A topic is where problems LIVE; a pattern is how you SOLVE them. Because the
 *  enum is now purely technique-level, no topic contains a member with its own
 *  name — the "Arrays > arrays" nesting is structurally impossible.
 */
export type Topic = { key: string; label: string; blurb: string; patterns: string[] };

export const TOPICS: Topic[] = [
  {
    key: "ARRAYS", label: "Arrays & Hashing",
    blurb: "Scanning, counting and precomputing over a flat sequence.",
    patterns: ["HASHING", "PREFIX_SUM", "KADANE", "SORTING", "CYCLIC_SORT", "MATRIX"],
  },
  {
    key: "POINTERS", label: "Pointers & Windows",
    blurb: "Two indices doing the work of a nested loop.",
    patterns: ["TWO_POINTERS", "FAST_SLOW_POINTERS", "SLIDING_WINDOW"],
  },
  {
    key: "STACKS", label: "Stacks",
    blurb: "Order-sensitive state, held on a stack instead of in a second pass.",
    patterns: ["MONOTONIC_STACK", "STACK_SIMULATION"],
  },
  {
    key: "SEARCH", label: "Binary Search",
    blurb: "Halving the search space — over an array, or over the answer itself.",
    patterns: ["BINARY_SEARCH"],
  },
  {
    key: "LISTS", label: "Linked Lists",
    blurb: "Pointer rewiring on a structure you can only walk forwards.",
    patterns: ["LINKED_LIST_REVERSAL"],
  },
  {
    key: "TREES", label: "Trees",
    blurb: "Recursion down, results combined on the way back up.",
    patterns: ["TREE_DFS", "TREE_BFS", "BST", "TRIE"],
  },
  {
    key: "GRAPHS", label: "Graphs",
    blurb: "Reachability, ordering and cost across a network of nodes.",
    patterns: ["GRAPH_DFS", "GRAPH_BFS", "UNION_FIND", "TOPOLOGICAL_SORT", "SHORTEST_PATH"],
  },
  {
    key: "GREEDY", label: "Heaps, Intervals & Greedy",
    blurb: "Ordering by the right key, then taking the best option at each step.",
    patterns: ["TOP_K_HEAP", "INTERVALS", "GREEDY"],
  },
  {
    key: "DP", label: "Recursion & DP",
    blurb: "Exhaustive search, and the caching that makes it tractable.",
    patterns: ["BACKTRACKING", "DP_1D", "DP_2D", "DIVIDE_CONQUER"],
  },
  {
    key: "MATH", label: "Math & Bits",
    blurb: "Arithmetic reasoning where no data structure is needed.",
    patterns: ["BIT_MANIPULATION", "MATH"],
  },
  {
    key: "DESIGN", label: "Design",
    blurb: "Composing structures so every operation hits its time bound.",
    patterns: ["DESIGN"],
  },
];

export const topicOf = (pattern: string): Topic =>
  TOPICS.find((t) => t.patterns.includes(pattern)) ?? TOPICS[TOPICS.length - 1];
