export const DSA_PATTERNS = [
  {
    title: "Two Pointers Pattern",
    source: "pattern:two-pointers",
    content: `# Two Pointers Pattern

## When to use
Use two pointers when you need to find a pair or triplet in a sorted array, or when you need to process elements from both ends simultaneously. Also useful for in-place array manipulation and removing duplicates.

## Key signals in problem
- Sorted array or string
- Find pair that sums to target
- "Remove duplicates in-place"
- Palindrome check
- Container/window problems

## Template
\`\`\`python
def two_pointers(arr):
    left, right = 0, len(arr) - 1
    while left < right:
        current = arr[left] + arr[right]
        if current == target:
            return [left, right]
        elif current < target:
            left += 1
        else:
            right -= 1
\`\`\`

## Time/Space complexity
- Time: O(n) — single pass
- Space: O(1) — no extra space

## Key problems
- Two Sum (sorted), 3Sum, Container With Most Water, Trapping Rain Water, Valid Palindrome, Remove Duplicates from Sorted Array

## Common mistakes
- Not handling edge cases when array has fewer than 2 elements
- Moving both pointers at once instead of one at a time
- Forgetting to avoid duplicates in 3Sum (skip equal elements after finding a valid triplet)`,
  },
  {
    title: "Sliding Window Pattern",
    source: "pattern:sliding-window",
    content: `# Sliding Window Pattern

## When to use
Use sliding window for problems involving contiguous subarrays or substrings where you need to find max/min/count satisfying some condition. Replaces O(n²) brute force with O(n).

## Key signals
- "Longest/shortest subarray/substring with condition"
- "Maximum sum subarray of size k"
- "All anagrams in string"
- "Minimum window containing all characters"

## Fixed window template
\`\`\`python
def fixed_window(arr, k):
    window_sum = sum(arr[:k])
    max_sum = window_sum
    for i in range(k, len(arr)):
        window_sum += arr[i] - arr[i - k]
        max_sum = max(max_sum, window_sum)
    return max_sum
\`\`\`

## Variable window template
\`\`\`python
def variable_window(s):
    left = 0
    seen = {}
    result = 0
    for right in range(len(s)):
        seen[s[right]] = seen.get(s[right], 0) + 1
        while len(seen) > k:  # shrink condition
            seen[s[left]] -= 1
            if seen[s[left]] == 0:
                del seen[s[left]]
            left += 1
        result = max(result, right - left + 1)
    return result
\`\`\`

## Time/Space
- Time: O(n) — each element enters and leaves window at most once
- Space: O(k) for the window state (hashmap, set, etc.)

## Key problems
- Longest Substring Without Repeating Characters, Minimum Window Substring, Longest Repeating Character Replacement, Maximum Sum Subarray of Size K, Fruits into Baskets`,
  },
  {
    title: "Binary Search Pattern",
    source: "pattern:binary-search",
    content: `# Binary Search Pattern

## When to use
Use binary search whenever the search space can be halved at each step. Works on sorted arrays, but also applies to "search on answer" problems where you binary search on the answer space rather than array indices.

## Key signals
- Sorted array, find element or position
- "Find minimum/maximum X such that condition holds"
- O(log n) time requirement

## Standard template
\`\`\`python
def binary_search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = left + (right - left) // 2  # avoid overflow
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
\`\`\`

## Search on answer template (find minimum valid)
\`\`\`python
def search_on_answer(lo, hi):
    while lo < hi:
        mid = (lo + hi) // 2
        if condition(mid):
            hi = mid      # mid could be answer, keep it
        else:
            lo = mid + 1  # mid is too small
    return lo
\`\`\`

## Rotated array variant
In a rotated sorted array, one half is always sorted. Check which half is sorted, then determine which half contains the target.

## Time/Space
- Time: O(log n)
- Space: O(1)

## Key problems
- Binary Search, Find Minimum in Rotated Sorted Array, Search in Rotated Sorted Array, Find Peak Element, Koko Eating Bananas, Capacity to Ship Packages`,
  },
  {
    title: "Dynamic Programming Pattern",
    source: "pattern:dynamic-programming",
    content: `# Dynamic Programming (DP) Pattern

## When to use
Use DP when a problem has overlapping subproblems and optimal substructure. The key insight: can you express the answer to a bigger problem in terms of smaller subproblems?

## Key signals
- "Number of ways to..."
- "Minimum/maximum cost to..."
- "Can you reach...?"
- Overlapping recursive calls
- Optimization over choices

## DP problem-solving framework
1. Define the state: what does dp[i] (or dp[i][j]) represent?
2. Find the recurrence: how does dp[i] relate to previous states?
3. Identify base cases
4. Decide top-down (memoization) vs bottom-up (tabulation)

## 1D DP template (Fibonacci-style)
\`\`\`python
def climb_stairs(n):
    if n <= 2: return n
    dp = [0] * (n + 1)
    dp[1], dp[2] = 1, 2
    for i in range(3, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    return dp[n]
    # Space optimized: just track prev two values
\`\`\`

## 2D DP template (grid/sequence)
\`\`\`python
def longest_common_subsequence(s1, s2):
    m, n = len(s1), len(s2)
    dp = [[0] * (n+1) for _ in range(m+1)]
    for i in range(1, m+1):
        for j in range(1, n+1):
            if s1[i-1] == s2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    return dp[m][n]
\`\`\`

## Knapsack pattern (subset/partition)
\`\`\`python
def can_partition(nums, target):
    dp = {0}
    for num in nums:
        dp = {s + num for s in dp} | dp
    return target in dp
\`\`\`

## Common DP categories
1. Linear DP: Climbing Stairs, House Robber, Coin Change
2. Grid DP: Unique Paths, Minimum Path Sum
3. Interval DP: Burst Balloons, Palindrome Partitioning
4. Knapsack: 0/1 Knapsack, Partition Equal Subset Sum
5. String DP: LCS, Edit Distance, Word Break

## Key problems
- Climbing Stairs, Coin Change, Longest Increasing Subsequence, Word Break, House Robber I & II, Jump Game, Unique Paths, Edit Distance`,
  },
  {
    title: "Trees and Graph Traversal",
    source: "pattern:trees-graphs",
    content: `# Trees & Graph Traversal

## DFS on Trees
\`\`\`python
def dfs(node):
    if not node:
        return
    # Pre-order: process node here
    dfs(node.left)
    # In-order: process node here
    dfs(node.right)
    # Post-order: process node here
\`\`\`

## BFS (Level Order)
\`\`\`python
from collections import deque
def bfs(root):
    queue = deque([root])
    result = []
    while queue:
        level_size = len(queue)
        level = []
        for _ in range(level_size):
            node = queue.popleft()
            level.append(node.val)
            if node.left: queue.append(node.left)
            if node.right: queue.append(node.right)
        result.append(level)
    return result
\`\`\`

## Graph DFS (with visited set)
\`\`\`python
def dfs_graph(graph, start):
    visited = set()
    def dfs(node):
        if node in visited:
            return
        visited.add(node)
        for neighbor in graph[node]:
            dfs(neighbor)
    dfs(start)
\`\`\`

## Topological Sort (Kahn's Algorithm — BFS)
\`\`\`python
from collections import deque
def topo_sort(n, edges):
    graph = [[] for _ in range(n)]
    indegree = [0] * n
    for u, v in edges:
        graph[u].append(v)
        indegree[v] += 1
    queue = deque(i for i in range(n) if indegree[i] == 0)
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for nei in graph[node]:
            indegree[nei] -= 1
            if indegree[nei] == 0:
                queue.append(nei)
    return order if len(order) == n else []  # empty = cycle
\`\`\`

## Union-Find (Disjoint Set Union)
\`\`\`python
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # path compression
        return self.parent[x]
    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px == py: return False
        if self.rank[px] < self.rank[py]: px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]: self.rank[px] += 1
        return True
\`\`\`

## Key problems
- Number of Islands (DFS/BFS), Course Schedule (topological sort), Binary Tree Level Order Traversal, Lowest Common Ancestor, Clone Graph, Pacific Atlantic Water Flow`,
  },
  {
    title: "Heap and Priority Queue",
    source: "pattern:heap",
    content: `# Heap / Priority Queue Pattern

## When to use
- Find kth largest/smallest element
- Merge k sorted arrays/lists
- Streaming median
- Task scheduling

## Python heapq (min-heap by default)
\`\`\`python
import heapq
heap = []
heapq.heappush(heap, 3)
heapq.heappush(heap, 1)
heapq.heappush(heap, 2)
heapq.heappop(heap)  # returns 1 (min)

# Max-heap: negate values
heapq.heappush(heap, -val)
max_val = -heapq.heappop(heap)

# Heapify in O(n)
heapq.heapify(arr)
\`\`\`

## Top K elements pattern
\`\`\`python
def top_k_frequent(nums, k):
    count = {}
    for n in nums:
        count[n] = count.get(n, 0) + 1
    # Min-heap of size k
    heap = []
    for num, freq in count.items():
        heapq.heappush(heap, (freq, num))
        if len(heap) > k:
            heapq.heappop(heap)
    return [num for freq, num in heap]
\`\`\`

## Streaming median (two heaps)
\`\`\`python
class MedianFinder:
    def __init__(self):
        self.small = []  # max-heap (negated)
        self.large = []  # min-heap
    def addNum(self, num):
        heapq.heappush(self.small, -num)
        # Balance: move largest of small to large
        heapq.heappush(self.large, -heapq.heappop(self.small))
        if len(self.large) > len(self.small):
            heapq.heappush(self.small, -heapq.heappop(self.large))
    def findMedian(self):
        if len(self.small) > len(self.large):
            return -self.small[0]
        return (-self.small[0] + self.large[0]) / 2
\`\`\`

## Key problems
- Top K Frequent Elements, Find Median From Data Stream, Merge K Sorted Lists, Kth Largest Element, Task Scheduler, Meeting Rooms II`,
  },
  {
    title: "Backtracking Pattern",
    source: "pattern:backtracking",
    content: `# Backtracking Pattern

## When to use
Generate all possible solutions, permutations, combinations, or subsets. Explore all choices and undo (backtrack) when a choice leads to an invalid state.

## General template
\`\`\`python
def backtrack(state, choices):
    if is_solution(state):
        results.append(state[:])  # copy!
        return
    for choice in choices:
        if is_valid(choice, state):
            state.append(choice)   # make choice
            backtrack(state, next_choices)
            state.pop()            # undo choice (backtrack)
\`\`\`

## Subsets
\`\`\`python
def subsets(nums):
    result = []
    def backtrack(start, current):
        result.append(current[:])
        for i in range(start, len(nums)):
            current.append(nums[i])
            backtrack(i + 1, current)
            current.pop()
    backtrack(0, [])
    return result
\`\`\`

## Combinations summing to target
\`\`\`python
def combination_sum(candidates, target):
    result = []
    def backtrack(start, current, remaining):
        if remaining == 0:
            result.append(current[:])
            return
        for i in range(start, len(candidates)):
            if candidates[i] > remaining:
                break
            current.append(candidates[i])
            backtrack(i, current, remaining - candidates[i])  # reuse same element
            current.pop()
    candidates.sort()
    backtrack(0, [], target)
    return result
\`\`\`

## Permutations
\`\`\`python
def permutations(nums):
    result = []
    def backtrack(current, remaining):
        if not remaining:
            result.append(current[:])
            return
        for i, num in enumerate(remaining):
            current.append(num)
            backtrack(current, remaining[:i] + remaining[i+1:])
            current.pop()
    backtrack([], nums)
    return result
\`\`\`

## Key problems
- Combination Sum, Subsets, Permutations, N-Queens, Word Search, Palindrome Partitioning, Letter Combinations of Phone Number`,
  },
];
