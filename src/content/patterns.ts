/** Pattern metadata — the single source for the sheets and the bank.
 *
 *  The vocabulary is not invented here. It is the 41-pattern LeetCode taxonomy
 *  from github.com/Automedon/ultimate-leetcode-patterns, which maps 632 problems
 *  to patterns; our problems are matched to it by LeetCode slug. SHORTEST_PATH
 *  is the single addition — that list has no weighted-graph value and we have
 *  six problems that need one.
 *
 *  These are TECHNIQUES. "ARRAYS" and "TREES" are topics — where a problem
 *  lives, not how you solve it — and live in TOPICS below instead.
 *
 *  - `cue`  — the recognition signal: what in the statement points here.
 *  - `description` — what the technique does once you've spotted it.
 */
export type PatternMeta = { cue: string; description: string };

export const PATTERNS: Record<string, PatternMeta> = {
  HASH_MAP: {
    cue: "Membership, counting, or \"have I seen this before?\" in one pass.",
    description: "A map or set trades space for time — a nested scan becomes a single pass.",
  },
  PREFIX_SUM: {
    cue: "Range sums, subarray sums, or a cumulative total queried repeatedly.",
    description: "Precompute running totals so any range answers in O(1).",
  },
  SORTING: {
    cue: "Ordering first makes the rest of the problem trivial.",
    description: "Sort to expose adjacency, then solve in one linear pass.",
  },
  CYCLIC_SORT: {
    cue: "Values are 1..n and you need the missing or duplicated one in O(1) space.",
    description: "Put each value at its own index; whatever sits wrong is the answer.",
  },
  SIMULATION: {
    cue: "Follow the stated rules exactly — rearrange, rotate, or step through.",
    description: "No clever trick; the difficulty is doing it in place and off by none.",
  },
  MATRIX_TRAVERSAL: {
    cue: "A 2D grid walked in layers, spirals, or marked in place.",
    description: "Index arithmetic instead of a second grid.",
  },
  STRING_PARSING: {
    cue: "Building, splitting or validating a string character by character.",
    description: "Careful scanning with an accumulator — most bugs are edge cases.",
  },
  STRING_MATCHING: {
    cue: "Finding a pattern inside a string, or comparing two strings.",
    description: "Prefix functions and rolling hashes beat re-scanning.",
  },
  TWO_POINTERS: {
    cue: "A sorted array plus a target pair or triplet, or a sweep from both ends.",
    description: "Two indices moving towards or away from each other, cutting comparisons.",
  },
  SLIDING_WINDOW: {
    cue: "The longest or shortest CONTIGUOUS run satisfying a condition.",
    description: "Expand until the condition breaks, then shrink from the left.",
  },
  SLIDING_WINDOW_MAX: {
    cue: "The max or min WITHIN each window as it slides.",
    description: "A monotonic deque holds the candidates, so each element is seen twice.",
  },
  BINARY_SEARCH: {
    cue: "A sorted input, or a monotonic \"is X feasible?\" you can answer yes/no on.",
    description: "Halve the space each step — including over an answer range, not just an array.",
  },
  STACK: {
    cue: "Nested structure, matching brackets, or undo/most-recent semantics.",
    description: "Push context, pop when it closes; the stack IS the state.",
  },
  MONOTONIC_STACK: {
    cue: "\"Next greater\", \"previous smaller\", or spans in a histogram.",
    description: "A stack kept sorted — each element pops everything it dominates.",
  },
  QUEUE_DEQUE: {
    cue: "FIFO processing, or you need both ends of a sequence.",
    description: "A deque gives O(1) at both ends where an array would shift.",
  },
  FAST_SLOW_POINTERS: {
    cue: "A cycle, the middle of a list, or the nth node from the end.",
    description: "Two pointers at different speeds — the gap between them is the answer.",
  },
  LINKED_LIST_REVERSAL: {
    cue: "Reversing, reordering or rewiring pointers in place.",
    description: "Track prev/curr/next and relink as you walk — no extra storage.",
  },
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
    description: "Left < node < right, so inorder is sorted and search is O(h).",
  },
  TRIE: {
    cue: "Prefixes, autocomplete, or many words queried against each other.",
    description: "A character-per-edge tree, so shared prefixes are stored and searched once.",
  },
  GRAPH_DFS: {
    cue: "Connected regions, flood fill, or exploring one path fully before backing out.",
    description: "Recurse or use an explicit stack, marking visited as you go.",
  },
  GRAPH_BFS: {
    cue: "Fewest steps or shortest path on an UNWEIGHTED graph.",
    description: "A queue expanding level by level — first arrival is the shortest way.",
  },
  TOPOLOGICAL_SORT: {
    cue: "Prerequisites, build order, or any \"A before B\" ordering.",
    description: "Take nodes with no remaining dependencies; leftovers mean a cycle.",
  },
  UNION_FIND: {
    cue: "Merging groups, or repeatedly asking \"are these two connected?\"",
    description: "Disjoint sets with path compression — near-constant union and find.",
  },
  SHORTEST_PATH: {
    cue: "A WEIGHTED graph — cheapest route, minimum cost to connect, or delay time.",
    description: "Dijkstra, Bellman-Ford or an MST, depending on negative edges.",
  },
  HEAP: {
    cue: "Top-k, k-th largest, or repeatedly taking the current extreme.",
    description: "A heap of size k costs log k per element instead of a re-sort.",
  },
  TWO_HEAPS: {
    cue: "A running median, or splitting a stream into a smaller and larger half.",
    description: "A max-heap and a min-heap kept balanced against each other.",
  },
  K_WAY_MERGE: {
    cue: "Merging k sorted lists, or the k smallest across several sequences.",
    description: "A heap holding one candidate per list advances the merge.",
  },
  INTERVALS: {
    cue: "Start/end pairs — overlaps, merging, meeting rooms, minimum removals.",
    description: "Sort by start or end, then sweep and compare against the last kept one.",
  },
  GREEDY: {
    cue: "A locally best choice provably reaches the global best.",
    description: "Commit to the best immediate option — the hard part is proving it holds.",
  },
  BACKTRACKING: {
    cue: "Return ALL combinations, permutations or arrangements.",
    description: "Build a candidate, recurse, then undo the choice and try the next.",
  },
  DIVIDE_CONQUER: {
    cue: "Split in half, solve each half, merge the results.",
    description: "Recursion where the combine step does the real work.",
  },
  DP_1D: {
    cue: "Each state depends on a few earlier ones along a single axis.",
    description: "One array filled in order — the sequence carries the answer.",
  },
  DP_2D: {
    cue: "Two sequences compared, or a grid where state depends on row AND column.",
    description: "A table over both dimensions; each cell decided by its neighbours.",
  },
  DP_KNAPSACK: {
    cue: "Choose a subset under a capacity or target constraint.",
    description: "Capacity on one axis, items on the other — take it or leave it.",
  },
  GAME_THEORY: {
    cue: "Two players alternate and both play optimally.",
    description: "Score the position from the current player's view and negate on recursion.",
  },
  BIT_MANIPULATION: {
    cue: "Powers of two, XOR pairing, or a subset encoded into an integer.",
    description: "Bitwise operators for constant space and constant-time set operations.",
  },
  MATH: {
    cue: "Digits, overflow, geometry, or a closed-form result.",
    description: "Number theory and arithmetic rather than traversal.",
  },
  DESIGN: {
    cue: "\"Implement a class that supports…\" with operations under a time bound.",
    description: "Compose two structures so every operation is O(1) or O(log n).",
  },
  SEGMENT_TREE: {
    cue: "Range queries WITH updates between them.",
    description: "A tree over ranges — query and update both in O(log n).",
  },
  FENWICK_TREE: {
    cue: "Prefix sums with point updates, and you want it compact.",
    description: "A binary indexed tree — the same O(log n) with far less code.",
  },
};

/** Display order — roughly the order they're worth learning in. */
export const PATTERN_ORDER = [
  "HASH_MAP", "PREFIX_SUM", "SORTING", "CYCLIC_SORT",
  "SIMULATION", "MATRIX_TRAVERSAL", "STRING_PARSING", "STRING_MATCHING",
  "TWO_POINTERS", "SLIDING_WINDOW", "SLIDING_WINDOW_MAX", "BINARY_SEARCH",
  "STACK", "MONOTONIC_STACK", "QUEUE_DEQUE", "FAST_SLOW_POINTERS",
  "LINKED_LIST_REVERSAL", "TREE_DFS", "TREE_BFS", "BST",
  "TRIE", "GRAPH_DFS", "GRAPH_BFS", "TOPOLOGICAL_SORT",
  "UNION_FIND", "SHORTEST_PATH", "HEAP", "TWO_HEAPS",
  "K_WAY_MERGE", "INTERVALS", "GREEDY", "BACKTRACKING",
  "DIVIDE_CONQUER", "DP_1D", "DP_2D", "DP_KNAPSACK",
  "GAME_THEORY", "BIT_MANIPULATION", "MATH", "DESIGN",
  "SEGMENT_TREE", "FENWICK_TREE",
];

export const patternRank = (p: string) => {
  const i = PATTERN_ORDER.indexOf(p);
  return i === -1 ? PATTERN_ORDER.length : i;
};

/** Human label. Rendered with `capitalize`, so most just de-underscore. */
export const patternLabel = (p: string) => {
  const special: Record<string, string> = {
    HASH_MAP: "hash map / hash set",
    DP_1D: "1D dynamic programming",
    DP_2D: "2D / grid dynamic programming",
    DP_KNAPSACK: "knapsack DP",
    BST: "binary search tree",
    TREE_DFS: "tree DFS",
    TREE_BFS: "tree BFS",
    GRAPH_DFS: "graph DFS",
    GRAPH_BFS: "graph BFS",
    SLIDING_WINDOW_MAX: "sliding window maximum",
    K_WAY_MERGE: "k-way merge",
    FENWICK_TREE: "binary indexed tree",
    MATH: "math / number theory",
    DIVIDE_CONQUER: "recursion & divide and conquer",
    LINKED_LIST_REVERSAL: "reversal & manipulation",
    MATRIX_TRAVERSAL: "matrix / grid traversal",
    STRING_PARSING: "string manipulation & parsing",
    STRING_MATCHING: "string matching",
  };
  return special[p] ?? p.replace(/_/g, " ").toLowerCase();
};

/** Topics — the level above patterns.
 *
 *  A topic is where problems LIVE; a pattern is how you SOLVE them. Because the
 *  enum holds no structure names, no topic can contain a member with its own
 *  name — the "Arrays > arrays" nesting is structurally impossible.
 */
export type Topic = { key: string; label: string; blurb: string; patterns: string[] };

export const TOPICS: Topic[] = [
  {
    key: "ARRAYS", label: "Arrays & Hashing",
    blurb: "Scanning, counting and precomputing over a flat sequence.",
    patterns: ["HASH_MAP", "PREFIX_SUM", "SORTING", "CYCLIC_SORT", "SIMULATION", "MATRIX_TRAVERSAL"],
  },
  {
    key: "STRINGS", label: "Strings",
    blurb: "Building, matching and validating character sequences.",
    patterns: ["STRING_PARSING", "STRING_MATCHING"],
  },
  {
    key: "POINTERS", label: "Two Pointers & Sliding Window",
    blurb: "Two indices doing the work of a nested loop.",
    patterns: ["TWO_POINTERS", "SLIDING_WINDOW", "SLIDING_WINDOW_MAX"],
  },
  {
    key: "SEARCH", label: "Binary Search",
    blurb: "Halving the search space — over an array, or over the answer.",
    patterns: ["BINARY_SEARCH"],
  },
  {
    key: "STACKS", label: "Stacks & Queues",
    blurb: "Order-sensitive state held on a stack instead of a second pass.",
    patterns: ["STACK", "MONOTONIC_STACK", "QUEUE_DEQUE"],
  },
  {
    key: "LISTS", label: "Linked Lists",
    blurb: "Pointer rewiring on a structure you can only walk forwards.",
    patterns: ["FAST_SLOW_POINTERS", "LINKED_LIST_REVERSAL"],
  },
  {
    key: "TREES", label: "Trees & Tries",
    blurb: "Recursion down, results combined on the way back up.",
    patterns: ["TREE_DFS", "TREE_BFS", "BST", "TRIE"],
  },
  {
    key: "GRAPHS", label: "Graphs",
    blurb: "Reachability, ordering and cost across a network of nodes.",
    patterns: ["GRAPH_DFS", "GRAPH_BFS", "TOPOLOGICAL_SORT", "UNION_FIND", "SHORTEST_PATH"],
  },
  {
    key: "HEAPS", label: "Heaps",
    blurb: "Keeping the extreme to hand without sorting everything.",
    patterns: ["HEAP", "TWO_HEAPS", "K_WAY_MERGE"],
  },
  {
    key: "GREEDY", label: "Intervals & Greedy",
    blurb: "Sorting by the right key, then taking the best option each step.",
    patterns: ["INTERVALS", "GREEDY"],
  },
  {
    key: "RECURSION", label: "Recursion & Backtracking",
    blurb: "Exhaustive search, and splitting a problem in half.",
    patterns: ["BACKTRACKING", "DIVIDE_CONQUER"],
  },
  {
    key: "DP", label: "Dynamic Programming",
    blurb: "Overlapping subproblems, cached.",
    patterns: ["DP_1D", "DP_2D", "DP_KNAPSACK", "GAME_THEORY"],
  },
  {
    key: "MATH", label: "Math & Bits",
    blurb: "Arithmetic reasoning where no data structure is needed.",
    patterns: ["BIT_MANIPULATION", "MATH"],
  },
  {
    key: "DESIGN", label: "Design & Advanced",
    blurb: "Composing structures so every operation hits its time bound.",
    patterns: ["DESIGN", "SEGMENT_TREE", "FENWICK_TREE"],
  },
];

export const topicOf = (pattern: string): Topic =>
  TOPICS.find((t) => t.patterns.includes(pattern)) ?? TOPICS[TOPICS.length - 1];
