-- Replace the structural ProblemPattern enum with technique-level values.
--
-- The old enum mixed two different things: structures (ARRAYS, TREES, GRAPHS,
-- LINKED_LIST, STACK_QUEUE, HEAP, STRINGS, TRIE) and techniques (TWO_POINTERS,
-- SLIDING_WINDOW, ...). 366 of 616 problems carried a structure, which says
-- where a problem lives but nothing about how to solve it.
--
-- Postgres cannot remove values from an enum in place, so this creates the new
-- type, rewrites the column with an explicit mapping, and drops the old type.
-- Every old value is mapped, so no row can be left behind.
--
-- The mapping below is a COARSE fallback for rows this deployment doesn't
-- control (AI-generated custom sheets). The curated problems are re-tagged
-- per-problem by the seed, which runs after this migration.

CREATE TYPE "ProblemPattern_new" AS ENUM (
  'HASHING', 'PREFIX_SUM', 'KADANE', 'SORTING', 'CYCLIC_SORT', 'MATRIX',
  'TWO_POINTERS', 'FAST_SLOW_POINTERS', 'SLIDING_WINDOW',
  'MONOTONIC_STACK', 'STACK_SIMULATION',
  'BINARY_SEARCH',
  'LINKED_LIST_REVERSAL',
  'TREE_DFS', 'TREE_BFS', 'BST', 'TRIE',
  'GRAPH_DFS', 'GRAPH_BFS', 'UNION_FIND', 'TOPOLOGICAL_SORT', 'SHORTEST_PATH',
  'TOP_K_HEAP', 'INTERVALS', 'GREEDY',
  'BACKTRACKING', 'DP_1D', 'DP_2D', 'DIVIDE_CONQUER',
  'BIT_MANIPULATION', 'MATH', 'DESIGN'
);

ALTER TABLE "Problem"
  ALTER COLUMN "pattern" TYPE "ProblemPattern_new"
  USING (
    CASE "pattern"::text
      WHEN 'ARRAYS'              THEN 'HASHING'
      WHEN 'STRINGS'             THEN 'HASHING'
      WHEN 'LINKED_LIST'         THEN 'LINKED_LIST_REVERSAL'
      WHEN 'TREES'               THEN 'TREE_DFS'
      WHEN 'GRAPHS'              THEN 'GRAPH_DFS'
      WHEN 'STACK_QUEUE'         THEN 'STACK_SIMULATION'
      WHEN 'HEAP'                THEN 'TOP_K_HEAP'
      WHEN 'TRIE'                THEN 'TRIE'
      WHEN 'DYNAMIC_PROGRAMMING' THEN 'DP_1D'
      WHEN 'BACKTRACKING'        THEN 'BACKTRACKING'
      WHEN 'BINARY_SEARCH'       THEN 'BINARY_SEARCH'
      WHEN 'SLIDING_WINDOW'      THEN 'SLIDING_WINDOW'
      WHEN 'TWO_POINTERS'        THEN 'TWO_POINTERS'
      WHEN 'BIT_MANIPULATION'    THEN 'BIT_MANIPULATION'
      WHEN 'MATH'                THEN 'MATH'
      WHEN 'OTHER'               THEN 'HASHING'
    END
  )::"ProblemPattern_new";

DROP TYPE "ProblemPattern";
ALTER TYPE "ProblemPattern_new" RENAME TO "ProblemPattern";
