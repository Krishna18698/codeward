/**
 * Full problem content keyed by canonical LeetCode URL.
 * Used by seed.ts to populate descriptions and test cases.
 * Also used at runtime to patch custom-sheet copies on re-seed.
 */

export type ProblemContent = {
  description: string;
  gfgUrl?: string;
  testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
};

export const PROBLEM_CONTENT: Record<string, ProblemContent> = {

  // ─── Arrays ────────────────────────────────────────────────────────────────

  "https://leetcode.com/problems/two-sum/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/key-pair5616/1",
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.

Constraints:
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]
Explanation: Because nums[1] + nums[2] == 6, we return [1, 2].`,
    testCases: [
      { input: "nums = [2,7,11,15]\ntarget = 9", expectedOutput: "[0,1]", isHidden: false },
      { input: "nums = [3,2,4]\ntarget = 6", expectedOutput: "[1,2]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/stock-buy-and-sell-1587115621/1",
    description: `You are given an array prices where prices[i] is the price of a given stock on the i-th day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.

Constraints:
- 1 <= prices.length <= 10^5
- 0 <= prices[i] <= 10^4

Example 1:
Input: prices = [7,1,5,3,6,4]
Output: 5
Explanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6 - 1 = 5. Note that buying on day 2 and selling on day 1 is not allowed because you must buy before you sell.

Example 2:
Input: prices = [7,6,4,3,1]
Output: 0
Explanation: In this case, no transactions are done and the max profit = 0.`,
    testCases: [
      { input: "prices = [7,1,5,3,6,4]", expectedOutput: "5", isHidden: false },
      { input: "prices = [7,6,4,3,1]", expectedOutput: "0", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/contains-duplicate/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/who-will-win-1587115621/1",
    description: `Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.

Constraints:
- 1 <= nums.length <= 10^5
- -10^9 <= nums[i] <= 10^9

Example 1:
Input: nums = [1,2,3,1]
Output: true
Explanation: The element 1 appears at indices 0 and 3.

Example 2:
Input: nums = [1,2,3,4]
Output: false
Explanation: All elements are distinct.`,
    testCases: [
      { input: "nums = [1,2,3,1]", expectedOutput: "true", isHidden: false },
      { input: "nums = [1,2,3,4]", expectedOutput: "false", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/product-of-array-except-self/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/product-array-puzzle4525/1",
    description: `Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].

The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer. You must write an algorithm that runs in O(n) time and without using the division operation.

Constraints:
- 2 <= nums.length <= 10^5
- -30 <= nums[i] <= 30
- The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.

Example 1:
Input: nums = [1,2,3,4]
Output: [24,12,8,6]
Explanation: answer[0] = 2*3*4 = 24, answer[1] = 1*3*4 = 12, answer[2] = 1*2*4 = 8, answer[3] = 1*2*3 = 6.

Example 2:
Input: nums = [-1,1,0,-3,3]
Output: [0,0,9,0,0]`,
    testCases: [
      { input: "nums = [1,2,3,4]", expectedOutput: "[24,12,8,6]", isHidden: false },
      { input: "nums = [-1,1,0,-3,3]", expectedOutput: "[0,0,9,0,0]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/maximum-subarray/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/kadanes-algorithm-1587115620/1",
    description: `Given an integer array nums, find the subarray with the largest sum, and return its sum. A subarray is a contiguous non-empty sequence of elements within an array.

This is a classic application of Kadane's algorithm: at each position, decide whether to extend the existing subarray or start a new one from the current element.

Constraints:
- 1 <= nums.length <= 10^5
- -10^4 <= nums[i] <= 10^4

Example 1:
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.

Example 2:
Input: nums = [5,4,-1,7,8]
Output: 23
Explanation: The subarray [5,4,-1,7,8] has the largest sum 23.`,
    testCases: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6", isHidden: false },
      { input: "nums = [5,4,-1,7,8]", expectedOutput: "23", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/maximum-product-subarray/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/maximum-product-subarray3604/1",
    description: `Given an integer array nums, find a subarray that has the largest product, and return the product. The test cases are generated so that the answer will fit in a 32-bit integer.

Unlike maximum sum subarray, you need to track both the current maximum and minimum product at each step because a negative number multiplied by a negative minimum can become the maximum.

Constraints:
- 1 <= nums.length <= 2 * 10^4
- -10 <= nums[i] <= 10
- The product of any subarray of nums is guaranteed to fit in a 32-bit integer.

Example 1:
Input: nums = [2,3,-2,4]
Output: 6
Explanation: [2,3] has the largest product 6.

Example 2:
Input: nums = [-2,0,-1]
Output: 0
Explanation: The result cannot be 2, because [-2,-1] is not a subarray.`,
    testCases: [
      { input: "nums = [2,3,-2,4]", expectedOutput: "6", isHidden: false },
      { input: "nums = [-2,0,-1]", expectedOutput: "0", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/minimum-element-in-a-sorted-and-rotated-array3611/1",
    description: `Suppose an array of length n sorted in ascending order is rotated between 1 and n times. For example, the array nums = [0,1,2,4,5,6,7] might become [4,5,6,7,0,1,2] if it was rotated 4 times.

Given the sorted rotated array nums of unique elements, return the minimum element of this array. You must write an algorithm that runs in O(log n) time.

Constraints:
- n == nums.length
- 1 <= n <= 5000
- -5000 <= nums[i] <= 5000
- All the integers of nums are unique.
- nums is sorted and rotated between 1 and n times.

Example 1:
Input: nums = [3,4,5,1,2]
Output: 1
Explanation: The original array was [1,2,3,4,5] rotated 3 times.

Example 2:
Input: nums = [4,5,6,7,0,1,2]
Output: 0
Explanation: The original array was [0,1,2,4,5,6,7] and it was rotated 4 times.`,
    testCases: [
      { input: "nums = [3,4,5,1,2]", expectedOutput: "1", isHidden: false },
      { input: "nums = [4,5,6,7,0,1,2]", expectedOutput: "0", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/search-in-rotated-sorted-array/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/search-in-a-rotated-array4618/1",
    description: `There is an integer array nums sorted in ascending order (with distinct values). Prior to being passed to your function, nums is possibly rotated at an unknown pivot index k (1 <= k < nums.length) such that the resulting array is [nums[k], nums[k+1], ..., nums[n-1], nums[0], nums[1], ..., nums[k-1]].

Given the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums. You must write an algorithm with O(log n) runtime complexity.

Constraints:
- 1 <= nums.length <= 5000
- -10^4 <= nums[i] <= 10^4
- All values of nums are unique.
- nums is an ascending array that is possibly rotated.
- -10^4 <= target <= 10^4

Example 1:
Input: nums = [4,5,6,7,0,1,2], target = 0
Output: 4
Explanation: 0 is at index 4 in the rotated array.

Example 2:
Input: nums = [4,5,6,7,0,1,2], target = 3
Output: -1
Explanation: 3 is not in the array.`,
    testCases: [
      { input: "nums = [4,5,6,7,0,1,2]\ntarget = 0", expectedOutput: "4", isHidden: false },
      { input: "nums = [4,5,6,7,0,1,2]\ntarget = 3", expectedOutput: "-1", isHidden: false },
    ],
  },

  // ─── Two Pointers ──────────────────────────────────────────────────────────

  "https://leetcode.com/problems/3sum/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/triplet-sum-in-array-1587115621/1",
    description: `Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, j != k, and nums[i] + nums[j] + nums[k] == 0.

Notice that the solution set must not contain duplicate triplets. Sort the array first, then use two pointers for each fixed element to find pairs that sum to its negation.

Constraints:
- 3 <= nums.length <= 3000
- -10^5 <= nums[i] <= 10^5

Example 1:
Input: nums = [-1,0,1,2,-1,-4]
Output: [[-1,-1,2],[-1,0,1]]
Explanation: nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0, nums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0, nums[0] + nums[3] + nums[4] = (-1) + 2 + (-1) = 0. The distinct triplets are [-1,0,1] and [-1,-1,2].

Example 2:
Input: nums = [0,1,1]
Output: []
Explanation: The only possible triplet does not sum up to 0.`,
    testCases: [
      { input: "nums = [-1,0,1,2,-1,-4]", expectedOutput: "[[-1,-1,2],[-1,0,1]]", isHidden: false },
      { input: "nums = [0,0,0]", expectedOutput: "[[0,0,0]]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/container-with-most-water/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/container-with-most-water0535/1",
    description: `You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the i-th line are (i, 0) and (i, height[i]).

Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store. You may not slant the container.

Constraints:
- n == height.length
- 2 <= n <= 10^5
- 0 <= height[i] <= 10^4

Example 1:
Input: height = [1,8,6,2,5,4,8,3,7]
Output: 49
Explanation: The lines at index 1 (height 8) and index 8 (height 7) contain the most water. min(8,7) * (8-1) = 7 * 7 = 49.

Example 2:
Input: height = [1,1]
Output: 1`,
    testCases: [
      { input: "height = [1,8,6,2,5,4,8,3,7]", expectedOutput: "49", isHidden: false },
      { input: "height = [1,1]", expectedOutput: "1", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/valid-palindrome/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/palindrome-string0817/1",
    description: `A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string s, return true if it is a palindrome, or false otherwise.

Constraints:
- 1 <= s.length <= 2 * 10^5
- s consists only of printable ASCII characters.

Example 1:
Input: s = "A man, a plan, a canal: Panama"
Output: true
Explanation: "amanaplanacanalpanama" is a palindrome.

Example 2:
Input: s = "race a car"
Output: false
Explanation: "raceacar" is not a palindrome.`,
    testCases: [
      { input: 's = "A man, a plan, a canal: Panama"', expectedOutput: "true", isHidden: false },
      { input: 's = "race a car"', expectedOutput: "false", isHidden: false },
    ],
  },

  // ─── Sliding Window ────────────────────────────────────────────────────────

  "https://leetcode.com/problems/longest-substring-without-repeating-characters/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/length-of-the-longest-substring3036/1",
    description: `Given a string s, find the length of the longest substring without repeating characters. A substring is a contiguous non-empty sequence of characters within a string.

Use a sliding window with a hash map to track the last index of each character. Whenever a character repeats within the window, advance the left pointer past the previous occurrence.

Constraints:
- 0 <= s.length <= 5 * 10^4
- s consists of English letters, digits, symbols and spaces.

Example 1:
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.

Example 2:
Input: s = "pwwkew"
Output: 3
Explanation: The answer is "wke", with the length of 3. Notice that the answer must be a substring; "pwke" is a subsequence and not a substring.`,
    testCases: [
      { input: 's = "abcabcbb"', expectedOutput: "3", isHidden: false },
      { input: 's = "pwwkew"', expectedOutput: "3", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/longest-repeating-character-replacement/": {
    description: `You are given a string s and an integer k. You can choose any character of the string and change it to any other uppercase English character. You can perform this operation at most k times.

Return the length of the longest substring containing the same letter you can get after performing the above operations.

Key insight: in a valid window of length L, if the most frequent character appears f times, then L - f <= k (we need at most k replacements). Use a sliding window and track the max frequency inside the window.

Constraints:
- 1 <= s.length <= 10^5
- s consists of only uppercase English letters.
- 0 <= k <= s.length

Example 1:
Input: s = "ABAB", k = 2
Output: 4
Explanation: Replace the two 'A's with two 'B's or vice versa.

Example 2:
Input: s = "AABABBA", k = 1
Output: 4
Explanation: Replace the one 'A' in the middle with 'B' and form "AABBBBA". The substring "BBBB" has the longest repeating letters.`,
    testCases: [
      { input: 's = "ABAB"\nk = 2', expectedOutput: "4", isHidden: false },
      { input: 's = "AABABBA"\nk = 1', expectedOutput: "4", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/minimum-window-substring/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/smallest-window-in-a-string-containing-all-the-characters-of-another-string-1587115621/1",
    description: `Given two strings s and t of lengths m and n respectively, return the minimum window substring of s such that every character in t (including duplicates) is included in the window. If there is no such substring, return the empty string "".

The testcases will be generated such that the answer is unique. Use two pointers with a frequency map: expand the right pointer to include characters, then contract the left pointer to minimize the window while still satisfying the constraint.

Constraints:
- m == s.length
- n == t.length
- 1 <= m, n <= 10^5
- s and t consist of uppercase and lowercase English letters.

Example 1:
Input: s = "ADOBECODEBANC", t = "ABC"
Output: "BANC"
Explanation: The minimum window substring "BANC" includes 'A', 'B', and 'C' from string t.

Example 2:
Input: s = "a", t = "aa"
Output: ""
Explanation: Both 'a's from t must be included in the window. Since the largest window of s only has one 'a', return "".`,
    testCases: [
      { input: 's = "ADOBECODEBANC"\nt = "ABC"', expectedOutput: '"BANC"', isHidden: false },
      { input: 's = "a"\nt = "aa"', expectedOutput: '""', isHidden: false },
    ],
  },

  // ─── Strings ───────────────────────────────────────────────────────────────

  "https://leetcode.com/problems/valid-anagram/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/anagram-1587115620/1",
    description: `Given two strings s and t, return true if t is an anagram of s, and false otherwise. An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, using all the original letters exactly once.

You can solve this by sorting both strings and comparing, or by using a frequency count array/hash map.

Constraints:
- 1 <= s.length, t.length <= 5 * 10^4
- s and t consist of lowercase English letters.

Example 1:
Input: s = "anagram", t = "nagaram"
Output: true
Explanation: Both strings contain exactly: a(3), n(1), g(1), r(1), m(1).

Example 2:
Input: s = "rat", t = "car"
Output: false
Explanation: s contains r(1), a(1), t(1) while t contains c(1), a(1), r(1). 't' vs 'c' differ.`,
    testCases: [
      { input: 's = "anagram"\nt = "nagaram"', expectedOutput: "true", isHidden: false },
      { input: 's = "rat"\nt = "car"', expectedOutput: "false", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/group-anagrams/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/print-anagrams-together/1",
    description: `Given an array of strings strs, group the anagrams together. You can return the answer in any order. An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, using all the original letters exactly once.

Key approach: use a sorted version of each word as the key in a hash map. All words that are anagrams of each other will produce the same sorted key.

Constraints:
- 1 <= strs.length <= 10^4
- 0 <= strs[i].length <= 100
- strs[i] consists of lowercase English letters.

Example 1:
Input: strs = ["eat","tea","tan","ate","nat","bat"]
Output: [["bat"],["nat","tan"],["ate","eat","tea"]]
Explanation: "eat", "tea", "ate" are anagrams of each other. "tan" and "nat" are anagrams.

Example 2:
Input: strs = [""]
Output: [[""]]`,
    testCases: [
      { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', expectedOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]', isHidden: false },
      { input: 'strs = ["a"]', expectedOutput: '[["a"]]', isHidden: false },
    ],
  },

  "https://leetcode.com/problems/encode-and-decode-strings/": {
    description: `Design an algorithm to encode a list of strings to a single string. The encoded string is then sent over the network and is decoded back to the original list of strings.

Please implement encode and decode methods. The encode method takes a list of strings and returns a single encoded string. The decode method takes the encoded string and returns the original list.

A robust approach: prefix each string with its length followed by a delimiter (e.g., "4#word"), so you can unambiguously split the encoded string even if strings contain the delimiter character.

Constraints:
- 1 <= strs.length <= 200
- 0 <= strs[i].length <= 200
- strs[i] contains any possible characters out of 256 valid ASCII characters.

Example 1:
Input: dummy_input = ["Hello","World"]
Output: ["Hello","World"]
Explanation: One possible encode method is: "5#Hello5#World". Decode recovers the original list.

Example 2:
Input: dummy_input = [""]
Output: [""]`,
    testCases: [
      { input: 'strs = ["Hello","World"]', expectedOutput: '["Hello","World"]', isHidden: false },
      { input: 'strs = ["","a"]', expectedOutput: '["","a"]', isHidden: false },
    ],
  },

  // ─── Stack / Queue ─────────────────────────────────────────────────────────

  "https://leetcode.com/problems/valid-parentheses/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/parenthesis-checker2744/1",
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

Use a stack: push open brackets; when you see a close bracket, check if the top of the stack is the matching open bracket.

Constraints:
- 1 <= s.length <= 10^4
- s consists of parentheses only '()[]{}'.

Example 1:
Input: s = "()"
Output: true

Example 2:
Input: s = "()[]{}"
Output: true

Example 3:
Input: s = "(]"
Output: false
Explanation: ')' does not match '['.`,
    testCases: [
      { input: 's = "()[]{}"', expectedOutput: "true", isHidden: false },
      { input: 's = "([)]"', expectedOutput: "false", isHidden: false },
    ],
  },

  // ─── Trees ─────────────────────────────────────────────────────────────────

  "https://leetcode.com/problems/maximum-depth-of-binary-tree/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/height-of-binary-tree/1",
    description: `Given the root of a binary tree, return its maximum depth. The maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.

You can solve this recursively: the depth of a tree is 1 + max(depth(left), depth(right)). Alternatively use BFS and count levels.

Constraints:
- The number of nodes in the tree is in the range [0, 10^4].
- -100 <= Node.val <= 100

Example 1:
Input: root = [3,9,20,null,null,15,7]
Output: 3
Explanation: The tree has 3 levels: root 3, then 9 and 20, then 15 and 7.

Example 2:
Input: root = [1,null,2]
Output: 2`,
    testCases: [
      { input: "root = [3,9,20,null,null,15,7]", expectedOutput: "3", isHidden: false },
      { input: "root = [1,null,2]", expectedOutput: "2", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/same-tree/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/determine-if-two-trees-are-identical/1",
    description: `Given the roots of two binary trees p and q, write a function to check if they are the same or not. Two binary trees are considered the same if they are structurally identical, and the nodes have the same value.

Recursive approach: two trees are the same if their roots have the same value AND their left subtrees are the same AND their right subtrees are the same.

Constraints:
- The number of nodes in both trees is in the range [0, 100].
- -10^4 <= Node.val <= 10^4

Example 1:
Input: p = [1,2,3], q = [1,2,3]
Output: true

Example 2:
Input: p = [1,2], q = [1,null,2]
Output: false
Explanation: The structure differs — p's right child is null but q's left child is null.`,
    testCases: [
      { input: "p = [1,2,3]\nq = [1,2,3]", expectedOutput: "true", isHidden: false },
      { input: "p = [1,2]\nq = [1,null,2]", expectedOutput: "false", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/invert-binary-tree/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/mirror-tree/1",
    description: `Given the root of a binary tree, invert the tree, and return its root. Inverting a binary tree means swapping the left and right children at every node.

Recursive solution: swap the left and right children of the current node, then recursively invert each subtree.

Constraints:
- The number of nodes in the tree is in the range [0, 100].
- -100 <= Node.val <= 100

Example 1:
Input: root = [4,2,7,1,3,6,9]
Output: [4,7,2,9,6,3,1]
Explanation: Every node's children are swapped. The tree is mirrored.

Example 2:
Input: root = [2,1,3]
Output: [2,3,1]`,
    testCases: [
      { input: "root = [4,2,7,1,3,6,9]", expectedOutput: "[4,7,2,9,6,3,1]", isHidden: false },
      { input: "root = [2,1,3]", expectedOutput: "[2,3,1]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/binary-tree-maximum-path-sum/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/maximum-path-sum-from-any-node/1",
    description: `A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. A node can only appear in the sequence at most once. Note that the path does not need to pass through the root.

Given the root of a binary tree, return the maximum path sum of any non-empty path.

At each node, the maximum path through that node = node.val + max(0, left_gain) + max(0, right_gain). Use a global variable to track the answer across all nodes.

Constraints:
- The number of nodes in the tree is in the range [1, 3 * 10^4].
- -1000 <= Node.val <= 1000

Example 1:
Input: root = [1,2,3]
Output: 6
Explanation: The optimal path is 2 -> 1 -> 3 with a path sum of 2 + 1 + 3 = 6.

Example 2:
Input: root = [-10,9,20,null,null,15,7]
Output: 42
Explanation: The optimal path is 15 -> 20 -> 7 with a path sum of 15 + 20 + 7 = 42.`,
    testCases: [
      { input: "root = [1,2,3]", expectedOutput: "6", isHidden: false },
      { input: "root = [-10,9,20,null,null,15,7]", expectedOutput: "42", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/binary-tree-level-order-traversal/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/level-order-traversal/1",
    description: `Given the root of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).

Use a queue (BFS): process all nodes at the current level before moving to the next. At each level, record the size of the queue before processing to know which nodes belong to the current level.

Constraints:
- The number of nodes in the tree is in the range [0, 2000].
- -1000 <= Node.val <= 1000

Example 1:
Input: root = [3,9,20,null,null,15,7]
Output: [[3],[9,20],[15,7]]
Explanation: Level 0 has [3], level 1 has [9,20], level 2 has [15,7].

Example 2:
Input: root = [1]
Output: [[1]]`,
    testCases: [
      { input: "root = [3,9,20,null,null,15,7]", expectedOutput: "[[3],[9,20],[15,7]]", isHidden: false },
      { input: "root = [1]", expectedOutput: "[[1]]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/": {
    description: `Serialization is the process of converting a data structure or object into a sequence of bits so that it can be stored in a file or memory buffer, or transmitted across a network to be reconstructed later.

Design an algorithm to serialize and deserialize a binary tree. There is no restriction on how your serialization/deserialization algorithm should work. You just need to ensure that a binary tree can be serialized to a string and this string can be deserialized to the original tree structure.

Common approach: BFS or preorder DFS with "null" markers for missing children.

Constraints:
- The number of nodes in the tree is in the range [0, 10^4].
- -1000 <= Node.val <= 1000

Example 1:
Input: root = [1,2,3,null,null,4,5]
Output: [1,2,3,null,null,4,5]
Explanation: The serialized string can be any valid format; after deserialization the tree must match the original.

Example 2:
Input: root = []
Output: []`,
    testCases: [
      { input: "root = [1,2,3,null,null,4,5]", expectedOutput: "[1,2,3,null,null,4,5]", isHidden: false },
      { input: "root = []", expectedOutput: "[]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/subtree-of-another-tree/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/check-if-subtree/1",
    description: `Given the roots of two binary trees root and subRoot, return true if there is a subtree of root with the same structure and node values of subRoot and false otherwise.

A subtree of a binary tree tree is a tree that consists of a node in tree and all of this node's descendants. The tree tree could also be considered as a subtree of itself.

For each node in root, check if the subtree rooted there is identical to subRoot using a helper function.

Constraints:
- The number of nodes in the root tree is in the range [1, 2000].
- The number of nodes in the subRoot tree is in the range [1, 1000].
- -10^4 <= root.val <= 10^4
- -10^4 <= subRoot.val <= 10^4

Example 1:
Input: root = [3,4,5,1,2], subRoot = [4,1,2]
Output: true
Explanation: The subtree rooted at node 4 in root matches subRoot exactly.

Example 2:
Input: root = [3,4,5,1,2,null,null,null,null,0], subRoot = [4,1,2]
Output: false`,
    testCases: [
      { input: "root = [3,4,5,1,2]\nsubRoot = [4,1,2]", expectedOutput: "true", isHidden: false },
      { input: "root = [3,4,5,1,2,null,null,null,null,0]\nsubRoot = [4,1,2]", expectedOutput: "false", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/": {
    description: `Given two integer arrays preorder and inorder where preorder is the preorder traversal of a binary tree and inorder is the inorder traversal of the same tree, construct and return the binary tree.

Key insight: the first element of preorder is always the root. Find this root in inorder — everything to its left is in the left subtree, everything to its right is in the right subtree. Recurse.

Constraints:
- 1 <= preorder.length <= 3000
- inorder.length == preorder.length
- -3000 <= preorder[i], inorder[i] <= 3000
- preorder and inorder consist of unique values.
- Each value of inorder also appears in preorder.

Example 1:
Input: preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]
Output: [3,9,20,null,null,15,7]
Explanation: Root is 3. Left subtree has {9}, right subtree has {20,15,7}.

Example 2:
Input: preorder = [-1], inorder = [-1]
Output: [-1]`,
    testCases: [
      { input: "preorder = [3,9,20,15,7]\ninorder = [9,3,15,20,7]", expectedOutput: "[3,9,20,null,null,15,7]", isHidden: false },
      { input: "preorder = [-1]\ninorder = [-1]", expectedOutput: "[-1]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/validate-binary-search-tree/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/check-for-bst/1",
    description: `Given the root of a binary tree, determine if it is a valid binary search tree (BST).

A valid BST is defined as follows:
- The left subtree of a node contains only nodes with keys strictly less than the node's key.
- The right subtree of a node contains only nodes with keys strictly greater than the node's key.
- Both the left and right subtrees must also be binary search trees.

Pass min/max bounds down the recursion: every node must satisfy min < node.val < max.

Constraints:
- The number of nodes in the tree is in the range [1, 10^4].
- -2^31 <= Node.val <= 2^31 - 1

Example 1:
Input: root = [2,1,3]
Output: true

Example 2:
Input: root = [5,1,4,null,null,3,6]
Output: false
Explanation: The root node's value is 5 but its right child's value is 4, which is not greater than 5.`,
    testCases: [
      { input: "root = [2,1,3]", expectedOutput: "true", isHidden: false },
      { input: "root = [5,1,4,null,null,3,6]", expectedOutput: "false", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/kth-smallest-element-in-a-bst/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/find-k-th-smallest-element-in-bst/1",
    description: `Given the root of a binary search tree, and an integer k, return the k-th smallest value (1-indexed) of all the values of the nodes in the tree.

In-order traversal of a BST yields nodes in sorted ascending order. Simply do an in-order traversal and return the k-th element encountered.

Constraints:
- The number of nodes in the tree is n.
- 1 <= k <= n <= 10^4
- 0 <= Node.val <= 10^4

Example 1:
Input: root = [3,1,4,null,2], k = 1
Output: 1
Explanation: In-order: [1,2,3,4]. The 1st smallest is 1.

Example 2:
Input: root = [5,3,6,2,4,null,null,1], k = 3
Output: 3
Explanation: In-order: [1,2,3,4,5,6]. The 3rd smallest is 3.`,
    testCases: [
      { input: "root = [3,1,4,null,2]\nk = 1", expectedOutput: "1", isHidden: false },
      { input: "root = [5,3,6,2,4,null,null,1]\nk = 3", expectedOutput: "3", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/lowest-common-ancestor-in-a-bst/1",
    description: `Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST. The lowest common ancestor is defined between two nodes p and q as the lowest node in T that has both p and q as descendants (where we allow a node to be a descendant of itself).

Use the BST property: if both p and q are less than the current node, go left. If both are greater, go right. Otherwise, the current node is the LCA.

Constraints:
- The number of nodes in the tree is in the range [2, 10^5].
- -10^9 <= Node.val <= 10^9
- All Node.val are unique.
- p != q, and both p and q exist in the BST.

Example 1:
Input: root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8
Output: 6
Explanation: The LCA of nodes 2 and 8 is 6.

Example 2:
Input: root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 4
Output: 2
Explanation: The LCA of nodes 2 and 4 is 2, since a node can be a descendant of itself.`,
    testCases: [
      { input: "root = [6,2,8,0,4,7,9,null,null,3,5]\np = 2, q = 8", expectedOutput: "6", isHidden: false },
      { input: "root = [6,2,8,0,4,7,9,null,null,3,5]\np = 2, q = 4", expectedOutput: "2", isHidden: false },
    ],
  },

  // ─── Dynamic Programming ───────────────────────────────────────────────────

  "https://leetcode.com/problems/climbing-stairs/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/count-ways-to-reach-the-nth-stair-1587115620/1",
    description: `You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?

This is equivalent to the Fibonacci sequence: ways(n) = ways(n-1) + ways(n-2), because you can arrive at step n from step n-1 (one step) or from step n-2 (two steps).

Constraints:
- 1 <= n <= 45

Example 1:
Input: n = 2
Output: 2
Explanation: There are two ways to climb to the top. 1. 1 step + 1 step, 2. 2 steps.

Example 2:
Input: n = 3
Output: 3
Explanation: There are three ways. 1. 1 + 1 + 1, 2. 1 + 2, 3. 2 + 1.`,
    testCases: [
      { input: "n = 2", expectedOutput: "2", isHidden: false },
      { input: "n = 5", expectedOutput: "8", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/coin-change/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/coin-change2448/1",
    description: `You are given an integer array coins representing coins of various denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.

You may assume that you have an infinite number of each kind of coin.

DP approach: dp[i] = minimum coins to make amount i. For each amount, try every coin denomination.

Constraints:
- 1 <= coins.length <= 12
- 1 <= coins[i] <= 2^31 - 1
- 0 <= amount <= 10^4

Example 1:
Input: coins = [1,5,11,25], amount = 30
Output: 2
Explanation: 25 + 5 = 30 using 2 coins.

Example 2:
Input: coins = [1,2,5], amount = 11
Output: 3
Explanation: 11 = 5 + 5 + 1.`,
    testCases: [
      { input: "coins = [1,5,11,25]\namount = 30", expectedOutput: "2", isHidden: false },
      { input: "coins = [1,2,5]\namount = 11", expectedOutput: "3", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/longest-increasing-subsequence/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/longest-increasing-subsequence-1587115620/1",
    description: `Given an integer array nums, return the length of the longest strictly increasing subsequence.

A subsequence is a sequence that can be derived from an array by deleting some or no elements without changing the order of the remaining elements.

The O(n log n) approach uses patience sorting with binary search. The O(n²) DP is: dp[i] = longest subsequence ending at index i = 1 + max(dp[j]) for all j < i where nums[j] < nums[i].

Constraints:
- 1 <= nums.length <= 2500
- -10^4 <= nums[i] <= 10^4

Example 1:
Input: nums = [10,9,2,5,3,7,101,18]
Output: 4
Explanation: The longest increasing subsequence is [2,3,7,101], therefore the length is 4.

Example 2:
Input: nums = [0,1,0,3,2,3]
Output: 4`,
    testCases: [
      { input: "nums = [10,9,2,5,3,7,101,18]", expectedOutput: "4", isHidden: false },
      { input: "nums = [0,1,0,3,2,3]", expectedOutput: "4", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/word-break/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/word-break1352/1",
    description: `Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words.

Note that the same word in the dictionary may be reused multiple times in the segmentation.

DP approach: dp[i] = true if s[0..i-1] can be segmented. For each position i, check all j < i where dp[j] is true and s[j..i-1] is in the dictionary.

Constraints:
- 1 <= s.length <= 300
- 1 <= wordDict.length <= 1000
- 1 <= wordDict[i].length <= 20
- s and wordDict[i] consist of only lowercase English letters.
- All the strings of wordDict are unique.

Example 1:
Input: s = "leetcode", wordDict = ["leet","code"]
Output: true
Explanation: Return true because "leetcode" can be segmented as "leet code".

Example 2:
Input: s = "applepenapple", wordDict = ["apple","pen"]
Output: true
Explanation: Return true because "applepenapple" can be segmented as "apple pen apple".`,
    testCases: [
      { input: 's = "leetcode"\nwordDict = ["leet","code"]', expectedOutput: "true", isHidden: false },
      { input: 's = "catsandog"\nwordDict = ["cats","dog","sand","and","cat"]', expectedOutput: "false", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/combination-sum-iv/": {
    description: `Given an array of distinct integers nums and a target integer target, return the number of possible combinations that add up to target. The answer is guaranteed to fit in a 32-bit integer.

Note that different sequences are counted as different combinations (order matters). This is essentially an "order-matters" knapsack / complete permutation problem.

DP: dp[i] = number of ways to sum to i. For each amount i, try adding each number in nums.

Constraints:
- 1 <= nums.length <= 200
- 1 <= nums[i] <= 1000
- All the elements of nums are unique.
- 1 <= target <= 1000

Example 1:
Input: nums = [1,2,3], target = 4
Output: 7
Explanation: The possible combination ways are: (1,1,1,1), (1,1,2), (1,2,1), (1,3), (2,1,1), (2,2), (3,1).

Example 2:
Input: nums = [9], target = 3
Output: 0`,
    testCases: [
      { input: "nums = [1,2,3]\ntarget = 4", expectedOutput: "7", isHidden: false },
      { input: "nums = [9]\ntarget = 3", expectedOutput: "0", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/house-robber/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/stickler-thief-1587115621/1",
    description: `You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you from robbing each of them is that adjacent houses have security systems connected and it will automatically contact the police if two adjacent houses were broken into on the same night.

Given an integer array nums representing the amount of money of each house, return the maximum amount of money you can rob tonight without alerting the police.

DP: dp[i] = max money robbing up to house i = max(dp[i-1], dp[i-2] + nums[i]).

Constraints:
- 1 <= nums.length <= 100
- 0 <= nums[i] <= 400

Example 1:
Input: nums = [1,2,3,1]
Output: 4
Explanation: Rob house 1 (money = 1) and then rob house 3 (money = 3). Total amount you can rob = 1 + 3 = 4.

Example 2:
Input: nums = [2,7,9,3,1]
Output: 12
Explanation: Rob house 1 (money = 2), rob house 3 (money = 9) and rob house 5 (money = 1). Total = 2 + 9 + 1 = 12.`,
    testCases: [
      { input: "nums = [1,2,3,1]", expectedOutput: "4", isHidden: false },
      { input: "nums = [2,7,9,3,1]", expectedOutput: "12", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/house-robber-ii/": {
    description: `You are a professional robber planning to rob houses along a street. All houses at this place are arranged in a circle. That means the first house is the neighbor of the last one. Meanwhile, adjacent houses have security systems connected.

Given an integer array nums representing the amount of money of each house, return the maximum amount of money you can rob tonight without alerting the police.

Since the first and last houses are adjacent, split into two subproblems: rob houses 0..n-2 OR rob houses 1..n-1. Take the max.

Constraints:
- 1 <= nums.length <= 100
- 0 <= nums[i] <= 1000

Example 1:
Input: nums = [2,3,2]
Output: 3
Explanation: You cannot rob house 1 (money = 2) and then rob house 3 (money = 2), because they are adjacent houses.

Example 2:
Input: nums = [1,2,3,1]
Output: 4
Explanation: Rob house 1 (money = 1) and then rob house 3 (money = 3). Total = 1 + 3 = 4.`,
    testCases: [
      { input: "nums = [2,3,2]", expectedOutput: "3", isHidden: false },
      { input: "nums = [1,2,3,1]", expectedOutput: "4", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/unique-paths/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/number-of-unique-paths5339/1",
    description: `There is a robot on an m x n grid. The robot is initially located at the top-left corner (i.e., grid[0][0]). The robot tries to move to the bottom-right corner (i.e., grid[m - 1][n - 1]). The robot can only move either down or right at any point in time.

Given the two integers m and n, return the number of possible unique paths that the robot can take to reach the bottom-right corner. The test cases are generated so that the answer will be less than or equal to 2 * 10^9.

This equals the binomial coefficient C(m+n-2, n-1) or can be solved with 2D DP where dp[i][j] = dp[i-1][j] + dp[i][j-1].

Constraints:
- 1 <= m, n <= 100

Example 1:
Input: m = 3, n = 7
Output: 28

Example 2:
Input: m = 3, n = 2
Output: 3
Explanation: From the top-left corner, there are a total of 3 ways to reach the bottom-right corner: Right->Down->Down, Down->Right->Down, Down->Down->Right.`,
    testCases: [
      { input: "m = 3\nn = 7", expectedOutput: "28", isHidden: false },
      { input: "m = 3\nn = 2", expectedOutput: "3", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/jump-game/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/jump-game/1",
    description: `You are given an integer array nums. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position.

Return true if you can reach the last index, or false otherwise.

Greedy approach: track the furthest reachable index. At each position, if it's reachable, update the furthest reach. If the furthest reach is >= last index, return true.

Constraints:
- 1 <= nums.length <= 10^4
- 0 <= nums[i] <= 10^5

Example 1:
Input: nums = [2,3,1,1,4]
Output: true
Explanation: Jump 1 step from index 0 to 1, then 3 steps to the last index.

Example 2:
Input: nums = [3,2,1,0,4]
Output: false
Explanation: You will always arrive at index 3 no matter what. Its maximum jump length is 0, which makes it impossible to reach the last index.`,
    testCases: [
      { input: "nums = [2,3,1,1,4]", expectedOutput: "true", isHidden: false },
      { input: "nums = [3,2,1,0,4]", expectedOutput: "false", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/palindromic-substrings/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/count-palindrome-sub-strings-of-a-string0652/1",
    description: `Given a string s, return the number of palindromic substrings in it. A string is a palindrome when it reads the same backward as forward.

A substring is a contiguous sequence of characters within the string.

Expand-around-center approach: for each center (both single-character and between-character gaps), expand outward while characters match. Each successful expansion counts one palindrome.

Constraints:
- 1 <= s.length <= 1000
- s consists of lowercase English letters.

Example 1:
Input: s = "abc"
Output: 3
Explanation: Three palindromic strings: "a", "b", "c".

Example 2:
Input: s = "aaa"
Output: 6
Explanation: Six palindromic strings: "a", "a", "a", "aa", "aa", "aaa".`,
    testCases: [
      { input: 's = "abc"', expectedOutput: "3", isHidden: false },
      { input: 's = "aaa"', expectedOutput: "6", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/longest-palindromic-substring/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/longest-palindrome-in-a-string3411/1",
    description: `Given a string s, return the longest palindromic substring in s.

Use the expand-around-center technique: for each position (and gap between positions), expand outward while characters match. Track the longest palindrome found.

Alternatively, Manacher's algorithm solves this in O(n) time.

Constraints:
- 1 <= s.length <= 1000
- s consists of only digits and English letters.

Example 1:
Input: s = "babad"
Output: "bab"
Explanation: "aba" is also a valid answer.

Example 2:
Input: s = "cbbd"
Output: "bb"`,
    testCases: [
      { input: 's = "babad"', expectedOutput: '"bab"', isHidden: false },
      { input: 's = "cbbd"', expectedOutput: '"bb"', isHidden: false },
    ],
  },

  "https://leetcode.com/problems/decode-ways/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/total-decoding-messages1235/1",
    description: `A message containing letters from A-Z can be encoded into numbers using: 'A' -> "1", 'B' -> "2", ..., 'Z' -> "26".

To decode an encoded message, all the digits must be grouped then mapped back into letters using the reverse of the mapping above (there may be multiple ways). Given a string s containing only digits, return the number of ways to decode it.

The test cases are generated so that the answer fits in a 32-bit integer.

DP: dp[i] = ways to decode s[0..i-1]. One-digit decode: dp[i] += dp[i-1] if s[i-1] != '0'. Two-digit decode: dp[i] += dp[i-2] if s[i-2..i-1] is between "10" and "26".

Constraints:
- 1 <= s.length <= 100
- s contains only digits and may contain leading zero(s).

Example 1:
Input: s = "12"
Output: 2
Explanation: "12" could be decoded as "AB" (1 2) or "L" (12).

Example 2:
Input: s = "226"
Output: 3
Explanation: "226" could be decoded as "BZ" (2 26), "VF" (22 6), or "BBF" (2 2 6).`,
    testCases: [
      { input: 's = "12"', expectedOutput: "2", isHidden: false },
      { input: 's = "226"', expectedOutput: "3", isHidden: false },
    ],
  },

  // ─── Graphs ────────────────────────────────────────────────────────────────

  "https://leetcode.com/problems/clone-graph/": {
    description: `Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph.

Each node in the graph contains a value (int) and a list (List[Node]) of its neighbors.

Use a hash map to map original nodes to their clones. DFS or BFS from the given node, and for each visited node, create a clone and recursively clone its neighbors.

Constraints:
- The number of nodes in the graph is in the range [0, 100].
- 1 <= Node.val <= 100
- Node.val is unique for each node.
- There are no repeated edges and no self-loops in the graph.
- The Graph is connected and all nodes can be visited starting from the given node.

Example 1:
Input: adjList = [[2,4],[1,3],[2,4],[1,3]]
Output: [[2,4],[1,3],[2,4],[1,3]]
Explanation: The graph has 4 nodes. Node 1's neighbors are 2 and 4. The clone is identical.

Example 2:
Input: adjList = [[]]
Output: [[]]`,
    testCases: [
      { input: "adjList = [[2,4],[1,3],[2,4],[1,3]]", expectedOutput: "[[2,4],[1,3],[2,4],[1,3]]", isHidden: false },
      { input: "adjList = [[2],[1]]", expectedOutput: "[[2],[1]]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/course-schedule/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/prerequisite-tasks/1",
    description: `There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai.

Return true if you can finish all courses otherwise, return false.

This is a cycle detection problem on a directed graph. Use DFS with three states (unvisited, visiting, visited) or Kahn's algorithm (topological sort with in-degree counting).

Constraints:
- 1 <= numCourses <= 2000
- 0 <= prerequisites.length <= 5000
- prerequisites[i].length == 2
- 0 <= ai, bi < numCourses
- All the pairs prerequisites[i] are unique.

Example 1:
Input: numCourses = 2, prerequisites = [[1,0]]
Output: true
Explanation: There are 2 courses to take. To take course 1 you should have finished course 0. So it is possible.

Example 2:
Input: numCourses = 2, prerequisites = [[1,0],[0,1]]
Output: false
Explanation: There are 2 courses to take. To take course 1 you should have finished course 0, and to take course 0 you should also have finished course 1. So it is impossible.`,
    testCases: [
      { input: "numCourses = 2\nprerequisites = [[1,0]]", expectedOutput: "true", isHidden: false },
      { input: "numCourses = 2\nprerequisites = [[1,0],[0,1]]", expectedOutput: "false", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/pacific-atlantic-water-flow/": {
    description: `There is an m x n rectangular island that borders both the Pacific Ocean and Atlantic Ocean. The Pacific Ocean touches the island's left and top edges, and the Atlantic Ocean touches the island's right and bottom edges.

The island is partitioned into a grid of square cells. You are given an m x n integer matrix heights where heights[r][c] represents the height above sea level of the cell at coordinate (r, c).

The island receives a lot of rain, and the rain water can flow to neighboring cells directly north, south, east, and west if the neighboring cell's height is less than or equal to the current cell's height. Water can flow from any cell adjacent to an ocean into the ocean.

Return a 2D list of grid coordinates result where result[i] = [ri, ci] denotes that rain water can flow from cell (ri, ci) to both the Pacific and the Atlantic oceans.

Approach: reverse BFS/DFS from each ocean's border inward. Mark cells reachable from Pacific and cells reachable from Atlantic. Return cells in both sets.

Constraints:
- m == heights.length
- n == heights[r].length
- 1 <= m, n <= 200
- 0 <= heights[r][c] <= 10^5

Example 1:
Input: heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]
Output: [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]

Example 2:
Input: heights = [[2,1],[1,2]]
Output: [[0,0],[0,1],[1,0],[1,1]]`,
    testCases: [
      { input: "heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]", expectedOutput: "[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]", isHidden: false },
      { input: "heights = [[2,1],[1,2]]", expectedOutput: "[[0,0],[0,1],[1,0],[1,1]]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/number-of-islands/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/find-the-number-of-islands/1",
    description: `Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.

Approach: iterate through the grid; when you find a '1', increment the island count and use DFS/BFS to mark all connected land cells as visited (e.g., change to '0').

Constraints:
- m == grid.length
- n == grid[i].length
- 1 <= m, n <= 300
- grid[i][j] is '0' or '1'.

Example 1:
Input: grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]
Output: 1

Example 2:
Input: grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]
Output: 3`,
    testCases: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expectedOutput: "1", isHidden: false },
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expectedOutput: "3", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/longest-consecutive-sequence/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/longest-consecutive-subsequence2449/1",
    description: `Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence.

You must write an algorithm that runs in O(n) time.

Approach: add all numbers to a hash set. For each number, only start counting a sequence from numbers that have no predecessor (n-1 not in set). Then count upward from there.

Constraints:
- 0 <= nums.length <= 10^5
- -10^9 <= nums[i] <= 10^9

Example 1:
Input: nums = [100,4,200,1,3,2]
Output: 4
Explanation: The longest consecutive elements sequence is [1, 2, 3, 4]. Therefore its length is 4.

Example 2:
Input: nums = [0,3,7,2,5,8,4,6,0,1]
Output: 9`,
    testCases: [
      { input: "nums = [100,4,200,1,3,2]", expectedOutput: "4", isHidden: false },
      { input: "nums = [0,3,7,2,5,8,4,6,0,1]", expectedOutput: "9", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/": {
    description: `You have a graph of n nodes. You are given an integer n and an array edges where edges[i] = [ai, bi] indicates that there is an edge between nodes ai and bi in the graph.

Return the number of connected components in the graph.

Approaches: Union-Find (disjoint set union) is very efficient here — for each edge, union the two nodes. Count the number of distinct roots at the end. Alternatively, use DFS/BFS marking visited nodes.

Constraints:
- 1 <= n <= 2000
- 1 <= edges.length <= 5000
- edges[i].length == 2
- 0 <= ai <= bi < n
- ai != bi
- There are no repeated edges.

Example 1:
Input: n = 5, edges = [[0,1],[1,2],[3,4]]
Output: 2
Explanation: Nodes {0,1,2} form one component and {3,4} form another.

Example 2:
Input: n = 5, edges = [[0,1],[1,2],[2,3],[3,4]]
Output: 1`,
    testCases: [
      { input: "n = 5\nedges = [[0,1],[1,2],[3,4]]", expectedOutput: "2", isHidden: false },
      { input: "n = 5\nedges = [[0,1],[1,2],[2,3],[3,4]]", expectedOutput: "1", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/graph-valid-tree/": {
    description: `You have a graph of n nodes labeled from 0 to n - 1. You are given an integer n and a list of edges where edges[i] = [ai, bi] indicates that there is an undirected edge between nodes ai and bi in the graph.

Return true if the edges of the given graph make up a valid tree, and false otherwise.

A graph is a valid tree if it has exactly n-1 edges AND is connected (no cycles). Use Union-Find: if adding an edge creates a cycle (both nodes already in the same component), return false. After processing all edges, check connectivity.

Constraints:
- 1 <= n <= 2000
- 0 <= edges.length <= 5000
- edges[i].length == 2
- 0 <= ai, bi < n
- ai != bi
- There are no self-loops or repeated edges.

Example 1:
Input: n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]
Output: true

Example 2:
Input: n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]
Output: false
Explanation: Edge [1,3] creates a cycle.`,
    testCases: [
      { input: "n = 5\nedges = [[0,1],[0,2],[0,3],[1,4]]", expectedOutput: "true", isHidden: false },
      { input: "n = 5\nedges = [[0,1],[1,2],[2,3],[1,3],[1,4]]", expectedOutput: "false", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/alien-dictionary/": {
    description: `There is a new alien language that uses the English alphabet. However, the order among the letters is unknown to you.

You are given a list of strings words from the alien language's dictionary, where the strings in words are sorted lexicographically by the rules of this new language.

Return a string of the unique letters in the new alien language sorted in lexicographically increasing order by the new language's rules. If there is no solution, return "". If there are multiple solutions, return any of them.

Build a directed graph: for each adjacent pair of words, find the first differing character — that gives an ordering constraint (edge). Then do topological sort (Kahn's algorithm). If a cycle is detected, return "".

Constraints:
- 1 <= words.length <= 100
- 1 <= words[i].length <= 100
- words[i] consists of only lowercase English letters.

Example 1:
Input: words = ["wrt","wrf","er","ett","rftt"]
Output: "wertf"

Example 2:
Input: words = ["z","x"]
Output: "zx"`,
    testCases: [
      { input: 'words = ["wrt","wrf","er","ett","rftt"]', expectedOutput: '"wertf"', isHidden: false },
      { input: 'words = ["z","x"]', expectedOutput: '"zx"', isHidden: false },
    ],
  },

  // ─── Linked List ───────────────────────────────────────────────────────────

  "https://leetcode.com/problems/reverse-linked-list/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/reverse-a-linked-list/1",
    description: `Given the head of a singly linked list, reverse the list, and return the reversed list.

Iterative approach: maintain prev and current pointers. At each step, save current.next, point current.next to prev, advance prev to current, advance current to the saved next.

Constraints:
- The number of nodes in the list is the range [0, 5000].
- -5000 <= Node.val <= 5000

Example 1:
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]

Example 2:
Input: head = [1,2]
Output: [2,1]`,
    testCases: [
      { input: "head = [1,2,3,4,5]", expectedOutput: "[5,4,3,2,1]", isHidden: false },
      { input: "head = [1,2]", expectedOutput: "[2,1]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/linked-list-cycle/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/detect-loop-in-linked-list/1",
    description: `Given head, the head of a linked list, determine if the linked list has a cycle in it.

There is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the next pointer.

Use Floyd's cycle detection (slow and fast pointers): if they ever meet, there's a cycle. If fast reaches null, there's no cycle.

Constraints:
- The number of the nodes in the list is in the range [0, 10^4].
- -10^5 <= Node.val <= 10^5
- pos is -1 or a valid index in the linked-list.

Example 1:
Input: head = [3,2,0,-4], pos = 1
Output: true
Explanation: There is a cycle in the linked list, where the tail connects to the 1st node (0-indexed).

Example 2:
Input: head = [1,2], pos = -1
Output: false
Explanation: There is no cycle in the linked list.`,
    testCases: [
      { input: "head = [3,2,0,-4]\npos = 1", expectedOutput: "true", isHidden: false },
      { input: "head = [1,2]\npos = -1", expectedOutput: "false", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/merge-two-sorted-lists/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/merge-two-sorted-linked-lists/1",
    description: `You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.

Use a dummy head node and iterate through both lists, always attaching the smaller node. Once one list is exhausted, attach the remaining nodes of the other.

Constraints:
- The number of nodes in both lists is in the range [0, 50].
- -100 <= Node.val <= 100
- Both list1 and list2 are sorted in non-decreasing order.

Example 1:
Input: list1 = [1,2,4], list2 = [1,3,4]
Output: [1,1,2,3,4,4]

Example 2:
Input: list1 = [], list2 = [0]
Output: [0]`,
    testCases: [
      { input: "list1 = [1,2,4]\nlist2 = [1,3,4]", expectedOutput: "[1,1,2,3,4,4]", isHidden: false },
      { input: "list1 = []\nlist2 = [0]", expectedOutput: "[0]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/merge-k-sorted-lists/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/merge-k-sorted-linked-lists/1",
    description: `You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.

Efficient approach: use a min-heap (priority queue). Insert the head of each list. Repeatedly extract the minimum, add it to the result, and insert its next node. Time: O(N log k) where N is total nodes.

Alternative: divide and conquer — merge pairs of lists, reducing k lists to k/2, then k/4, etc.

Constraints:
- k == lists.length
- 0 <= k <= 10^4
- 0 <= lists[i].length <= 500
- -10^4 <= lists[i][j] <= 10^4
- lists[i] is sorted in ascending order.
- The sum of lists[i].length will not exceed 10^4.

Example 1:
Input: lists = [[1,4,5],[1,3,4],[2,6]]
Output: [1,1,2,3,4,4,5,6]

Example 2:
Input: lists = []
Output: []`,
    testCases: [
      { input: "lists = [[1,4,5],[1,3,4],[2,6]]", expectedOutput: "[1,1,2,3,4,4,5,6]", isHidden: false },
      { input: "lists = [[1],[0]]", expectedOutput: "[0,1]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/remove-nth-node-from-end-of-list/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/nth-node-from-end-of-linked-list/1",
    description: `Given the head of a linked list, remove the n-th node from the end of the list and return its head.

One-pass approach: use two pointers. Advance the fast pointer n+1 steps ahead. Then advance both pointers until fast reaches null. At that point, slow.next is the node to remove.

Constraints:
- The number of nodes in the list is sz.
- 1 <= sz <= 30
- 0 <= Node.val <= 100
- 1 <= n <= sz

Example 1:
Input: head = [1,2,3,4,5], n = 2
Output: [1,2,3,5]
Explanation: The 2nd node from the end is node 4.

Example 2:
Input: head = [1], n = 1
Output: []`,
    testCases: [
      { input: "head = [1,2,3,4,5]\nn = 2", expectedOutput: "[1,2,3,5]", isHidden: false },
      { input: "head = [1,2]\nn = 1", expectedOutput: "[1]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/reorder-list/": {
    description: `You are given the head of a singly linked-list: L0 → L1 → … → Ln-1 → Ln. Reorder it to: L0 → Ln → L1 → Ln-1 → L2 → Ln-2 → …

You may not modify the values in the list's nodes. Only nodes themselves may be changed.

Steps: (1) Find the middle using slow/fast pointers. (2) Reverse the second half. (3) Merge the two halves by interleaving.

Constraints:
- The number of nodes in the list is in the range [1, 5 * 10^4].
- 1 <= Node.val <= 1000

Example 1:
Input: head = [1,2,3,4]
Output: [1,4,2,3]

Example 2:
Input: head = [1,2,3,4,5]
Output: [1,5,2,4,3]`,
    testCases: [
      { input: "head = [1,2,3,4]", expectedOutput: "[1,4,2,3]", isHidden: false },
      { input: "head = [1,2,3,4,5]", expectedOutput: "[1,5,2,4,3]", isHidden: false },
    ],
  },

  // ─── Heap ──────────────────────────────────────────────────────────────────

  "https://leetcode.com/problems/top-k-frequent-elements/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/top-k-frequent-elements-in-array/1",
    description: `Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.

Approach 1 (Heap): build a frequency map, then use a min-heap of size k. Time: O(n log k).
Approach 2 (Bucket sort): create an array of size n+1 where index i holds all numbers that appear exactly i times. Scan from right. Time: O(n).

Constraints:
- 1 <= nums.length <= 10^5
- -10^4 <= nums[i] <= 10^4
- k is in the range [1, the number of unique elements in the array].
- It is guaranteed that the answer is unique.

Example 1:
Input: nums = [1,1,1,2,2,3], k = 2
Output: [1,2]
Explanation: 1 appears 3 times, 2 appears 2 times. The top-2 are [1, 2].

Example 2:
Input: nums = [1], k = 1
Output: [1]`,
    testCases: [
      { input: "nums = [1,1,1,2,2,3]\nk = 2", expectedOutput: "[1,2]", isHidden: false },
      { input: "nums = [1]\nk = 1", expectedOutput: "[1]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/find-median-from-data-stream/": {
    description: `The median is the middle value in an ordered integer list. If the size of the list is even, there is no middle value, and the median is the mean of the two middle values.

Implement the MedianFinder class:
- MedianFinder() initializes the MedianFinder object.
- void addNum(int num) adds the integer num from the data stream to the data structure.
- double findMedian() returns the median of all elements so far.

Use two heaps: a max-heap for the lower half and a min-heap for the upper half. Keep them balanced so the median is always the top of one heap (odd total) or the average of both tops (even total).

Constraints:
- -10^5 <= num <= 10^5
- There will be at least one element in the data structure before calling findMedian.
- At most 5 * 10^4 calls will be made to addNum and findMedian.

Example 1:
Input: ["MedianFinder","addNum","addNum","findMedian","addNum","findMedian"] with args [[],[1],[2],[],[3],[]]
Output: [null,null,null,1.5,null,2.0]
Explanation: addNum(1): lower=[1], upper=[]. addNum(2): lower=[1], upper=[2]. findMedian() = (1+2)/2 = 1.5. addNum(3): lower=[1,2], upper=[3]. findMedian() = 2.0.

Example 2:
Input: addNum(1), addNum(3), findMedian()
Output: 2.0`,
    testCases: [
      { input: 'ops = ["addNum","addNum","findMedian","addNum","findMedian"]\nvals = [1,2,null,3,null]', expectedOutput: "[null,null,1.5,null,2.0]", isHidden: false },
      { input: 'ops = ["addNum","addNum","findMedian"]\nvals = [6,10,null]', expectedOutput: "[null,null,8.0]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/meeting-rooms-ii/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/attend-all-meetings/1",
    description: `Given an array of meeting time intervals intervals where intervals[i] = [starti, endi], return the minimum number of conference rooms required.

Approach: sort by start time. Use a min-heap of end times. For each meeting, if the earliest ending meeting has finished (heap top <= current start), reuse that room (pop and push new end time). Otherwise, add a new room (push new end time). The heap size at the end is the answer.

Constraints:
- 1 <= intervals.length <= 10^4
- 0 <= starti < endi <= 10^6

Example 1:
Input: intervals = [[0,30],[5,10],[15,20]]
Output: 2
Explanation: Two rooms needed: room 1 has [0,30], room 2 has [5,10] and then [15,20].

Example 2:
Input: intervals = [[7,10],[2,4]]
Output: 1
Explanation: The meetings don't overlap; only one room is needed.`,
    testCases: [
      { input: "intervals = [[0,30],[5,10],[15,20]]", expectedOutput: "2", isHidden: false },
      { input: "intervals = [[7,10],[2,4]]", expectedOutput: "1", isHidden: false },
    ],
  },

  // ─── Trie ──────────────────────────────────────────────────────────────────

  "https://leetcode.com/problems/implement-trie-prefix-tree/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/trie-insert-and-search0651/1",
    description: `A trie (pronounced as "try") or prefix tree is a tree data structure used to efficiently store and retrieve keys in a dataset of strings. There are various applications of this data structure, such as autocomplete and spellchecker.

Implement the Trie class:
- Trie() Initializes the trie object.
- void insert(String word) Inserts the string word into the trie.
- boolean search(String word) Returns true if the string word is in the trie (i.e., was inserted before), and false otherwise.
- boolean startsWith(String prefix) Returns true if there is a previously inserted string word that has the prefix prefix, and false otherwise.

Each TrieNode contains an array (or map) of 26 children and a boolean isEnd flag.

Constraints:
- 1 <= word.length, prefix.length <= 2000
- word and prefix consist only of lowercase English letters.
- At most 3 * 10^4 calls in total will be made to insert, search, and startsWith.

Example 1:
Input: ["Trie","insert","search","search","startsWith","insert","search"] with args [[],["apple"],["apple"],["app"],["app"],["app"],["app"]]
Output: [null,null,true,false,true,null,true]
Explanation: insert("apple") → search("apple") → true, search("app") → false (not inserted), startsWith("app") → true, insert("app"), search("app") → true.

Example 2:
Input: insert("hello"), search("hell"), startsWith("hell")
Output: false, true`,
    testCases: [
      { input: 'ops = ["insert","search","search","startsWith"]\nvals = ["apple","apple","app","app"]', expectedOutput: "[null,true,false,true]", isHidden: false },
      { input: 'ops = ["insert","insert","search","startsWith"]\nvals = ["app","apple","apple","ap"]', expectedOutput: "[null,null,true,true]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/design-add-and-search-words-data-structure/": {
    description: `Design a data structure that supports adding new words and finding if a string matches any previously added string.

Implement the WordDictionary class:
- WordDictionary() Initializes the object.
- void addWord(word) Adds word to the data structure, it can be matched later.
- bool search(word) Returns true if there is any string in the data structure that matches word or false otherwise. word may contain dots '.' where dots can be matched with any letter.

Use a Trie. During search, when you encounter '.', recursively check all 26 child branches.

Constraints:
- 1 <= word.length <= 25
- word in addWord consists of lowercase English letters.
- word in search consist of '.' or lowercase English letters.
- There will be at most 3 dots in word for search queries.
- At most 10^4 calls will be made to addWord and search.

Example 1:
Input: ["addWord","addWord","search","search","search","search"] with args [["bad"],["dad"],["pad"],["bad"],[".ad"],["b.."]]
Output: [null,null,false,true,true,true]

Example 2:
Input: addWord("a"), search(".")
Output: true`,
    testCases: [
      { input: 'ops = ["addWord","addWord","search","search"]\nvals = ["bad","dad","pad","bad"]', expectedOutput: "[null,null,false,true]", isHidden: false },
      { input: 'ops = ["addWord","search","search"]\nvals = ["at",".t","a."]', expectedOutput: "[null,true,true]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/word-search-ii/": {
    description: `Given an m x n board of characters and a list of strings words, return all words on the board.

Each word must be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once in a word.

Optimal approach: build a Trie from all words. DFS from each cell, pruning branches not in the Trie. Mark visited cells during DFS. Remove found words from Trie to avoid duplicates.

Constraints:
- m == board.length
- n == board[i].length
- 1 <= m, n <= 12
- board[i][j] is a lowercase English letter.
- 1 <= words.length <= 3 * 10^4
- 1 <= words[i].length <= 10
- words[i] consists of lowercase English letters.
- All the strings of words are unique.

Example 1:
Input: board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]
Output: ["eat","oath"]

Example 2:
Input: board = [["a","b"],["c","d"]], words = ["abcb"]
Output: []`,
    testCases: [
      { input: 'board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]]\nwords = ["oath","pea","eat","rain"]', expectedOutput: '["eat","oath"]', isHidden: false },
      { input: 'board = [["a","b"],["c","d"]]\nwords = ["abcb"]', expectedOutput: "[]", isHidden: false },
    ],
  },

  // ─── Backtracking ──────────────────────────────────────────────────────────

  "https://leetcode.com/problems/combination-sum/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/combination-sum-part-2/1",
    description: `Given an array of distinct integers candidates and a target integer target, return a list of all unique combinations of candidates where the chosen numbers sum to target. You may return the combinations in any order.

The same number may be chosen from candidates an unlimited number of times. Two combinations are unique if the frequency of at least one of the chosen numbers is different.

The test cases are generated such that the number of unique combinations that sum up to target is less than 150 combinations for the given input.

Use backtracking: at each step, either include a candidate (can reuse) or skip to the next one. Prune branches where the remaining sum < 0.

Constraints:
- 1 <= candidates.length <= 30
- 2 <= candidates[i] <= 40
- All elements of candidates are distinct.
- 1 <= target <= 40

Example 1:
Input: candidates = [2,3,6,7], target = 7
Output: [[2,2,3],[7]]
Explanation: 2+2+3=7 and 7=7. No other combinations sum to 7.

Example 2:
Input: candidates = [2,3,8], target = 11
Output: [[2,3,6],[3,8]]`,
    testCases: [
      { input: "candidates = [2,3,6,7]\ntarget = 7", expectedOutput: "[[2,2,3],[7]]", isHidden: false },
      { input: "candidates = [2,3,5]\ntarget = 8", expectedOutput: "[[2,2,2,2],[2,3,3],[3,5]]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/word-search/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/word-search/1",
    description: `Given an m x n grid of characters board and a string word, return true if word exists in the grid. The word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once.

DFS backtracking: for each cell, attempt to match the word character by character. Mark cells as visited (temporarily modify the board) and restore them after backtracking.

Constraints:
- m == board.length
- n == board[i].length
- 1 <= m, n <= 6
- 1 <= word.length <= 15
- board and word consists of only lowercase and uppercase English letters.

Example 1:
Input: board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"
Output: true
Explanation: The path A(0,0)→B(0,1)→C(0,2)→C(1,2)→E(2,2)→D(2,1) spells "ABCCED".

Example 2:
Input: board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"
Output: true`,
    testCases: [
      { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]\nword = "ABCCED"', expectedOutput: "true", isHidden: false },
      { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]\nword = "ABCB"', expectedOutput: "false", isHidden: false },
    ],
  },

  // ─── Bit Manipulation ──────────────────────────────────────────────────────

  "https://leetcode.com/problems/sum-of-two-integers/": {
    description: `Given two integers a and b, return the sum of the two integers without using the operators + and -.

Use bit manipulation: XOR gives the sum without carries. AND followed by left-shift gives the carry. Repeat until there is no carry.

Constraints:
- -1000 <= a, b <= 1000

Example 1:
Input: a = 1, b = 2
Output: 3

Example 2:
Input: a = 2, b = 3
Output: 5`,
    testCases: [
      { input: "a = 1\nb = 2", expectedOutput: "3", isHidden: false },
      { input: "a = 2\nb = 3", expectedOutput: "5", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/number-of-1-bits/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/set-bits0143/1",
    description: `Write a function that takes the binary representation of a positive integer and returns the number of set bits it has (also known as the Hamming weight).

Approaches:
1. n & (n-1) clears the lowest set bit; count how many times you can do this until n is 0.
2. Use built-in popcount/bit_count.

Constraints:
- 1 <= n <= 2^31 - 1

Example 1:
Input: n = 11 (binary: 1011)
Output: 3
Explanation: The binary representation has three '1' bits.

Example 2:
Input: n = 128 (binary: 10000000)
Output: 1`,
    testCases: [
      { input: "n = 11", expectedOutput: "3", isHidden: false },
      { input: "n = 128", expectedOutput: "1", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/counting-bits/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/count-total-set-bits-1587115620/1",
    description: `Given an integer n, return an array ans of length n + 1 such that for each i (0 <= i <= n), ans[i] is the number of 1's in the binary representation of i.

DP insight: ans[i] = ans[i >> 1] + (i & 1). The number of 1-bits in i equals the number of 1-bits in i/2 plus the last bit of i.

Constraints:
- 0 <= n <= 10^5

Example 1:
Input: n = 2
Output: [0,1,1]
Explanation: 0 → 0 bits, 1 → 1 bit, 2 (10 in binary) → 1 bit.

Example 2:
Input: n = 5
Output: [0,1,1,2,1,2]
Explanation: 0→0, 1→1, 2→1, 3→2, 4→1, 5→2.`,
    testCases: [
      { input: "n = 2", expectedOutput: "[0,1,1]", isHidden: false },
      { input: "n = 5", expectedOutput: "[0,1,1,2,1,2]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/missing-number/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/missing-number-in-array1416/1",
    description: `Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.

Approach 1: XOR all numbers 0 to n with all numbers in the array. The result is the missing number (everything else cancels).
Approach 2: Sum formula — expected sum is n*(n+1)/2, subtract actual sum.

Constraints:
- n == nums.length
- 1 <= n <= 10^4
- 0 <= nums[i] <= n
- All the numbers of nums are unique.

Example 1:
Input: nums = [3,0,1]
Output: 2
Explanation: n = 3 since there are 3 numbers. The range is [0,3]. 2 is missing.

Example 2:
Input: nums = [0,1]
Output: 2`,
    testCases: [
      { input: "nums = [3,0,1]", expectedOutput: "2", isHidden: false },
      { input: "nums = [0,1]", expectedOutput: "2", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/reverse-bits/": {
    description: `Reverse bits of a given 32 bits unsigned integer.

Approach: iterate 32 times. At each step, shift the result left by 1, OR in the last bit of n (n & 1), then shift n right by 1.

Note: In some languages such as Java, there is no unsigned integer type. In this case, both input and output will be given as a signed integer type. They should not affect your implementation, as the integer's internal binary representation is the same, whether it is signed or unsigned.

Constraints:
- The input must be a binary string of length 32.

Example 1:
Input: n = 00000010100101000001111010011100
Output: 964176192 (00111001011110000010100101000000)
Explanation: The input binary string represents the unsigned integer 43261596, and the reversed output is 964176192.

Example 2:
Input: n = 11111111111111111111111111111101
Output: 3221225471 (10111111111111111111111111111111)`,
    testCases: [
      { input: "n = 43261596", expectedOutput: "964176192", isHidden: false },
      { input: "n = 0", expectedOutput: "0", isHidden: false },
    ],
  },

  // ─── Matrix ────────────────────────────────────────────────────────────────

  "https://leetcode.com/problems/set-matrix-zeroes/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/matrix-elements-in-snake-like-pattern/1",
    description: `Given an m x n integer matrix matrix, if an element is 0, set its entire row and column to 0's. You must do it in place.

Optimal O(1) space approach: use the first row and first column as markers. First record whether the first row/column themselves contain a zero, then use them to mark other rows/columns.

Constraints:
- m == matrix.length
- n == matrix[0].length
- 1 <= m, n <= 200
- -2^31 <= matrix[i][j] <= 2^31 - 1

Example 1:
Input: matrix = [[1,1,1],[1,0,1],[1,1,1]]
Output: [[1,0,1],[0,0,0],[1,0,1]]
Explanation: The cell (1,1) is 0, so row 1 and column 1 become all zeros.

Example 2:
Input: matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]
Output: [[0,0,0,0],[0,4,5,0],[0,3,1,0]]`,
    testCases: [
      { input: "matrix = [[1,1,1],[1,0,1],[1,1,1]]", expectedOutput: "[[1,0,1],[0,0,0],[1,0,1]]", isHidden: false },
      { input: "matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]", expectedOutput: "[[0,0,0,0],[0,4,5,0],[0,3,1,0]]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/spiral-matrix/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/spirally-traversing-a-matrix-1587115621/1",
    description: `Given an m x n matrix, return all elements of the matrix in spiral order.

Use four boundary pointers (top, bottom, left, right). Traverse the top row left to right, right column top to bottom, bottom row right to left, left column bottom to top. After each traversal, shrink the corresponding boundary.

Constraints:
- m == matrix.length
- n == matrix[0].length
- 1 <= m, n <= 10
- -100 <= matrix[i][j] <= 100

Example 1:
Input: matrix = [[1,2,3],[4,5,6],[7,8,9]]
Output: [1,2,3,6,9,8,7,4,5]

Example 2:
Input: matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]
Output: [1,2,3,4,8,12,11,10,9,5,6,7]`,
    testCases: [
      { input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", expectedOutput: "[1,2,3,6,9,8,7,4,5]", isHidden: false },
      { input: "matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]", expectedOutput: "[1,2,3,4,8,12,11,10,9,5,6,7]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/rotate-image/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/rotate-by-90-degree-1587115621/1",
    description: `You are given an n x n 2D matrix representing an image. Rotate the image by 90 degrees (clockwise) in place.

Two-step approach: (1) Transpose the matrix (swap matrix[i][j] with matrix[j][i]). (2) Reverse each row. This achieves a 90-degree clockwise rotation.

Constraints:
- n == matrix.length == matrix[i].length
- 1 <= n <= 20
- -1000 <= matrix[i][j] <= 1000

Example 1:
Input: matrix = [[1,2,3],[4,5,6],[7,8,9]]
Output: [[7,4,1],[8,5,2],[9,6,3]]

Example 2:
Input: matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]
Output: [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]`,
    testCases: [
      { input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", expectedOutput: "[[7,4,1],[8,5,2],[9,6,3]]", isHidden: false },
      { input: "matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]", expectedOutput: "[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]", isHidden: false },
    ],
  },

  // ─── Intervals ─────────────────────────────────────────────────────────────

  "https://leetcode.com/problems/insert-interval/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/insert-interval/1",
    description: `You are given an array of non-overlapping intervals intervals where intervals[i] = [starti, endi] represent the start and the end of the i-th interval and intervals is sorted in ascending order by starti. You are also given an interval newInterval = [start, end] that represents the start and end of another interval.

Insert newInterval into intervals such that intervals is still sorted in ascending order by starti and intervals still does not have any overlapping intervals (merge overlapping intervals if necessary).

Return intervals after the insertion.

You don't need to modify intervals in-place. You can make a new array and return it.

Constraints:
- 0 <= intervals.length <= 10^4
- intervals[i].length == 2
- 0 <= starti <= endi <= 10^5
- intervals is sorted by starti in ascending order.
- newInterval.length == 2
- 0 <= start <= end <= 10^5

Example 1:
Input: intervals = [[1,3],[6,9]], newInterval = [2,5]
Output: [[1,5],[6,9]]
Explanation: [1,3] and [2,5] overlap; merge to [1,5].

Example 2:
Input: intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]
Output: [[1,2],[3,10],[12,16]]
Explanation: The new interval [4,8] overlaps with [3,5],[6,7],[8,10].`,
    testCases: [
      { input: "intervals = [[1,3],[6,9]]\nnewInterval = [2,5]", expectedOutput: "[[1,5],[6,9]]", isHidden: false },
      { input: "intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]]\nnewInterval = [4,8]", expectedOutput: "[[1,2],[3,10],[12,16]]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/merge-intervals/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/overlapping-intervals--170633/1",
    description: `Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.

Sort by start time. Then iterate: if the current interval overlaps with the last merged interval (current.start <= last.end), merge them by updating last.end = max(last.end, current.end). Otherwise, add the current interval as new.

Constraints:
- 1 <= intervals.length <= 10^4
- intervals[i].length == 2
- 0 <= starti <= endi <= 10^4

Example 1:
Input: intervals = [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]
Explanation: Since intervals [1,3] and [2,6] overlap, merge them into [1,6].

Example 2:
Input: intervals = [[1,4],[4,5]]
Output: [[1,5]]
Explanation: Intervals [1,4] and [4,5] are considered overlapping.`,
    testCases: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", expectedOutput: "[[1,6],[8,10],[15,18]]", isHidden: false },
      { input: "intervals = [[1,4],[4,5]]", expectedOutput: "[[1,5]]", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/non-overlapping-intervals/": {
    description: `Given an array of intervals intervals where intervals[i] = [starti, endi], return the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.

Note that intervals which only touch at a point are non-overlapping. For example, [1, 2] and [2, 3] are non-overlapping.

Greedy: sort by end time. Greedily keep intervals that end earliest (they leave more room for future intervals). Count intervals that must be removed because they overlap with the last kept interval.

Constraints:
- 1 <= intervals.length <= 10^5
- intervals[i].length == 2
- -5 * 10^4 <= starti < endi <= 5 * 10^4

Example 1:
Input: intervals = [[1,2],[2,3],[3,4],[1,3]]
Output: 1
Explanation: [1,3] can be removed and the rest of the intervals are non-overlapping.

Example 2:
Input: intervals = [[1,2],[1,2],[1,2]]
Output: 2
Explanation: You need to remove two [1,2] to make the rest non-overlapping.`,
    testCases: [
      { input: "intervals = [[1,2],[2,3],[3,4],[1,3]]", expectedOutput: "1", isHidden: false },
      { input: "intervals = [[1,2],[1,2],[1,2]]", expectedOutput: "2", isHidden: false },
    ],
  },

  "https://leetcode.com/problems/meeting-rooms/": {
    gfgUrl: "https://www.geeksforgeeks.org/problems/attend-all-meetings/1",
    description: `Given an array of meeting time intervals where intervals[i] = [starti, endi], determine if a person could attend all meetings.

Sort by start time. Then check if any two consecutive meetings overlap: if intervals[i].start < intervals[i-1].end, the person cannot attend all meetings.

Constraints:
- 0 <= intervals.length <= 10^4
- intervals[i].length == 2
- 0 <= starti < endi <= 10^6

Example 1:
Input: intervals = [[0,30],[5,10],[15,20]]
Output: false
Explanation: Meeting [0,30] conflicts with both [5,10] and [15,20].

Example 2:
Input: intervals = [[7,10],[2,4]]
Output: true
Explanation: After sorting: [[2,4],[7,10]]. No overlaps, person can attend both.`,
    testCases: [
      { input: "intervals = [[0,30],[5,10],[15,20]]", expectedOutput: "false", isHidden: false },
      { input: "intervals = [[7,10],[2,4]]", expectedOutput: "true", isHidden: false },
    ],
  },
};
