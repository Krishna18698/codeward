/** Single source of truth for DSA pattern metadata.
 *
 *  This previously lived as byte-identical copies inside ProblemList.tsx and
 *  ProblemBank.tsx. Both now import from here.
 *
 *  Each pattern carries two different things:
 *   - `cue`         — the RECOGNITION signal: how you spot that a problem you've
 *                     never seen belongs to this pattern. This is the skill that
 *                     actually transfers to an interview.
 *   - `description` — what the pattern *is*. Useful once you've recognised it,
 *                     useless for recognising it in the first place.
 */

export type PatternMeta = { cue: string; description: string };

export const PATTERNS: Record<string, PatternMeta> = {
  ARRAYS: {
    cue: "Direct indexing or an in-place rearrangement, with no other structure implied.",
    description: "Fundamental collection of elements stored at contiguous memory locations.",
  },
  STRINGS: {
    cue: "Substrings, anagrams or palindromes — often an array problem with a 26-letter alphabet.",
    description: "Sequence of characters with pattern matching and manipulation techniques.",
  },
  LINKED_LIST: {
    cue: "Pointer rewiring or cycle detection on a sequence you can only walk forwards.",
    description: "Sequential node chain where each node points to the next in memory.",
  },
  TREES: {
    cue: "Parent/child, subtree or depth wording — and the answer is usually a traversal.",
    description: "Hierarchical structures with parent-child relationships and recursive traversals.",
  },
  GRAPHS: {
    cue: "Things with connections, reachability questions, or a grid you move around in.",
    description: "Networks of vertices and edges solved with BFS, DFS, union-find, and shortest paths.",
  },
  DYNAMIC_PROGRAMMING: {
    cue: "Count the ways, or optimise a choice at each step — and the same subproblem keeps recurring.",
    description: "Break problems into overlapping subproblems and cache results to avoid recomputation.",
  },
  BACKTRACKING: {
    cue: "Return ALL combinations, permutations or arrangements — you must enumerate, not count.",
    description: "Explore all possibilities by building candidates and abandoning those that fail constraints.",
  },
  BINARY_SEARCH: {
    cue: "A sorted input, or a monotonic “is X feasible?” you can answer yes/no on.",
    description: "Eliminate half the search space each step by comparing against a sorted midpoint.",
  },
  SLIDING_WINDOW: {
    cue: "The longest or shortest CONTIGUOUS run that satisfies some condition.",
    description: "Maintain a window over a sequence and expand or shrink it to satisfy a condition.",
  },
  TWO_POINTERS: {
    cue: "A sorted array plus a target pair or triplet, or a sweep from both ends.",
    description: "Use two indices moving towards or away from each other to cut redundant comparisons.",
  },
  STACK_QUEUE: {
    cue: "Matching brackets, undo/most-recent semantics, or “next greater element”.",
    description: "LIFO and FIFO structures for state tracking, parsing, and monotonic sequences.",
  },
  HEAP: {
    cue: "Top-k, k-th largest, or a running median — you need the extreme, not a full sort.",
    description: "Priority queue built on a complete binary tree for efficient min/max extraction.",
  },
  TRIE: {
    cue: "Prefix lookups, autocomplete, or many words queried against each other.",
    description: "Prefix tree enabling fast string search, autocomplete, and dictionary operations.",
  },
  MATH: {
    cue: "The input is enormous but the answer has a closed form — look for a formula, not a loop.",
    description: "Number theory and combinatorics to derive O(1) or O(√n) solutions.",
  },
  BIT_MANIPULATION: {
    cue: "Powers of two, XOR pairing, or a subset encoded into a single integer.",
    description: "Use bitwise operators to solve problems with constant space and fast bit tricks.",
  },
  OTHER: {
    cue: "Doesn't fit one pattern — decompose it and name the sub-patterns first.",
    description: "Problems that combine multiple patterns or require unique problem-specific approaches.",
  },
};

/** Patterns ordered by interview importance / learning progression — most important first. */
export const PATTERN_ORDER = [
  "ARRAYS", "STRINGS", "TWO_POINTERS", "SLIDING_WINDOW", "BINARY_SEARCH",
  "LINKED_LIST", "STACK_QUEUE", "TREES", "GRAPHS", "HEAP",
  "DYNAMIC_PROGRAMMING", "BACKTRACKING", "TRIE", "BIT_MANIPULATION", "MATH", "OTHER",
];

export const patternRank = (p: string) => {
  const i = PATTERN_ORDER.indexOf(p);
  return i === -1 ? PATTERN_ORDER.length : i;
};

/** "SLIDING_WINDOW" -> "sliding window" */
export const patternLabel = (p: string) => p.replace(/_/g, " ").toLowerCase();
