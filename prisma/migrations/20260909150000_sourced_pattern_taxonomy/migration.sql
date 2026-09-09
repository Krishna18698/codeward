-- Adopt the 41-pattern LeetCode taxonomy (ultimate-leetcode-patterns) as the
-- pattern vocabulary, plus SHORTEST_PATH which that list has no value for.
--
-- The previous enum was a taxonomy assembled from blog posts. This one is
-- sourced: our problems are matched to that dataset by LeetCode slug, so the
-- per-problem pattern comes from a list that maps 632 problems.
--
-- Postgres cannot remove enum values in place, so this creates the new type,
-- rewrites the column with an explicit mapping, and drops the old one. The
-- CASE below is a COARSE fallback for rows this deployment does not own
-- (AI-generated custom sheets); curated problems are re-tagged per problem by
-- the seed, which runs after this migration.

CREATE TYPE "ProblemPattern_new" AS ENUM (
  'HASH_MAP','PREFIX_SUM','SORTING','CYCLIC_SORT','SIMULATION','MATRIX_TRAVERSAL',
  'STRING_PARSING','STRING_MATCHING','TWO_POINTERS','SLIDING_WINDOW','SLIDING_WINDOW_MAX',
  'BINARY_SEARCH','STACK','MONOTONIC_STACK','QUEUE_DEQUE','FAST_SLOW_POINTERS','LINKED_LIST_REVERSAL',
  'TREE_DFS','TREE_BFS','BST','TRIE','GRAPH_DFS','GRAPH_BFS','TOPOLOGICAL_SORT','UNION_FIND',
  'SHORTEST_PATH','HEAP','TWO_HEAPS','K_WAY_MERGE','INTERVALS','GREEDY','BACKTRACKING',
  'DIVIDE_CONQUER','DP_1D','DP_2D','DP_KNAPSACK','GAME_THEORY','BIT_MANIPULATION','MATH',
  'DESIGN','SEGMENT_TREE','FENWICK_TREE'
);

ALTER TABLE "Problem"
  ALTER COLUMN "pattern" TYPE "ProblemPattern_new"
  USING (
    CASE "pattern"::text
      -- values that were renamed
      WHEN 'HASHING'              THEN 'HASH_MAP'
      WHEN 'KADANE'               THEN 'DP_1D'
      WHEN 'MATRIX'               THEN 'MATRIX_TRAVERSAL'
      WHEN 'STACK_SIMULATION'     THEN 'STACK'
      WHEN 'TOP_K_HEAP'           THEN 'HEAP'
      -- values that carry over unchanged
      WHEN 'PREFIX_SUM'           THEN 'PREFIX_SUM'
      WHEN 'SORTING'              THEN 'SORTING'
      WHEN 'CYCLIC_SORT'          THEN 'CYCLIC_SORT'
      WHEN 'TWO_POINTERS'         THEN 'TWO_POINTERS'
      WHEN 'FAST_SLOW_POINTERS'   THEN 'FAST_SLOW_POINTERS'
      WHEN 'SLIDING_WINDOW'       THEN 'SLIDING_WINDOW'
      WHEN 'MONOTONIC_STACK'      THEN 'MONOTONIC_STACK'
      WHEN 'BINARY_SEARCH'        THEN 'BINARY_SEARCH'
      WHEN 'LINKED_LIST_REVERSAL' THEN 'LINKED_LIST_REVERSAL'
      WHEN 'TREE_DFS'             THEN 'TREE_DFS'
      WHEN 'TREE_BFS'             THEN 'TREE_BFS'
      WHEN 'BST'                  THEN 'BST'
      WHEN 'TRIE'                 THEN 'TRIE'
      WHEN 'GRAPH_DFS'            THEN 'GRAPH_DFS'
      WHEN 'GRAPH_BFS'            THEN 'GRAPH_BFS'
      WHEN 'UNION_FIND'           THEN 'UNION_FIND'
      WHEN 'TOPOLOGICAL_SORT'     THEN 'TOPOLOGICAL_SORT'
      WHEN 'SHORTEST_PATH'        THEN 'SHORTEST_PATH'
      WHEN 'INTERVALS'            THEN 'INTERVALS'
      WHEN 'GREEDY'               THEN 'GREEDY'
      WHEN 'BACKTRACKING'         THEN 'BACKTRACKING'
      WHEN 'DP_1D'                THEN 'DP_1D'
      WHEN 'DP_2D'                THEN 'DP_2D'
      WHEN 'DIVIDE_CONQUER'       THEN 'DIVIDE_CONQUER'
      WHEN 'BIT_MANIPULATION'     THEN 'BIT_MANIPULATION'
      WHEN 'MATH'                 THEN 'MATH'
      WHEN 'DESIGN'               THEN 'DESIGN'
    END
  )::"ProblemPattern_new";

DROP TYPE "ProblemPattern";
ALTER TYPE "ProblemPattern_new" RENAME TO "ProblemPattern";
