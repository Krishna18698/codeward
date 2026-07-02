import { PrismaClient, Difficulty, ProblemPattern, ExperienceLevel } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import "dotenv/config";
import { PROBLEM_CONTENT } from "./problem-content";
import { GFG_URL_MAP } from "../src/lib/gfg-url-map";

// Returns the GFG URL for a given leetcodeUrl, or the URL itself if it is already a GFG URL.
function gfgFor(url: string | undefined): string | null {
  if (!url) return null;
  if (url.includes("geeksforgeeks.org")) return url;
  return GFG_URL_MAP[url] ?? PROBLEM_CONTENT[url]?.gfgUrl ?? null;
}

neonConfig.webSocketConstructor = ws as unknown as typeof WebSocket;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// ─── Blind 75 problems ────────────────────────────────────────────────────
const blind75: Array<{
  title: string;
  difficulty: Difficulty;
  pattern: ProblemPattern;
  mustDo: boolean;
  leetcodeUrl: string;
  description: string;
  order: number;
  testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
}> = [
  // Arrays
  { title: "Two Sum", difficulty: "EASY", pattern: "ARRAYS", mustDo: true, order: 1, leetcodeUrl: "https://leetcode.com/problems/two-sum/", description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.", testCases: [{ input: "nums = [2,7,11,15], target = 9", expectedOutput: "[0,1]", isHidden: false }, { input: "nums = [3,2,4], target = 6", expectedOutput: "[1,2]", isHidden: false }] },
  { title: "Best Time to Buy and Sell Stock", difficulty: "EASY", pattern: "ARRAYS", mustDo: true, order: 2, leetcodeUrl: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", description: "You are given an array prices where prices[i] is the price of a given stock on the ith day. Maximize your profit by choosing a single day to buy and a different day in the future to sell.", testCases: [{ input: "prices = [7,1,5,3,6,4]", expectedOutput: "5", isHidden: false }, { input: "prices = [7,6,4,3,1]", expectedOutput: "0", isHidden: false }] },
  { title: "Contains Duplicate", difficulty: "EASY", pattern: "ARRAYS", mustDo: true, order: 3, leetcodeUrl: "https://leetcode.com/problems/contains-duplicate/", description: "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.", testCases: [{ input: "nums = [1,2,3,1]", expectedOutput: "true", isHidden: false }, { input: "nums = [1,2,3,4]", expectedOutput: "false", isHidden: false }] },
  { title: "Product of Array Except Self", difficulty: "MEDIUM", pattern: "ARRAYS", mustDo: true, order: 4, leetcodeUrl: "https://leetcode.com/problems/product-of-array-except-self/", description: "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].", testCases: [{ input: "nums = [1,2,3,4]", expectedOutput: "[24,12,8,6]", isHidden: false }] },
  { title: "Maximum Subarray", difficulty: "MEDIUM", pattern: "ARRAYS", mustDo: true, order: 5, leetcodeUrl: "https://leetcode.com/problems/maximum-subarray/", description: "Given an integer array nums, find the subarray with the largest sum, and return its sum.", testCases: [{ input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6", isHidden: false }, { input: "nums = [1]", expectedOutput: "1", isHidden: false }] },
  { title: "Maximum Product Subarray", difficulty: "MEDIUM", pattern: "ARRAYS", mustDo: true, order: 6, leetcodeUrl: "https://leetcode.com/problems/maximum-product-subarray/", description: "Given an integer array nums, find a subarray that has the largest product, and return the product.", testCases: [{ input: "nums = [2,3,-2,4]", expectedOutput: "6", isHidden: false }] },
  { title: "Find Minimum in Rotated Sorted Array", difficulty: "MEDIUM", pattern: "BINARY_SEARCH", mustDo: true, order: 7, leetcodeUrl: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/", description: "Suppose an array of length n sorted in ascending order is rotated between 1 and n times. Given the sorted rotated array nums, return the minimum element.", testCases: [{ input: "nums = [3,4,5,1,2]", expectedOutput: "1", isHidden: false }, { input: "nums = [4,5,6,7,0,1,2]", expectedOutput: "0", isHidden: false }] },
  { title: "Search in Rotated Sorted Array", difficulty: "MEDIUM", pattern: "BINARY_SEARCH", mustDo: true, order: 8, leetcodeUrl: "https://leetcode.com/problems/search-in-rotated-sorted-array/", description: "Given the rotated array nums and an integer target, return the index of target if it is in nums, or -1 if it is not.", testCases: [{ input: "nums = [4,5,6,7,0,1,2], target = 0", expectedOutput: "4", isHidden: false }, { input: "nums = [4,5,6,7,0,1,2], target = 3", expectedOutput: "-1", isHidden: false }] },
  { title: "3Sum", difficulty: "MEDIUM", pattern: "TWO_POINTERS", mustDo: true, order: 9, leetcodeUrl: "https://leetcode.com/problems/3sum/", description: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, j != k, and nums[i] + nums[j] + nums[k] == 0.", testCases: [{ input: "nums = [-1,0,1,2,-1,-4]", expectedOutput: "[[-1,-1,2],[-1,0,1]]", isHidden: false }] },
  { title: "Container With Most Water", difficulty: "MEDIUM", pattern: "TWO_POINTERS", mustDo: true, order: 10, leetcodeUrl: "https://leetcode.com/problems/container-with-most-water/", description: "Given n non-negative integers a1, a2, ..., an where each represents a point at coordinate (i, ai). Find two lines which, together with the x-axis forms a container that contains the most water.", testCases: [{ input: "height = [1,8,6,2,5,4,8,3,7]", expectedOutput: "49", isHidden: false }] },
  // Strings
  { title: "Longest Substring Without Repeating Characters", difficulty: "MEDIUM", pattern: "SLIDING_WINDOW", mustDo: true, order: 11, leetcodeUrl: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", description: "Given a string s, find the length of the longest substring without repeating characters.", testCases: [{ input: 'string = "abcabcbb"', expectedOutput: "3", isHidden: false }, { input: 'string = "bbbbb"', expectedOutput: "1", isHidden: false }] },
  { title: "Longest Repeating Character Replacement", difficulty: "MEDIUM", pattern: "SLIDING_WINDOW", mustDo: true, order: 12, leetcodeUrl: "https://leetcode.com/problems/longest-repeating-character-replacement/", description: "You are given a string s and an integer k. You can choose any character of the string and change it to any other uppercase English character. Return the length of the longest substring with all the same letters you can get after performing at most k changes.", testCases: [{ input: 's = "ABAB", k = 2', expectedOutput: "4", isHidden: false }] },
  { title: "Minimum Window Substring", difficulty: "HARD", pattern: "SLIDING_WINDOW", mustDo: true, order: 13, leetcodeUrl: "https://leetcode.com/problems/minimum-window-substring/", description: "Given two strings s and t, return the minimum window substring of s such that every character in t (including duplicates) is included in the window.", testCases: [{ input: 's = "ADOBECODEBANC", t = "ABC"', expectedOutput: '"BANC"', isHidden: false }] },
  { title: "Valid Anagram", difficulty: "EASY", pattern: "STRINGS", mustDo: true, order: 14, leetcodeUrl: "https://leetcode.com/problems/valid-anagram/", description: "Given two strings s and t, return true if t is an anagram of s, and false otherwise.", testCases: [{ input: 's = "anagram", t = "nagaram"', expectedOutput: "true", isHidden: false }, { input: 's = "rat", t = "car"', expectedOutput: "false", isHidden: false }] },
  { title: "Group Anagrams", difficulty: "MEDIUM", pattern: "STRINGS", mustDo: true, order: 15, leetcodeUrl: "https://leetcode.com/problems/group-anagrams/", description: "Given an array of strings strs, group the anagrams together. You can return the answer in any order.", testCases: [{ input: 'strs = ["eat","tea","tan","ate","nat","bat"]', expectedOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]', isHidden: false }] },
  { title: "Valid Parentheses", difficulty: "EASY", pattern: "STACK_QUEUE", mustDo: true, order: 16, leetcodeUrl: "https://leetcode.com/problems/valid-parentheses/", description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.", testCases: [{ input: 's = "()"', expectedOutput: "true", isHidden: false }, { input: 's = "()[]{}"', expectedOutput: "true", isHidden: false }, { input: 's = "(]"', expectedOutput: "false", isHidden: false }] },
  // Binary Trees
  { title: "Maximum Depth of Binary Tree", difficulty: "EASY", pattern: "TREES", mustDo: true, order: 17, leetcodeUrl: "https://leetcode.com/problems/maximum-depth-of-binary-tree/", description: "Given the root of a binary tree, return its maximum depth.", testCases: [{ input: "root = [3,9,20,null,null,15,7]", expectedOutput: "3", isHidden: false }] },
  { title: "Same Tree", difficulty: "EASY", pattern: "TREES", mustDo: true, order: 18, leetcodeUrl: "https://leetcode.com/problems/same-tree/", description: "Given the roots of two binary trees p and q, write a function to check if they are the same or not.", testCases: [{ input: "p = [1,2,3], q = [1,2,3]", expectedOutput: "true", isHidden: false }] },
  { title: "Invert Binary Tree", difficulty: "EASY", pattern: "TREES", mustDo: true, order: 19, leetcodeUrl: "https://leetcode.com/problems/invert-binary-tree/", description: "Given the root of a binary tree, invert the tree, and return its root.", testCases: [{ input: "root = [4,2,7,1,3,6,9]", expectedOutput: "[4,7,2,9,6,3,1]", isHidden: false }] },
  { title: "Binary Tree Maximum Path Sum", difficulty: "HARD", pattern: "TREES", mustDo: true, order: 20, leetcodeUrl: "https://leetcode.com/problems/binary-tree-maximum-path-sum/", description: "A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. Given the root of a binary tree, return the maximum path sum of any non-empty path.", testCases: [{ input: "root = [1,2,3]", expectedOutput: "6", isHidden: false }] },
  { title: "Binary Tree Level Order Traversal", difficulty: "MEDIUM", pattern: "TREES", mustDo: true, order: 21, leetcodeUrl: "https://leetcode.com/problems/binary-tree-level-order-traversal/", description: "Given the root of a binary tree, return the level order traversal of its nodes' values.", testCases: [{ input: "root = [3,9,20,null,null,15,7]", expectedOutput: "[[3],[9,20],[15,7]]", isHidden: false }] },
  { title: "Serialize and Deserialize Binary Tree", difficulty: "HARD", pattern: "TREES", mustDo: false, order: 22, leetcodeUrl: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/", description: "Design an algorithm to serialize and deserialize a binary tree.", testCases: [{ input: "root = [1,2,3,null,null,4,5]", expectedOutput: "[1,2,3,null,null,4,5]", isHidden: false }] },
  { title: "Subtree of Another Tree", difficulty: "EASY", pattern: "TREES", mustDo: false, order: 23, leetcodeUrl: "https://leetcode.com/problems/subtree-of-another-tree/", description: "Given the roots of two binary trees root and subRoot, return true if there is a subtree of root with the same structure and node values of subRoot.", testCases: [{ input: "root = [3,4,5,1,2], subRoot = [4,1,2]", expectedOutput: "true", isHidden: false }] },
  { title: "Construct Binary Tree from Preorder and Inorder Traversal", difficulty: "MEDIUM", pattern: "TREES", mustDo: true, order: 24, leetcodeUrl: "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/", description: "Given two integer arrays preorder and inorder where preorder is the preorder traversal of a binary tree and inorder is the inorder traversal, construct and return the binary tree.", testCases: [{ input: "preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]", expectedOutput: "[3,9,20,null,null,15,7]", isHidden: false }] },
  { title: "Validate Binary Search Tree", difficulty: "MEDIUM", pattern: "TREES", mustDo: true, order: 25, leetcodeUrl: "https://leetcode.com/problems/validate-binary-search-tree/", description: "Given the root of a binary tree, determine if it is a valid binary search tree (BST).", testCases: [{ input: "root = [2,1,3]", expectedOutput: "true", isHidden: false }, { input: "root = [5,1,4,null,null,3,6]", expectedOutput: "false", isHidden: false }] },
  { title: "Kth Smallest Element in a BST", difficulty: "MEDIUM", pattern: "TREES", mustDo: false, order: 26, leetcodeUrl: "https://leetcode.com/problems/kth-smallest-element-in-a-bst/", description: "Given the root of a binary search tree, and an integer k, return the kth smallest value of all the values of the nodes in the tree.", testCases: [{ input: "root = [3,1,4,null,2], k = 1", expectedOutput: "1", isHidden: false }] },
  { title: "Lowest Common Ancestor of BST", difficulty: "MEDIUM", pattern: "TREES", mustDo: true, order: 27, leetcodeUrl: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/", description: "Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.", testCases: [{ input: "root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8", expectedOutput: "6", isHidden: false }] },
  // Dynamic Programming
  { title: "Climbing Stairs", difficulty: "EASY", pattern: "DYNAMIC_PROGRAMMING", mustDo: true, order: 28, leetcodeUrl: "https://leetcode.com/problems/climbing-stairs/", description: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?", testCases: [{ input: "n = 2", expectedOutput: "2", isHidden: false }, { input: "n = 3", expectedOutput: "3", isHidden: false }] },
  { title: "Coin Change", difficulty: "MEDIUM", pattern: "DYNAMIC_PROGRAMMING", mustDo: true, order: 29, leetcodeUrl: "https://leetcode.com/problems/coin-change/", description: "You are given an integer array coins representing coins of various denominations and an integer amount. Return the fewest number of coins that you need to make up that amount.", testCases: [{ input: "coins = [1,5,11,25], amount = 30", expectedOutput: "2", isHidden: false }, { input: "coins = [1,2,5], amount = 11", expectedOutput: "3", isHidden: false }] },
  { title: "Longest Increasing Subsequence", difficulty: "MEDIUM", pattern: "DYNAMIC_PROGRAMMING", mustDo: true, order: 30, leetcodeUrl: "https://leetcode.com/problems/longest-increasing-subsequence/", description: "Given an integer array nums, return the length of the longest strictly increasing subsequence.", testCases: [{ input: "nums = [10,9,2,5,3,7,101,18]", expectedOutput: "4", isHidden: false }] },
  { title: "Word Break", difficulty: "MEDIUM", pattern: "DYNAMIC_PROGRAMMING", mustDo: true, order: 31, leetcodeUrl: "https://leetcode.com/problems/word-break/", description: "Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words.", testCases: [{ input: 's = "leetcode", wordDict = ["leet","code"]', expectedOutput: "true", isHidden: false }] },
  { title: "Combination Sum IV", difficulty: "MEDIUM", pattern: "DYNAMIC_PROGRAMMING", mustDo: false, order: 32, leetcodeUrl: "https://leetcode.com/problems/combination-sum-iv/", description: "Given an array of distinct integers nums and a target integer target, return the number of possible combinations that add up to target.", testCases: [{ input: "nums = [1,2,3], target = 4", expectedOutput: "7", isHidden: false }] },
  { title: "House Robber", difficulty: "MEDIUM", pattern: "DYNAMIC_PROGRAMMING", mustDo: true, order: 33, leetcodeUrl: "https://leetcode.com/problems/house-robber/", description: "Given an integer array nums representing the amount of money of each house, return the maximum amount of money you can rob without alerting the police.", testCases: [{ input: "nums = [1,2,3,1]", expectedOutput: "4", isHidden: false }, { input: "nums = [2,7,9,3,1]", expectedOutput: "12", isHidden: false }] },
  { title: "House Robber II", difficulty: "MEDIUM", pattern: "DYNAMIC_PROGRAMMING", mustDo: false, order: 34, leetcodeUrl: "https://leetcode.com/problems/house-robber-ii/", description: "All houses are arranged in a circle. Given an integer array nums representing the amount of money of each house, return the maximum amount you can rob.", testCases: [{ input: "nums = [2,3,2]", expectedOutput: "3", isHidden: false }, { input: "nums = [1,2,3,1]", expectedOutput: "4", isHidden: false }] },
  { title: "Unique Paths", difficulty: "MEDIUM", pattern: "DYNAMIC_PROGRAMMING", mustDo: false, order: 35, leetcodeUrl: "https://leetcode.com/problems/unique-paths/", description: "A robot is located at the top-left corner of a m x n grid. Return the number of possible unique paths to the bottom-right corner.", testCases: [{ input: "m = 3, n = 7", expectedOutput: "28", isHidden: false }] },
  { title: "Jump Game", difficulty: "MEDIUM", pattern: "DYNAMIC_PROGRAMMING", mustDo: true, order: 36, leetcodeUrl: "https://leetcode.com/problems/jump-game/", description: "Given an integer array nums, you are initially positioned at the first index. Determine if you can reach the last index.", testCases: [{ input: "nums = [2,3,1,1,4]", expectedOutput: "true", isHidden: false }, { input: "nums = [3,2,1,0,4]", expectedOutput: "false", isHidden: false }] },
  // Graphs
  { title: "Clone Graph", difficulty: "MEDIUM", pattern: "GRAPHS", mustDo: true, order: 37, leetcodeUrl: "https://leetcode.com/problems/clone-graph/", description: "Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph.", testCases: [{ input: "adjList = [[2,4],[1,3],[2,4],[1,3]]", expectedOutput: "[[2,4],[1,3],[2,4],[1,3]]", isHidden: false }] },
  { title: "Course Schedule", difficulty: "MEDIUM", pattern: "GRAPHS", mustDo: true, order: 38, leetcodeUrl: "https://leetcode.com/problems/course-schedule/", description: "Given numCourses and prerequisites, return true if you can finish all courses.", testCases: [{ input: "numCourses = 2, prerequisites = [[1,0]]", expectedOutput: "true", isHidden: false }, { input: "numCourses = 2, prerequisites = [[1,0],[0,1]]", expectedOutput: "false", isHidden: false }] },
  { title: "Pacific Atlantic Water Flow", difficulty: "MEDIUM", pattern: "GRAPHS", mustDo: false, order: 39, leetcodeUrl: "https://leetcode.com/problems/pacific-atlantic-water-flow/", description: "Given an m x n matrix of heights, return a 2D list of grid coordinates where rain water can flow to both the Pacific and Atlantic ocean.", testCases: [{ input: "heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]", expectedOutput: "[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]", isHidden: false }] },
  { title: "Number of Islands", difficulty: "MEDIUM", pattern: "GRAPHS", mustDo: true, order: 40, leetcodeUrl: "https://leetcode.com/problems/number-of-islands/", description: "Given an m x n 2D binary grid which represents a map of '1's (land) and '0's (water), return the number of islands.", testCases: [{ input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expectedOutput: "1", isHidden: false }] },
  { title: "Longest Consecutive Sequence", difficulty: "MEDIUM", pattern: "GRAPHS", mustDo: true, order: 41, leetcodeUrl: "https://leetcode.com/problems/longest-consecutive-sequence/", description: "Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence.", testCases: [{ input: "nums = [100,4,200,1,3,2]", expectedOutput: "4", isHidden: false }] },
  // Linked List
  { title: "Reverse Linked List", difficulty: "EASY", pattern: "LINKED_LIST", mustDo: true, order: 42, leetcodeUrl: "https://leetcode.com/problems/reverse-linked-list/", description: "Given the head of a singly linked list, reverse the list, and return the reversed list.", testCases: [{ input: "head = [1,2,3,4,5]", expectedOutput: "[5,4,3,2,1]", isHidden: false }] },
  { title: "Linked List Cycle", difficulty: "EASY", pattern: "LINKED_LIST", mustDo: true, order: 43, leetcodeUrl: "https://leetcode.com/problems/linked-list-cycle/", description: "Given head, the head of a linked list, determine if the linked list has a cycle in it.", testCases: [{ input: "head = [3,2,0,-4], pos = 1", expectedOutput: "true", isHidden: false }] },
  { title: "Merge Two Sorted Lists", difficulty: "EASY", pattern: "LINKED_LIST", mustDo: true, order: 44, leetcodeUrl: "https://leetcode.com/problems/merge-two-sorted-lists/", description: "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists in a sorted list.", testCases: [{ input: "list1 = [1,2,4], list2 = [1,3,4]", expectedOutput: "[1,1,2,3,4,4]", isHidden: false }] },
  { title: "Merge K Sorted Lists", difficulty: "HARD", pattern: "LINKED_LIST", mustDo: true, order: 45, leetcodeUrl: "https://leetcode.com/problems/merge-k-sorted-lists/", description: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.", testCases: [{ input: "lists = [[1,4,5],[1,3,4],[2,6]]", expectedOutput: "[1,1,2,3,4,4,5,6]", isHidden: false }] },
  { title: "Remove Nth Node From End of List", difficulty: "MEDIUM", pattern: "LINKED_LIST", mustDo: false, order: 46, leetcodeUrl: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/", description: "Given the head of a linked list, remove the nth node from the end of the list and return its head.", testCases: [{ input: "head = [1,2,3,4,5], n = 2", expectedOutput: "[1,2,3,5]", isHidden: false }] },
  { title: "Reorder List", difficulty: "MEDIUM", pattern: "LINKED_LIST", mustDo: false, order: 47, leetcodeUrl: "https://leetcode.com/problems/reorder-list/", description: "You are given the head of a singly linked-list. Reorder it so the nodes are in the form: L0 → Ln → L1 → Ln-1 → L2 → Ln-2 → …", testCases: [{ input: "head = [1,2,3,4]", expectedOutput: "[1,4,2,3]", isHidden: false }] },
  // Heap
  { title: "Top K Frequent Elements", difficulty: "MEDIUM", pattern: "HEAP", mustDo: true, order: 48, leetcodeUrl: "https://leetcode.com/problems/top-k-frequent-elements/", description: "Given an integer array nums and an integer k, return the k most frequent elements.", testCases: [{ input: "nums = [1,1,1,2,2,3], k = 2", expectedOutput: "[1,2]", isHidden: false }] },
  { title: "Find Median from Data Stream", difficulty: "HARD", pattern: "HEAP", mustDo: true, order: 49, leetcodeUrl: "https://leetcode.com/problems/find-median-from-data-stream/", description: "Implement the MedianFinder class that supports adding numbers and finding the median.", testCases: [{ input: 'commands = ["addNum","addNum","findMedian","addNum","findMedian"], values = [1,2,null,3,null]', expectedOutput: "[null,null,1.5,null,2.0]", isHidden: false }] },
  // Trie
  { title: "Implement Trie", difficulty: "MEDIUM", pattern: "TRIE", mustDo: true, order: 50, leetcodeUrl: "https://leetcode.com/problems/implement-trie-prefix-tree/", description: "Implement a trie with insert, search, and startsWith methods.", testCases: [{ input: 'commands = ["insert","search","search","startsWith","insert","search"], values = ["apple","apple","app","app","app","app"]', expectedOutput: "[null,true,false,true,null,true]", isHidden: false }] },
  { title: "Design Add and Search Words", difficulty: "MEDIUM", pattern: "TRIE", mustDo: false, order: 51, leetcodeUrl: "https://leetcode.com/problems/design-add-and-search-words-data-structure/", description: "Design a data structure that supports adding new words and finding if a string matches any previously added string (with '.' as wildcard).", testCases: [{ input: 'commands = ["addWord","addWord","search","search"], values = ["bad","dad","bad",".ad"]', expectedOutput: "[null,null,true,true]", isHidden: false }] },
  { title: "Word Search II", difficulty: "HARD", pattern: "TRIE", mustDo: false, order: 52, leetcodeUrl: "https://leetcode.com/problems/word-search-ii/", description: "Given an m x n board of characters and a list of strings words, return all words on the board.", testCases: [{ input: 'board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]', expectedOutput: '["eat","oath"]', isHidden: false }] },
  // Backtracking
  { title: "Combination Sum", difficulty: "MEDIUM", pattern: "BACKTRACKING", mustDo: true, order: 53, leetcodeUrl: "https://leetcode.com/problems/combination-sum/", description: "Given an array of distinct integers candidates and a target integer target, return all unique combinations of candidates where the chosen numbers sum to target.", testCases: [{ input: "candidates = [2,3,6,7], target = 7", expectedOutput: "[[2,2,3],[7]]", isHidden: false }] },
  { title: "Word Search", difficulty: "MEDIUM", pattern: "BACKTRACKING", mustDo: true, order: 54, leetcodeUrl: "https://leetcode.com/problems/word-search/", description: "Given an m x n grid of characters board and a string word, return true if word exists in the grid.", testCases: [{ input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"', expectedOutput: "true", isHidden: false }] },
  // Binary
  { title: "Sum of Two Integers", difficulty: "MEDIUM", pattern: "BIT_MANIPULATION", mustDo: true, order: 55, leetcodeUrl: "https://leetcode.com/problems/sum-of-two-integers/", description: "Given two integers a and b, return the sum of the two integers without using the operators + and -.", testCases: [{ input: "a = 1, b = 2", expectedOutput: "3", isHidden: false }, { input: "a = 2, b = 3", expectedOutput: "5", isHidden: false }] },
  { title: "Number of 1 Bits", difficulty: "EASY", pattern: "BIT_MANIPULATION", mustDo: false, order: 56, leetcodeUrl: "https://leetcode.com/problems/number-of-1-bits/", description: "Write a function that takes the binary representation of a positive integer and returns the number of set bits it has.", testCases: [{ input: "n = 11", expectedOutput: "3", isHidden: false }] },
  { title: "Counting Bits", difficulty: "EASY", pattern: "BIT_MANIPULATION", mustDo: false, order: 57, leetcodeUrl: "https://leetcode.com/problems/counting-bits/", description: "Given an integer n, return an array ans of length n + 1 such that for each i (0 <= i <= n), ans[i] is the number of 1's in the binary representation of i.", testCases: [{ input: "n = 2", expectedOutput: "[0,1,1]", isHidden: false }, { input: "n = 5", expectedOutput: "[0,1,1,2,1,2]", isHidden: false }] },
  { title: "Missing Number", difficulty: "EASY", pattern: "BIT_MANIPULATION", mustDo: false, order: 58, leetcodeUrl: "https://leetcode.com/problems/missing-number/", description: "Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.", testCases: [{ input: "nums = [3,0,1]", expectedOutput: "2", isHidden: false }] },
  { title: "Reverse Bits", difficulty: "EASY", pattern: "BIT_MANIPULATION", mustDo: false, order: 59, leetcodeUrl: "https://leetcode.com/problems/reverse-bits/", description: "Reverse bits of a given 32 bits unsigned integer.", testCases: [{ input: "n = 00000010100101000001111010011100", expectedOutput: "964176192", isHidden: false }] },
  // Matrix
  { title: "Set Matrix Zeroes", difficulty: "MEDIUM", pattern: "ARRAYS", mustDo: false, order: 60, leetcodeUrl: "https://leetcode.com/problems/set-matrix-zeroes/", description: "Given an m x n integer matrix, if an element is 0, set its entire row and column to 0's.", testCases: [{ input: "matrix = [[1,1,1],[1,0,1],[1,1,1]]", expectedOutput: "[[1,0,1],[0,0,0],[1,0,1]]", isHidden: false }] },
  { title: "Spiral Matrix", difficulty: "MEDIUM", pattern: "ARRAYS", mustDo: false, order: 61, leetcodeUrl: "https://leetcode.com/problems/spiral-matrix/", description: "Given an m x n matrix, return all elements of the matrix in spiral order.", testCases: [{ input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", expectedOutput: "[1,2,3,6,9,8,7,4,5]", isHidden: false }] },
  { title: "Rotate Image", difficulty: "MEDIUM", pattern: "ARRAYS", mustDo: false, order: 62, leetcodeUrl: "https://leetcode.com/problems/rotate-image/", description: "You are given an n x n 2D matrix representing an image. Rotate the image by 90 degrees (clockwise) in-place.", testCases: [{ input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", expectedOutput: "[[7,4,1],[8,5,2],[9,6,3]]", isHidden: false }] },
  { title: "Number of Connected Components in an Undirected Graph", difficulty: "MEDIUM", pattern: "GRAPHS", mustDo: false, order: 63, leetcodeUrl: "https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/", description: "Given n nodes in a graph, find the number of connected components using Union-Find or DFS.", testCases: [{ input: "n = 5, edges = [[0,1],[1,2],[3,4]]", expectedOutput: "2", isHidden: false }] },
  { title: "Graph Valid Tree", difficulty: "MEDIUM", pattern: "GRAPHS", mustDo: false, order: 64, leetcodeUrl: "https://leetcode.com/problems/graph-valid-tree/", description: "Given n nodes labeled from 0 to n-1 and a list of undirected edges, write a function to check whether these edges make up a valid tree.", testCases: [{ input: "n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]", expectedOutput: "true", isHidden: false }] },
  { title: "Alien Dictionary", difficulty: "HARD", pattern: "GRAPHS", mustDo: true, order: 65, leetcodeUrl: "https://leetcode.com/problems/alien-dictionary/", description: "Given a sorted dictionary of an alien language, find the order of characters in the language.", testCases: [{ input: 'words = ["wrt","wrf","er","ett","rftt"]', expectedOutput: '"wertf"', isHidden: false }] },
  { title: "Encode and Decode Strings", difficulty: "MEDIUM", pattern: "STRINGS", mustDo: false, order: 66, leetcodeUrl: "https://leetcode.com/problems/encode-and-decode-strings/", description: "Design an algorithm to encode a list of strings to a string and decode the string back to the original list.", testCases: [{ input: 'strs = ["Hello","World"]', expectedOutput: '["Hello","World"]', isHidden: false }] },
  { title: "Palindromic Substrings", difficulty: "MEDIUM", pattern: "DYNAMIC_PROGRAMMING", mustDo: false, order: 67, leetcodeUrl: "https://leetcode.com/problems/palindromic-substrings/", description: "Given a string s, return the number of palindromic substrings in it.", testCases: [{ input: 's = "abc"', expectedOutput: "3", isHidden: false }, { input: 's = "aaa"', expectedOutput: "6", isHidden: false }] },
  { title: "Longest Palindromic Substring", difficulty: "MEDIUM", pattern: "DYNAMIC_PROGRAMMING", mustDo: true, order: 68, leetcodeUrl: "https://leetcode.com/problems/longest-palindromic-substring/", description: "Given a string s, return the longest palindromic substring in s.", testCases: [{ input: 's = "babad"', expectedOutput: '"bab"', isHidden: false }, { input: 's = "cbbd"', expectedOutput: '"bb"', isHidden: false }] },
  { title: "Decode Ways", difficulty: "MEDIUM", pattern: "DYNAMIC_PROGRAMMING", mustDo: false, order: 69, leetcodeUrl: "https://leetcode.com/problems/decode-ways/", description: "Given a string s containing only digits, return the number of ways to decode it.", testCases: [{ input: 's = "12"', expectedOutput: "2", isHidden: false }, { input: 's = "226"', expectedOutput: "3", isHidden: false }] },
  { title: "Valid Palindrome", difficulty: "EASY", pattern: "TWO_POINTERS", mustDo: true, order: 70, leetcodeUrl: "https://leetcode.com/problems/valid-palindrome/", description: "A phrase is a palindrome if, after converting all uppercase letters to lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.", testCases: [{ input: 's = "A man, a plan, a canal: Panama"', expectedOutput: "true", isHidden: false }, { input: 's = "race a car"', expectedOutput: "false", isHidden: false }] },
  { title: "Meeting Rooms", difficulty: "EASY", pattern: "ARRAYS", mustDo: false, order: 71, leetcodeUrl: "https://leetcode.com/problems/meeting-rooms/", description: "Given an array of meeting time intervals, determine if a person could attend all meetings.", testCases: [{ input: "intervals = [[0,30],[5,10],[15,20]]", expectedOutput: "false", isHidden: false }] },
  { title: "Meeting Rooms II", difficulty: "MEDIUM", pattern: "HEAP", mustDo: true, order: 72, leetcodeUrl: "https://leetcode.com/problems/meeting-rooms-ii/", description: "Given an array of meeting time intervals, find the minimum number of conference rooms required.", testCases: [{ input: "intervals = [[0,30],[5,10],[15,20]]", expectedOutput: "2", isHidden: false }] },
  { title: "Insert Interval", difficulty: "MEDIUM", pattern: "ARRAYS", mustDo: true, order: 73, leetcodeUrl: "https://leetcode.com/problems/insert-interval/", description: "You are given an array of non-overlapping intervals and a new interval. Insert the new interval into the intervals, merging if necessary.", testCases: [{ input: "intervals = [[1,3],[6,9]], newInterval = [2,5]", expectedOutput: "[[1,5],[6,9]]", isHidden: false }] },
  { title: "Merge Intervals", difficulty: "MEDIUM", pattern: "ARRAYS", mustDo: true, order: 74, leetcodeUrl: "https://leetcode.com/problems/merge-intervals/", description: "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals.", testCases: [{ input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", expectedOutput: "[[1,6],[8,10],[15,18]]", isHidden: false }] },
  { title: "Non-overlapping Intervals", difficulty: "MEDIUM", pattern: "ARRAYS", mustDo: false, order: 75, leetcodeUrl: "https://leetcode.com/problems/non-overlapping-intervals/", description: "Given an array of intervals, return the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.", testCases: [{ input: "intervals = [[1,2],[2,3],[3,4],[1,3]]", expectedOutput: "1", isHidden: false }] },
];

// ─── System Design questions ──────────────────────────────────────────────
const systemDesignQuestions: Array<{
  title: string;
  description: string;
  difficulty: Difficulty;
  mustDo: boolean;
  experienceLevel: ExperienceLevel;
  order: number;
}> = [
  // Junior
  { title: "Design a URL Shortener", difficulty: "EASY", mustDo: true, experienceLevel: "JUNIOR", order: 1, description: "Design a service like bit.ly that takes a long URL and returns a short URL. Cover hashing, storage, redirects, and basic scalability." },
  { title: "Design a Pastebin", difficulty: "EASY", mustDo: true, experienceLevel: "JUNIOR", order: 2, description: "Design a service where users can store plain text or code snippets and share via short links. Cover storage, expiry, and access control." },
  { title: "Design a Rate Limiter", difficulty: "MEDIUM", mustDo: true, experienceLevel: "JUNIOR", order: 3, description: "Design a rate limiting system to control the rate of requests users can make to an API. Cover token bucket, sliding window algorithms." },
  { title: "Design a Key-Value Store", difficulty: "MEDIUM", mustDo: true, experienceLevel: "JUNIOR", order: 4, description: "Design a distributed key-value store like Redis or DynamoDB. Cover data partitioning, replication, consistency, and fault tolerance." },
  // Mid
  { title: "Design Twitter / News Feed", difficulty: "MEDIUM", mustDo: true, experienceLevel: "MID", order: 5, description: "Design a social media news feed system. Cover fan-out on write vs. read, timeline generation, caching, and real-time updates." },
  { title: "Design a Chat System (WhatsApp)", difficulty: "MEDIUM", mustDo: true, experienceLevel: "MID", order: 6, description: "Design a real-time messaging system. Cover WebSockets, message queues, presence indicators, push notifications, and message storage." },
  { title: "Design YouTube / Video Streaming", difficulty: "MEDIUM", mustDo: true, experienceLevel: "MID", order: 7, description: "Design a video upload and streaming platform. Cover CDN, adaptive bitrate streaming, storage, encoding pipeline, and metadata service." },
  { title: "Design a Notification System", difficulty: "MEDIUM", mustDo: false, experienceLevel: "MID", order: 8, description: "Design a notification delivery system supporting push, email, and SMS. Cover fanout, reliability, deduplication, and user preferences." },
  { title: "Design Google Drive / Dropbox", difficulty: "MEDIUM", mustDo: true, experienceLevel: "MID", order: 9, description: "Design a cloud file storage and sync service. Cover chunking, deduplication, conflict resolution, versioning, and cross-device sync." },
  { title: "Design a Search Autocomplete", difficulty: "MEDIUM", mustDo: true, experienceLevel: "MID", order: 10, description: "Design a real-time search autocomplete system (like Google's). Cover Trie data structures, distributed caching, and latency requirements." },
  // Senior
  { title: "Design a Distributed Message Queue (Kafka)", difficulty: "HARD", mustDo: true, experienceLevel: "SENIOR", order: 11, description: "Design a distributed message queue like Apache Kafka. Cover topics/partitions, consumer groups, at-least-once delivery, and fault tolerance." },
  { title: "Design a Web Crawler", difficulty: "HARD", mustDo: true, experienceLevel: "SENIOR", order: 12, description: "Design a large-scale web crawler. Cover URL frontier, politeness, distributed crawling, deduplication, and storage of crawled content." },
  { title: "Design Google Search", difficulty: "HARD", mustDo: true, experienceLevel: "SENIOR", order: 13, description: "Design a web search engine. Cover web crawling, indexing (inverted index), query processing, ranking (PageRank), and serving at scale." },
  { title: "Design an Ad Click Aggregation System", difficulty: "HARD", mustDo: false, experienceLevel: "SENIOR", order: 14, description: "Design a real-time ad click aggregation and analytics system. Cover stream processing, windowed aggregations, accuracy vs. speed tradeoffs." },
  { title: "Design a Distributed Cache (Redis)", difficulty: "HARD", mustDo: true, experienceLevel: "SENIOR", order: 15, description: "Design a distributed caching system. Cover eviction policies, consistency, replication, cluster mode, and cache invalidation strategies." },
  // Junior (additional)
  { title: "Design a Parking Lot System", difficulty: "EASY", mustDo: false, experienceLevel: "JUNIOR", order: 16, description: "Design an OOP-based parking lot. Cover spot types, ticketing, entry/exit gates, payment processing, and availability tracking." },
  { title: "Design a Task Queue / Job Scheduler", difficulty: "EASY", mustDo: true, experienceLevel: "JUNIOR", order: 17, description: "Design a system to schedule and process background jobs. Cover priority queues, retry logic, dead-letter queues, and worker pools." },
  { title: "Design a Leaderboard", difficulty: "EASY", mustDo: true, experienceLevel: "JUNIOR", order: 18, description: "Design a real-time gaming leaderboard. Cover sorted sets (Redis ZADD), pagination, tie-breaking, and efficient rank lookup for 100M+ users." },
  { title: "Design a Unique ID Generator", difficulty: "EASY", mustDo: true, experienceLevel: "JUNIOR", order: 19, description: "Design a distributed unique ID generation service (like Twitter Snowflake). Cover clock drift, monotonicity, datacenter bits, and throughput." },
  // Mid (additional)
  { title: "Design Uber / Lyft (Ride Sharing)", difficulty: "MEDIUM", mustDo: true, experienceLevel: "MID", order: 20, description: "Design a ride-sharing platform. Cover real-time location tracking, driver matching, surge pricing, trip state machine, and geospatial indexing." },
  { title: "Design Instagram / Photo Sharing", difficulty: "MEDIUM", mustDo: true, experienceLevel: "MID", order: 21, description: "Design a photo-sharing social network. Cover image upload/CDN, feed generation, hashtag search, follower graph, and story expiry." },
  { title: "Design a Food Delivery System (DoorDash)", difficulty: "MEDIUM", mustDo: true, experienceLevel: "MID", order: 22, description: "Design a food delivery platform. Cover restaurant catalog, order lifecycle, real-time driver assignment, ETA prediction, and geo-routing." },
  { title: "Design a Hotel/Airbnb Booking System", difficulty: "MEDIUM", mustDo: true, experienceLevel: "MID", order: 23, description: "Design an accommodation booking platform. Cover inventory management, double-booking prevention, search with filters, payments, and calendar blocking." },
  { title: "Design a Payment Gateway", difficulty: "MEDIUM", mustDo: true, experienceLevel: "MID", order: 24, description: "Design a payment processing system. Cover idempotency, exactly-once semantics, fraud detection, PCI-DSS considerations, and retry strategies." },
  { title: "Design TikTok / Short Video Platform", difficulty: "MEDIUM", mustDo: false, experienceLevel: "MID", order: 25, description: "Design a short-video feed. Cover video ingestion pipeline, ML-driven recommendation, infinite scroll, creator monetisation, and live streaming." },
  { title: "Design a Zoom / Video Conferencing System", difficulty: "MEDIUM", mustDo: true, experienceLevel: "MID", order: 26, description: "Design a real-time video conferencing app. Cover WebRTC signalling, media servers (SFU vs MCU), recording, screen share, and latency targets." },
  { title: "Design an E-commerce Platform (Amazon)", difficulty: "MEDIUM", mustDo: true, experienceLevel: "MID", order: 27, description: "Design an e-commerce marketplace. Cover product catalog, search, cart & checkout, inventory reservation, order management, and recommendation." },
  // Senior (additional)
  { title: "Design a Content Delivery Network (CDN)", difficulty: "HARD", mustDo: true, experienceLevel: "SENIOR", order: 28, description: "Design a CDN from scratch. Cover PoPs, anycast routing, cache hierarchy, origin pull vs push, cache invalidation, and DDoS mitigation." },
  { title: "Design Google Maps / Location Services", difficulty: "HARD", mustDo: true, experienceLevel: "SENIOR", order: 29, description: "Design a mapping and navigation service. Cover tile serving, geospatial indexing (S2/QuadTree), routing algorithms, ETA, and real-time traffic." },
  { title: "Design a Distributed File System (HDFS)", difficulty: "HARD", mustDo: false, experienceLevel: "SENIOR", order: 30, description: "Design a distributed file storage system. Cover namenode/datanode architecture, block replication, fault tolerance, and throughput at petabyte scale." },
  { title: "Design an Online Code Judge (LeetCode)", difficulty: "HARD", mustDo: true, experienceLevel: "SENIOR", order: 31, description: "Design a code execution and judging platform. Cover sandboxed execution, resource limits, test case management, plagiarism detection, and editorial delivery." },
  { title: "Design a Stock Exchange / Trading Platform", difficulty: "HARD", mustDo: true, experienceLevel: "SENIOR", order: 32, description: "Design a financial trading system. Cover matching engine, order book, low-latency requirements, ACID guarantees, market data feed, and regulatory compliance." },
  { title: "Design a Recommendation System (Netflix/Spotify)", difficulty: "HARD", mustDo: true, experienceLevel: "SENIOR", order: 33, description: "Design a large-scale recommendation engine. Cover collaborative filtering, content-based models, real-time vs batch pipelines, A/B testing, and cold-start problem." },
];

const COMPANY_MAP: Record<string, string[]> = {
  "Two Sum": ["Google", "Amazon", "Meta", "Microsoft", "Apple"],
  "Best Time to Buy and Sell Stock": ["Amazon", "Meta", "Goldman Sachs"],
  "Contains Duplicate": ["Google", "Amazon"],
  "Maximum Subarray": ["Amazon", "Microsoft", "Apple"],
  "Product of Array Except Self": ["Meta", "Amazon", "Google"],
  "Maximum Product Subarray": ["Amazon", "Google"],
  "Find Minimum in Rotated Sorted Array": ["Amazon", "Microsoft"],
  "Search in Rotated Sorted Array": ["Amazon", "Microsoft", "Google"],
  "3Sum": ["Amazon", "Meta", "Microsoft"],
  "Container With Most Water": ["Amazon", "Meta", "Google"],
  "Longest Substring Without Repeating Characters": ["Amazon", "Google", "Microsoft"],
  "Longest Repeating Character Replacement": ["Amazon", "Google"],
  "Minimum Window Substring": ["Amazon", "Meta", "Google"],
  "Valid Anagram": ["Amazon", "Google", "Microsoft"],
  "Group Anagrams": ["Amazon", "Google", "Microsoft"],
  "Valid Parentheses": ["Amazon", "Meta", "Google", "Microsoft"],
  "Valid Palindrome": ["Meta", "Amazon", "Microsoft"],
  "Longest Palindromic Substring": ["Amazon", "Microsoft", "Google"],
  "Palindromic Substrings": ["Amazon", "Google"],
  "Reverse Linked List": ["Amazon", "Meta", "Google", "Microsoft"],
  "Merge Two Sorted Lists": ["Amazon", "Meta", "Google", "Microsoft"],
  "Linked List Cycle": ["Amazon", "Meta", "Google"],
  "Remove Nth Node From End of List": ["Amazon", "Google", "Microsoft"],
  "Reorder List": ["Amazon", "Meta"],
  "Merge K Sorted Lists": ["Amazon", "Meta", "Google", "Microsoft"],
  "Invert Binary Tree": ["Google", "Amazon"],
  "Maximum Depth of Binary Tree": ["Amazon", "Meta", "Google"],
  "Same Tree": ["Amazon", "Google", "Microsoft"],
  "Binary Tree Level Order Traversal": ["Amazon", "Meta", "Google", "Microsoft"],
  "Subtree of Another Tree": ["Amazon", "Google"],
  "Lowest Common Ancestor of a Binary Search Tree": ["Amazon", "Meta", "Microsoft"],
  "Lowest Common Ancestor of BST": ["Amazon", "Meta", "Microsoft"],
  "Validate Binary Search Tree": ["Amazon", "Meta", "Google", "Microsoft"],
  "Kth Smallest Element in a BST": ["Amazon", "Google", "Microsoft"],
  "Construct Binary Tree from Preorder and Inorder Traversal": ["Amazon", "Google"],
  "Binary Tree Maximum Path Sum": ["Amazon", "Meta", "Google"],
  "Serialize and Deserialize Binary Tree": ["Amazon", "Meta", "Google"],
  "Number of Islands": ["Amazon", "Meta", "Google", "Microsoft"],
  "Clone Graph": ["Meta", "Amazon", "Google"],
  "Pacific Atlantic Water Flow": ["Amazon", "Google"],
  "Course Schedule": ["Amazon", "Meta", "Google"],
  "Climbing Stairs": ["Amazon", "Google", "Apple"],
  "Coin Change": ["Amazon", "Meta", "Google", "Microsoft"],
  "Longest Increasing Subsequence": ["Amazon", "Meta", "Google", "Microsoft"],
  "Unique Paths": ["Amazon", "Google", "Microsoft"],
  "Jump Game": ["Amazon", "Meta", "Google"],
  "Word Break": ["Amazon", "Meta", "Google", "Microsoft"],
  "House Robber": ["Amazon", "Google", "Microsoft"],
  "Combination Sum": ["Amazon", "Google", "Microsoft"],
  "Word Search": ["Amazon", "Meta", "Microsoft"],
  "Number of 1 Bits": ["Apple", "Microsoft"],
  "Counting Bits": ["Amazon", "Google"],
  "Missing Number": ["Amazon", "Microsoft", "Google"],
  "Reverse Bits": ["Apple", "Amazon"],
  "Top K Frequent Elements": ["Amazon", "Meta", "Google"],
  "Find Median from Data Stream": ["Amazon", "Google"],
  "Kth Largest Element in an Array": ["Amazon", "Meta", "Google"],
  "Kth Largest Element in a Stream": ["Amazon"],
  "Meeting Rooms": ["Amazon", "Meta", "Google"],
  "Meeting Rooms II": ["Amazon", "Meta", "Google"],
  "Implement Trie (Prefix Tree)": ["Amazon", "Google", "Microsoft"],
  "Design Add and Search Words Data Structure": ["Amazon", "Meta"],
  "Word Search II": ["Amazon", "Meta", "Google"],
  // Striver's SDE sheet titles
  "Next Permutation": ["Google", "Microsoft", "Amazon"],
  "Trapping Rain Water": ["Amazon", "Google", "Microsoft", "Meta"],
  "LRU Cache": ["Amazon", "Meta", "Microsoft", "Google"],
  "Largest Rectangle in Histogram": ["Amazon", "Google", "Meta"],
  "Diameter of Binary Tree": ["Google", "Amazon", "Microsoft"],
  "Balanced Binary Tree": ["Google", "Amazon"],
  "Binary Tree Right Side View": ["Amazon", "Meta", "Microsoft"],
  "Flatten Binary Tree to Linked List": ["Meta", "Amazon"],
  "Bipartite Graph Check": ["Google", "Amazon"],
  "Find First and Last Position of Element": ["Google", "Amazon", "Microsoft"],
  "Longest Common Subsequence": ["Amazon", "Google", "Microsoft"],
  "0-1 Knapsack": ["Amazon", "Microsoft"],
  "Kth Largest Element in Array": ["Amazon", "Google", "Meta"],
  "Edit Distance": ["Amazon", "Google", "Microsoft"],
  "Add Two Numbers": ["Amazon", "Meta", "Microsoft"],
  "Find the Duplicate Number": ["Amazon", "Google"],
  "Rotate Array by K Places": ["Microsoft", "Amazon"],
  "Sort Linked List (Merge Sort)": ["Amazon", "Google"],
  "K Closest Points to Origin": ["Amazon", "Meta", "Google"],
  "Task Scheduler": ["Amazon", "Meta"],
  "Copy List with Random Pointer": ["Amazon", "Meta", "Microsoft"],
  "Letter Combinations of a Phone Number": ["Amazon", "Meta", "Google"],
  "Palindrome Partitioning": ["Amazon", "Google", "Microsoft"],
  "Longest Consecutive Sequence": ["Google", "Amazon", "Meta"],
};

async function main() {
  console.log("Seeding preset sheets...");

  // ── Blind 75 ──────────────────────────────────────────────────────────────
  const blind75Sheet = await prisma.sheet.upsert({
    where: { id: "preset-blind75" },
    create: { id: "preset-blind75", name: "Blind 75", source: "BLIND75", isPreset: true },
    update: { name: "Blind 75" },
  });

  // Remove dupes by title within the array
  const seen = new Set<string>();
  const uniqueBlind75 = blind75.filter((p) => {
    if (seen.has(p.title)) return false;
    seen.add(p.title);
    return true;
  });

  for (const p of uniqueBlind75) {
    const content = PROBLEM_CONTENT[p.leetcodeUrl];
    const description = content?.description ?? p.description;
    const testCases = content?.testCases ?? p.testCases;

    const problem = await prisma.problem.upsert({
      where: { id: `b75-${p.order}` },
      create: {
        id: `b75-${p.order}`,
        title: p.title,
        description,
        difficulty: p.difficulty,
        pattern: p.pattern,
        leetcodeUrl: p.leetcodeUrl,
        gfgUrl: content?.gfgUrl ?? null,
        mustDo: p.mustDo,
        order: p.order,
        sheetId: blind75Sheet.id,
        companies: COMPANY_MAP[p.title] ?? [],
      },
      update: {
        title: p.title,
        description,
        difficulty: p.difficulty,
        pattern: p.pattern,
        mustDo: p.mustDo,
        leetcodeUrl: p.leetcodeUrl,
        gfgUrl: content?.gfgUrl ?? null,
        companies: COMPANY_MAP[p.title] ?? [],
      },
    });

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      await prisma.testCase.upsert({
        where: { id: `b75-${p.order}-tc-${i}` },
        create: {
          id: `b75-${p.order}-tc-${i}`,
          problemId: problem.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden,
        },
        update: { input: tc.input, expectedOutput: tc.expectedOutput, isHidden: tc.isHidden },
      });
    }
  }

  console.log(`Seeded ${uniqueBlind75.length} Blind 75 problems`);

  // ── System Design ─────────────────────────────────────────────────────────
  for (const q of systemDesignQuestions) {
    await prisma.systemDesignQuestion.upsert({
      where: { id: `sd-${q.order}` },
      create: { id: `sd-${q.order}`, ...q },
      update: { title: q.title, difficulty: q.difficulty, mustDo: q.mustDo },
    });
  }

  console.log(`Seeded ${systemDesignQuestions.length} system design questions`);

  // ── Striver's SDE Sheet ───────────────────────────────────────────────────
  const striversSheet = await prisma.sheet.upsert({
    where: { id: "preset-strivers" },
    create: { id: "preset-strivers", name: "Striver's SDE Sheet", source: "STRIVERS", isPreset: true },
    update: { name: "Striver's SDE Sheet" },
  });

  const strivers: Array<{
    id: string; title: string; difficulty: Difficulty; pattern: ProblemPattern;
    mustDo: boolean; order: number; leetcodeUrl: string; description: string;
    testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
  }> = [
    // Arrays
    { id:"sv-1", order:1, title:"Sort an array of 0s, 1s, 2s", difficulty:"MEDIUM", pattern:"TWO_POINTERS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/sort-colors/", description:"Given an array containing only 0s, 1s and 2s, sort it in-place without using a sorting algorithm (Dutch National Flag).", testCases:[{input:"nums = [2,0,2,1,1,0]",expectedOutput:"[0,0,1,1,2,2]",isHidden:false}] },
    { id:"sv-2", order:2, title:"Stock Buy and Sell (Multiple Transactions)", difficulty:"MEDIUM", pattern:"ARRAYS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/", description:"Find the maximum profit you can achieve from multiple buy/sell transactions.", testCases:[{input:"prices = [7,1,5,3,6,4]",expectedOutput:"7",isHidden:false}] },
    { id:"sv-3", order:3, title:"Rotate Array by K Places", difficulty:"MEDIUM", pattern:"ARRAYS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/rotate-array/", description:"Given an integer array nums, rotate the array to the right by k steps, where k is non-negative.", testCases:[{input:"nums = [1,2,3,4,5,6,7], k = 3",expectedOutput:"[5,6,7,1,2,3]",isHidden:false}] },
    { id:"sv-4", order:4, title:"Move Zeroes to End", difficulty:"EASY", pattern:"TWO_POINTERS", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/move-zeroes/", description:"Given an integer array nums, move all 0's to the end of it while maintaining the relative order of the non-zero elements.", testCases:[{input:"nums = [0,1,0,3,12]",expectedOutput:"[1,3,12,0,0]",isHidden:false}] },
    { id:"sv-5", order:5, title:"Next Permutation", difficulty:"MEDIUM", pattern:"ARRAYS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/next-permutation/", description:"Find the next lexicographically greater permutation of an array of integers.", testCases:[{input:"nums = [1,2,3]",expectedOutput:"[1,3,2]",isHidden:false},{input:"nums = [3,2,1]",expectedOutput:"[1,2,3]",isHidden:false}] },
    { id:"sv-6", order:6, title:"Longest Subarray with Sum K (positives)", difficulty:"MEDIUM", pattern:"SLIDING_WINDOW", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/subarray-sum-equals-k/", description:"Given an array of integers and an integer k, find the total number of subarrays whose sum equals k.", testCases:[{input:"nums = [1,1,1], k = 2",expectedOutput:"2",isHidden:false}] },
    // Binary Search
    { id:"sv-7", order:7, title:"Floor and Ceil in Sorted Array", difficulty:"EASY", pattern:"BINARY_SEARCH", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/search-insert-position/", description:"Given a sorted array and a target, find the floor (largest element ≤ target) and ceiling (smallest element ≥ target).", testCases:[{input:"arr = [1,2,8,10,10,12,19], x = 5",expectedOutput:"[2,8]",isHidden:false}] },
    { id:"sv-8", order:8, title:"Find First and Last Position of Element", difficulty:"MEDIUM", pattern:"BINARY_SEARCH", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/", description:"Given a sorted array of integers, find the starting and ending position of a given target value.", testCases:[{input:"nums = [5,7,7,8,8,10], target = 8",expectedOutput:"[3,4]",isHidden:false}] },
    { id:"sv-9", order:9, title:"Single Element in Sorted Array", difficulty:"MEDIUM", pattern:"BINARY_SEARCH", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/single-element-in-a-sorted-array/", description:"Find the single element in a sorted array where every other element appears exactly twice.", testCases:[{input:"nums = [1,1,2,3,3,4,4,8,8]",expectedOutput:"2",isHidden:false}] },
    { id:"sv-10", order:10, title:"Peak Element in Array", difficulty:"MEDIUM", pattern:"BINARY_SEARCH", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/find-peak-element/", description:"A peak element is an element that is strictly greater than its neighbors. Find any peak element index.", testCases:[{input:"nums = [1,2,3,1]",expectedOutput:"2",isHidden:false}] },
    { id:"sv-11", order:11, title:"Median of Two Sorted Arrays", difficulty:"HARD", pattern:"BINARY_SEARCH", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/median-of-two-sorted-arrays/", description:"Find the median of two sorted arrays in O(log(m+n)) time.", testCases:[{input:"nums1 = [1,3], nums2 = [2]",expectedOutput:"2.00000",isHidden:false}] },
    // Linked List
    { id:"sv-12", order:12, title:"Middle of Linked List", difficulty:"EASY", pattern:"LINKED_LIST", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/middle-of-the-linked-list/", description:"Given the head of a singly linked list, return the middle node. If there are two middle nodes, return the second.", testCases:[{input:"head = [1,2,3,4,5]",expectedOutput:"[3,4,5]",isHidden:false}] },
    { id:"sv-13", order:13, title:"Delete Nth Node from End", difficulty:"MEDIUM", pattern:"LINKED_LIST", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/remove-nth-node-from-end-of-list/", description:"Remove the nth node from the end of the list and return its head.", testCases:[{input:"head = [1,2,3,4,5], n = 2",expectedOutput:"[1,2,3,5]",isHidden:false}] },
    { id:"sv-14", order:14, title:"Add Two Numbers", difficulty:"MEDIUM", pattern:"LINKED_LIST", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/add-two-numbers/", description:"Add two non-negative integers represented as linked lists, return the sum as a linked list.", testCases:[{input:"l1 = [2,4,3], l2 = [5,6,4]",expectedOutput:"[7,0,8]",isHidden:false}] },
    { id:"sv-15", order:15, title:"Delete Middle Node of Linked List", difficulty:"MEDIUM", pattern:"LINKED_LIST", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/delete-the-middle-node-of-a-linked-list/", description:"Delete the middle node of a linked list, return the head of the modified list.", testCases:[{input:"head = [1,3,4,7,1,2,6]",expectedOutput:"[1,3,4,1,2,6]",isHidden:false}] },
    { id:"sv-16", order:16, title:"Sort Linked List (Merge Sort)", difficulty:"MEDIUM", pattern:"LINKED_LIST", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/sort-list/", description:"Sort a linked list in O(n log n) time using constant space complexity.", testCases:[{input:"head = [4,2,1,3]",expectedOutput:"[1,2,3,4]",isHidden:false}] },
    { id:"sv-17", order:17, title:"LRU Cache", difficulty:"MEDIUM", pattern:"LINKED_LIST", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/lru-cache/", description:"Design a data structure that follows the Least Recently Used cache eviction policy.", testCases:[{input:'commands=["LRUCache","put","put","get","put","get","put","get","get","get"], args=[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]',expectedOutput:"[null,null,null,1,null,-1,null,-1,3,4]",isHidden:false}] },
    // Greedy
    { id:"sv-18", order:18, title:"N meetings in one room", difficulty:"MEDIUM", pattern:"ARRAYS", mustDo:true, leetcodeUrl:"https://practice.geeksforgeeks.org/problems/n-meetings-in-one-room-1587115620/1", description:"Find the maximum number of meetings that can be accommodated in a single meeting room, given start and end times.", testCases:[{input:"start = [1,3,0,5,8,5], end = [2,4,6,7,9,9]",expectedOutput:"4",isHidden:false}] },
    { id:"sv-19", order:19, title:"Jump Game II", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/jump-game-ii/", description:"Find the minimum number of jumps to reach the last index.", testCases:[{input:"nums = [2,3,1,1,4]",expectedOutput:"2",isHidden:false}] },
    { id:"sv-20", order:20, title:"Minimum Platforms", difficulty:"MEDIUM", pattern:"ARRAYS", mustDo:true, leetcodeUrl:"https://practice.geeksforgeeks.org/problems/minimum-platforms-1587115620/1", description:"Find the minimum number of train platforms required at a railway station.", testCases:[{input:"arrival=[900,940,950,1100,1500,1800], departure=[910,1200,1120,1130,1900,2000]",expectedOutput:"3",isHidden:false}] },
    // Recursion & Backtracking
    { id:"sv-21", order:21, title:"Subsets II (with duplicates)", difficulty:"MEDIUM", pattern:"BACKTRACKING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/subsets-ii/", description:"Given an integer array that may contain duplicates, return all possible subsets (no duplicate subsets).", testCases:[{input:"nums = [1,2,2]",expectedOutput:"[[],[1],[1,2],[1,2,2],[2],[2,2]]",isHidden:false}] },
    { id:"sv-22", order:22, title:"Permutation Sequence", difficulty:"HARD", pattern:"BACKTRACKING", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/permutation-sequence/", description:"Given n and k, return the kth permutation sequence of numbers 1 to n.", testCases:[{input:"n = 3, k = 3",expectedOutput:'"213"',isHidden:false}] },
    { id:"sv-23", order:23, title:"N-Queens", difficulty:"HARD", pattern:"BACKTRACKING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/n-queens/", description:"Place n queens on an n×n chessboard so that no two queens attack each other.", testCases:[{input:"n = 4",expectedOutput:'[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]',isHidden:false}] },
    { id:"sv-24", order:24, title:"Sudoku Solver", difficulty:"HARD", pattern:"BACKTRACKING", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/sudoku-solver/", description:"Solve a Sudoku puzzle by filling in the empty cells.", testCases:[{input:'board=[["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]',expectedOutput:'solved board',isHidden:false}] },
    // Stack & Queue
    { id:"sv-25", order:25, title:"Next Greater Element", difficulty:"MEDIUM", pattern:"STACK_QUEUE", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/next-greater-element-i/", description:"Find the next greater number for every element in nums1 in nums2.", testCases:[{input:"nums1 = [4,1,2], nums2 = [1,3,4,2]",expectedOutput:"[-1,3,-1]",isHidden:false}] },
    { id:"sv-26", order:26, title:"Trapping Rain Water", difficulty:"HARD", pattern:"STACK_QUEUE", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/trapping-rain-water/", description:"Compute how much water can be trapped between the bars after raining.", testCases:[{input:"height = [0,1,0,2,1,0,1,3,2,1,2,1]",expectedOutput:"6",isHidden:false}] },
    { id:"sv-27", order:27, title:"Sum of Subarray Minimums", difficulty:"MEDIUM", pattern:"STACK_QUEUE", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/sum-of-subarray-minimums/", description:"Find the sum of the minimum values in every subarray of the given array.", testCases:[{input:"arr = [3,1,2,4]",expectedOutput:"17",isHidden:false}] },
    { id:"sv-28", order:28, title:"Largest Rectangle in Histogram", difficulty:"HARD", pattern:"STACK_QUEUE", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/largest-rectangle-in-histogram/", description:"Find the largest rectangle that can be formed in a histogram.", testCases:[{input:"heights = [2,1,5,6,2,3]",expectedOutput:"10",isHidden:false}] },
    // Trees
    { id:"sv-29", order:29, title:"Count Good Nodes in Binary Tree", difficulty:"MEDIUM", pattern:"TREES", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/count-good-nodes-in-binary-tree/", description:"A node X is good if in the path from root to X there are no nodes with a value greater than X.", testCases:[{input:"root = [3,1,4,3,null,1,5]",expectedOutput:"4",isHidden:false}] },
    { id:"sv-30", order:30, title:"Diameter of Binary Tree", difficulty:"EASY", pattern:"TREES", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/diameter-of-binary-tree/", description:"Return the length of the diameter of a binary tree (longest path between any two nodes).", testCases:[{input:"root = [1,2,3,4,5]",expectedOutput:"3",isHidden:false}] },
    { id:"sv-31", order:31, title:"Balanced Binary Tree", difficulty:"EASY", pattern:"TREES", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/balanced-binary-tree/", description:"Determine if a binary tree is height-balanced.", testCases:[{input:"root = [3,9,20,null,null,15,7]",expectedOutput:"true",isHidden:false}] },
    { id:"sv-32", order:32, title:"Binary Tree Right Side View", difficulty:"MEDIUM", pattern:"TREES", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/binary-tree-right-side-view/", description:"Return the values of nodes visible when the tree is viewed from the right side.", testCases:[{input:"root = [1,2,3,null,5,null,4]",expectedOutput:"[1,3,4]",isHidden:false}] },
    { id:"sv-33", order:33, title:"Flatten Binary Tree to Linked List", difficulty:"MEDIUM", pattern:"TREES", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/flatten-binary-tree-to-linked-list/", description:"Flatten the tree into a linked list in-place following preorder traversal.", testCases:[{input:"root = [1,2,5,3,4,null,6]",expectedOutput:"[1,null,2,null,3,null,4,null,5,null,6]",isHidden:false}] },
    { id:"sv-34", order:34, title:"Path Sum II", difficulty:"MEDIUM", pattern:"TREES", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/path-sum-ii/", description:"Find all root-to-leaf paths where the sum of node values equals targetSum.", testCases:[{input:"root = [5,4,8,11,null,13,4,7,2,null,null,5,1], targetSum = 22",expectedOutput:"[[5,4,11,2],[5,8,4,5]]",isHidden:false}] },
    { id:"sv-35", order:35, title:"Morris Inorder Traversal", difficulty:"MEDIUM", pattern:"TREES", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/binary-tree-inorder-traversal/", description:"Perform binary tree inorder traversal using O(1) extra space (Morris traversal).", testCases:[{input:"root = [1,null,2,3]",expectedOutput:"[1,3,2]",isHidden:false}] },
    // Graphs
    { id:"sv-36", order:36, title:"Detect Cycle in Directed Graph", difficulty:"MEDIUM", pattern:"GRAPHS", mustDo:true, leetcodeUrl:"https://practice.geeksforgeeks.org/problems/detect-cycle-in-a-directed-graph/1", description:"Detect if there is a cycle in a directed graph.", testCases:[{input:"V = 4, adj = [[1],[2],[3],[]]",expectedOutput:"false",isHidden:false}] },
    { id:"sv-37", order:37, title:"Bipartite Graph Check", difficulty:"MEDIUM", pattern:"GRAPHS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/is-graph-bipartite/", description:"Determine if a graph is bipartite (can be 2-colored).", testCases:[{input:"graph = [[1,2,3],[0,2],[0,1,3],[0,2]]",expectedOutput:"false",isHidden:false}] },
    { id:"sv-38", order:38, title:"Shortest Path in Weighted Graph (Dijkstra)", difficulty:"MEDIUM", pattern:"GRAPHS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/network-delay-time/", description:"Find the minimum time to send a signal to all n nodes in a network (Dijkstra's algorithm).", testCases:[{input:"times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2",expectedOutput:"2",isHidden:false}] },
    { id:"sv-39", order:39, title:"Minimum Spanning Tree (Prim's)", difficulty:"MEDIUM", pattern:"GRAPHS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/min-cost-to-connect-all-points/", description:"Find the minimum cost to connect all points (Prim's / Kruskal's MST).", testCases:[{input:"points = [[0,0],[2,2],[3,10],[5,2],[7,0]]",expectedOutput:"20",isHidden:false}] },
    { id:"sv-40", order:40, title:"Bellman-Ford Algorithm", difficulty:"MEDIUM", pattern:"GRAPHS", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/cheapest-flights-within-k-stops/", description:"Find cheapest price from source to destination with at most k stops (Bellman-Ford variant).", testCases:[{input:"n=4, flights=[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src=0, dst=3, k=1",expectedOutput:"700",isHidden:false}] },
    // DP (additional patterns)
    { id:"sv-41", order:41, title:"Longest Common Subsequence", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/longest-common-subsequence/", description:"Return the length of the longest common subsequence of two strings.", testCases:[{input:'text1 = "abcde", text2 = "ace"',expectedOutput:"3",isHidden:false}] },
    { id:"sv-42", order:42, title:"Longest Common Substring", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:false, leetcodeUrl:"https://practice.geeksforgeeks.org/problems/longest-common-substring1452/1", description:"Find the length of the longest common substring of two strings.", testCases:[{input:'s1 = "ABCBDAB", s2 = "BDCAB"',expectedOutput:"4",isHidden:false}] },
    { id:"sv-43", order:43, title:"Edit Distance", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/edit-distance/", description:"Find minimum number of operations (insert, delete, replace) to convert word1 to word2.", testCases:[{input:'word1 = "horse", word2 = "ros"',expectedOutput:"3",isHidden:false}] },
    { id:"sv-44", order:44, title:"Wildcard Matching", difficulty:"HARD", pattern:"DYNAMIC_PROGRAMMING", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/wildcard-matching/", description:"Implement wildcard pattern matching with '?' and '*' characters.", testCases:[{input:'s = "aa", p = "a*"',expectedOutput:"true",isHidden:false}] },
    { id:"sv-45", order:45, title:"0-1 Knapsack", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://practice.geeksforgeeks.org/problems/0-1-knapsack-problem0945/1", description:"Given weights and values of n items, find the maximum value that fits in a knapsack of capacity W.", testCases:[{input:"W = 4, wt = [1,3,4,5], val = [1,4,5,7]",expectedOutput:"7",isHidden:false}] },
    { id:"sv-46", order:46, title:"Matrix Chain Multiplication", difficulty:"HARD", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://practice.geeksforgeeks.org/problems/matrix-chain-multiplication0303/1", description:"Find the most efficient way to multiply a chain of matrices (minimum scalar multiplications).", testCases:[{input:"p = [1,2,3,4,3]",expectedOutput:"30",isHidden:false}] },
    // Heap
    { id:"sv-47", order:47, title:"Kth Largest Element in Array", difficulty:"MEDIUM", pattern:"HEAP", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/kth-largest-element-in-an-array/", description:"Find the kth largest element in an unsorted array in O(n log k).", testCases:[{input:"nums = [3,2,1,5,6,4], k = 2",expectedOutput:"5",isHidden:false}] },
    { id:"sv-48", order:48, title:"Reorganize String", difficulty:"MEDIUM", pattern:"HEAP", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/reorganize-string/", description:"Rearrange characters of a string so no two adjacent characters are the same.", testCases:[{input:'s = "aab"',expectedOutput:'"aba"',isHidden:false}] },
    // Trie
    { id:"sv-49", order:49, title:"Maximum XOR of Two Numbers", difficulty:"MEDIUM", pattern:"TRIE", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/", description:"Find the maximum XOR of any two elements in an array using a trie.", testCases:[{input:"nums = [3,10,5,25,2,8]",expectedOutput:"28",isHidden:false}] },
    { id:"sv-50", order:50, title:"Count Distinct Substrings", difficulty:"HARD", pattern:"TRIE", mustDo:false, leetcodeUrl:"https://practice.geeksforgeeks.org/problems/count-of-distinct-substrings/1", description:"Count the number of distinct substrings of a string using a trie.", testCases:[{input:'s = "ab"',expectedOutput:"4",isHidden:false}] },
  ];

  for (const p of strivers) {
    const problem = await prisma.problem.upsert({
      where: { id: p.id },
      create: { id: p.id, title: p.title, description: p.description, difficulty: p.difficulty, pattern: p.pattern, leetcodeUrl: p.leetcodeUrl, gfgUrl: gfgFor(p.leetcodeUrl), mustDo: p.mustDo, order: p.order, sheetId: striversSheet.id, companies: COMPANY_MAP[p.title] ?? [] },
      update: { title: p.title, difficulty: p.difficulty, pattern: p.pattern, mustDo: p.mustDo, gfgUrl: gfgFor(p.leetcodeUrl), companies: COMPANY_MAP[p.title] ?? [] },
    });
    for (let i = 0; i < p.testCases.length; i++) {
      await prisma.testCase.upsert({
        where: { id: `${p.id}-tc-${i}` },
        create: { id: `${p.id}-tc-${i}`, problemId: problem.id, ...p.testCases[i] },
        update: { input: p.testCases[i].input, expectedOutput: p.testCases[i].expectedOutput },
      });
    }
  }
  console.log(`Seeded ${strivers.length} Striver's SDE problems`);

  // ── NeetCode 150 ─────────────────────────────────────────────────────────
  const neetSheet = await prisma.sheet.upsert({
    where: { id: "preset-neetcode150" },
    create: { id: "preset-neetcode150", name: "NeetCode 150", source: "CUSTOM", isPreset: true },
    update: { name: "NeetCode 150" },
  });

  const neet150: Array<{
    id: string; title: string; difficulty: Difficulty; pattern: ProblemPattern;
    mustDo: boolean; order: number; leetcodeUrl: string; description: string;
    testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
  }> = [
    // Arrays & Hashing
    { id:"nc-1", order:1, title:"Contains Duplicate", difficulty:"EASY", pattern:"ARRAYS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/contains-duplicate/", description:"Given an integer array nums, return true if any value appears at least twice in the array.", testCases:[{input:"nums = [1,2,3,1]",expectedOutput:"true",isHidden:false}] },
    { id:"nc-2", order:2, title:"Valid Anagram", difficulty:"EASY", pattern:"STRINGS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/valid-anagram/", description:"Given two strings s and t, return true if t is an anagram of s.", testCases:[{input:'s = "anagram", t = "nagaram"',expectedOutput:"true",isHidden:false}] },
    { id:"nc-3", order:3, title:"Two Sum", difficulty:"EASY", pattern:"ARRAYS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/two-sum/", description:"Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.", testCases:[{input:"nums = [2,7,11,15], target = 9",expectedOutput:"[0,1]",isHidden:false}] },
    { id:"nc-4", order:4, title:"Group Anagrams", difficulty:"MEDIUM", pattern:"STRINGS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/group-anagrams/", description:"Given an array of strings, group the anagrams together.", testCases:[{input:'strs = ["eat","tea","tan","ate","nat","bat"]',expectedOutput:'[["bat"],["nat","tan"],["ate","eat","tea"]]',isHidden:false}] },
    { id:"nc-5", order:5, title:"Top K Frequent Elements", difficulty:"MEDIUM", pattern:"HEAP", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/top-k-frequent-elements/", description:"Given an integer array nums and an integer k, return the k most frequent elements.", testCases:[{input:"nums = [1,1,1,2,2,3], k = 2",expectedOutput:"[1,2]",isHidden:false}] },
    { id:"nc-6", order:6, title:"Encode and Decode Strings", difficulty:"MEDIUM", pattern:"STRINGS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/encode-and-decode-strings/", description:"Design an algorithm to encode a list of strings to a single string and decode it back.", testCases:[{input:'strs = ["Hello","World"]',expectedOutput:'["Hello","World"]',isHidden:false}] },
    { id:"nc-7", order:7, title:"Product of Array Except Self", difficulty:"MEDIUM", pattern:"ARRAYS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/product-of-array-except-self/", description:"Given an integer array nums, return an array where each element is the product of all other elements.", testCases:[{input:"nums = [1,2,3,4]",expectedOutput:"[24,12,8,6]",isHidden:false}] },
    { id:"nc-8", order:8, title:"Valid Sudoku", difficulty:"MEDIUM", pattern:"ARRAYS", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/valid-sudoku/", description:"Determine if a 9x9 Sudoku board is valid.", testCases:[{input:"board (see LeetCode)",expectedOutput:"true",isHidden:false}] },
    { id:"nc-9", order:9, title:"Longest Consecutive Sequence", difficulty:"MEDIUM", pattern:"ARRAYS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/longest-consecutive-sequence/", description:"Given an unsorted array, find the length of the longest consecutive elements sequence in O(n).", testCases:[{input:"nums = [100,4,200,1,3,2]",expectedOutput:"4",isHidden:false}] },
    // Two Pointers
    { id:"nc-10", order:10, title:"Valid Palindrome", difficulty:"EASY", pattern:"TWO_POINTERS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/valid-palindrome/", description:"A phrase is a palindrome if, after converting all uppercase letters into lowercase and removing all non-alphanumeric characters, it reads the same forward and backward.", testCases:[{input:'s = "A man, a plan, a canal: Panama"',expectedOutput:"true",isHidden:false}] },
    { id:"nc-11", order:11, title:"Two Sum II - Input Array Is Sorted", difficulty:"MEDIUM", pattern:"TWO_POINTERS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/", description:"Given a 1-indexed array sorted in non-decreasing order, find two numbers that add up to target.", testCases:[{input:"numbers = [2,7,11,15], target = 9",expectedOutput:"[1,2]",isHidden:false}] },
    { id:"nc-12", order:12, title:"3Sum", difficulty:"MEDIUM", pattern:"TWO_POINTERS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/3sum/", description:"Given an integer array nums, return all triplets that sum to zero.", testCases:[{input:"nums = [-1,0,1,2,-1,-4]",expectedOutput:"[[-1,-1,2],[-1,0,1]]",isHidden:false}] },
    { id:"nc-13", order:13, title:"Container With Most Water", difficulty:"MEDIUM", pattern:"TWO_POINTERS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/container-with-most-water/", description:"Find two lines that together with the x-axis form a container that contains the most water.", testCases:[{input:"height = [1,8,6,2,5,4,8,3,7]",expectedOutput:"49",isHidden:false}] },
    { id:"nc-14", order:14, title:"Trapping Rain Water", difficulty:"HARD", pattern:"TWO_POINTERS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/trapping-rain-water/", description:"Given n non-negative integers representing an elevation map, compute how much water can be trapped after raining.", testCases:[{input:"height = [0,1,0,2,1,0,1,3,2,1,2,1]",expectedOutput:"6",isHidden:false}] },
    // Sliding Window
    { id:"nc-15", order:15, title:"Best Time to Buy and Sell Stock", difficulty:"EASY", pattern:"SLIDING_WINDOW", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", description:"You are given an array prices. Find the maximum profit from a single buy and sell.", testCases:[{input:"prices = [7,1,5,3,6,4]",expectedOutput:"5",isHidden:false}] },
    { id:"nc-16", order:16, title:"Longest Substring Without Repeating Characters", difficulty:"MEDIUM", pattern:"SLIDING_WINDOW", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/longest-substring-without-repeating-characters/", description:"Find the length of the longest substring without repeating characters.", testCases:[{input:'s = "abcabcbb"',expectedOutput:"3",isHidden:false}] },
    { id:"nc-17", order:17, title:"Longest Repeating Character Replacement", difficulty:"MEDIUM", pattern:"SLIDING_WINDOW", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/longest-repeating-character-replacement/", description:"You can change at most k characters. Find the longest substring with all the same letters.", testCases:[{input:'s = "ABAB", k = 2',expectedOutput:"4",isHidden:false}] },
    { id:"nc-18", order:18, title:"Permutation in String", difficulty:"MEDIUM", pattern:"SLIDING_WINDOW", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/permutation-in-string/", description:"Given strings s1 and s2, return true if s2 contains a permutation of s1.", testCases:[{input:'s1 = "ab", s2 = "eidbaooo"',expectedOutput:"true",isHidden:false}] },
    { id:"nc-19", order:19, title:"Minimum Window Substring", difficulty:"HARD", pattern:"SLIDING_WINDOW", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/minimum-window-substring/", description:"Find the minimum window in s which contains all characters of t.", testCases:[{input:'s = "ADOBECODEBANC", t = "ABC"',expectedOutput:'"BANC"',isHidden:false}] },
    { id:"nc-20", order:20, title:"Sliding Window Maximum", difficulty:"HARD", pattern:"SLIDING_WINDOW", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/sliding-window-maximum/", description:"Return the max sliding window of size k at each step.", testCases:[{input:"nums = [1,3,-1,-3,5,3,6,7], k = 3",expectedOutput:"[3,3,5,5,6,7]",isHidden:false}] },
    // Stack
    { id:"nc-21", order:21, title:"Valid Parentheses", difficulty:"EASY", pattern:"STACK_QUEUE", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/valid-parentheses/", description:"Given a string s containing only '(', ')', '{', '}', '[', ']', determine if it is valid.", testCases:[{input:'s = "()"',expectedOutput:"true",isHidden:false}] },
    { id:"nc-22", order:22, title:"Min Stack", difficulty:"MEDIUM", pattern:"STACK_QUEUE", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/min-stack/", description:"Design a stack that supports push, pop, top, and retrieving the minimum element in O(1).", testCases:[{input:'["MinStack","push","push","push","getMin","pop","top","getMin"], values=[[],[-2],[0],[-3],[],[],[],[]]',expectedOutput:"[null,null,null,null,-3,null,0,-2]",isHidden:false}] },
    { id:"nc-23", order:23, title:"Evaluate Reverse Polish Notation", difficulty:"MEDIUM", pattern:"STACK_QUEUE", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/evaluate-reverse-polish-notation/", description:"Evaluate the value of an arithmetic expression in Reverse Polish Notation.", testCases:[{input:'tokens = ["2","1","+","3","*"]',expectedOutput:"9",isHidden:false}] },
    { id:"nc-24", order:24, title:"Generate Parentheses", difficulty:"MEDIUM", pattern:"STACK_QUEUE", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/generate-parentheses/", description:"Given n pairs of parentheses, generate all combinations of well-formed parentheses.", testCases:[{input:"n = 3",expectedOutput:'["((()))","(()())","(())()","()(())","()()()"]',isHidden:false}] },
    { id:"nc-25", order:25, title:"Daily Temperatures", difficulty:"MEDIUM", pattern:"STACK_QUEUE", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/daily-temperatures/", description:"Return an array answer such that answer[i] is the number of days until a warmer temperature.", testCases:[{input:"temperatures = [73,74,75,71,69,72,76,73]",expectedOutput:"[1,1,4,2,1,1,0,0]",isHidden:false}] },
    { id:"nc-26", order:26, title:"Car Fleet", difficulty:"MEDIUM", pattern:"STACK_QUEUE", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/car-fleet/", description:"Find the number of car fleets that arrive at the destination.", testCases:[{input:"target = 12, position = [10,8,0,5,3], speed = [2,4,1,1,3]",expectedOutput:"3",isHidden:false}] },
    { id:"nc-27", order:27, title:"Largest Rectangle in Histogram", difficulty:"HARD", pattern:"STACK_QUEUE", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/largest-rectangle-in-histogram/", description:"Find the largest rectangle that can be formed in a histogram.", testCases:[{input:"heights = [2,1,5,6,2,3]",expectedOutput:"10",isHidden:false}] },
    // Binary Search
    { id:"nc-28", order:28, title:"Binary Search", difficulty:"EASY", pattern:"BINARY_SEARCH", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/binary-search/", description:"Given a sorted array of distinct integers and a target, return the index of target or -1.", testCases:[{input:"nums = [-1,0,3,5,9,12], target = 9",expectedOutput:"4",isHidden:false}] },
    { id:"nc-29", order:29, title:"Search a 2D Matrix", difficulty:"MEDIUM", pattern:"BINARY_SEARCH", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/search-a-2d-matrix/", description:"Search for a target value in an m x n matrix with sorted rows.", testCases:[{input:"matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3",expectedOutput:"true",isHidden:false}] },
    { id:"nc-30", order:30, title:"Koko Eating Bananas", difficulty:"MEDIUM", pattern:"BINARY_SEARCH", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/koko-eating-bananas/", description:"Find the minimum eating speed k such that Koko can eat all bananas within h hours.", testCases:[{input:"piles = [3,6,7,11], h = 8",expectedOutput:"4",isHidden:false}] },
    { id:"nc-31", order:31, title:"Find Minimum in Rotated Sorted Array", difficulty:"MEDIUM", pattern:"BINARY_SEARCH", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/", description:"Find the minimum element in a rotated sorted array in O(log n).", testCases:[{input:"nums = [3,4,5,1,2]",expectedOutput:"1",isHidden:false}] },
    { id:"nc-32", order:32, title:"Search in Rotated Sorted Array", difficulty:"MEDIUM", pattern:"BINARY_SEARCH", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/search-in-rotated-sorted-array/", description:"Search for a target in a rotated sorted array in O(log n).", testCases:[{input:"nums = [4,5,6,7,0,1,2], target = 0",expectedOutput:"4",isHidden:false}] },
    { id:"nc-33", order:33, title:"Time Based Key-Value Store", difficulty:"MEDIUM", pattern:"BINARY_SEARCH", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/time-based-key-value-store/", description:"Design a time-based key-value data structure that can store multiple values for the same key with timestamps.", testCases:[{input:'["TimeMap","set","get","get"], [[], ["foo","bar",1], ["foo",1], ["foo",3]]',expectedOutput:'[null,null,"bar","bar"]',isHidden:false}] },
    { id:"nc-34", order:34, title:"Median of Two Sorted Arrays", difficulty:"HARD", pattern:"BINARY_SEARCH", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/median-of-two-sorted-arrays/", description:"Find the median of two sorted arrays in O(log(m+n)).", testCases:[{input:"nums1 = [1,3], nums2 = [2]",expectedOutput:"2.00000",isHidden:false}] },
    // Linked List
    { id:"nc-35", order:35, title:"Reverse Linked List", difficulty:"EASY", pattern:"LINKED_LIST", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/reverse-linked-list/", description:"Reverse a singly linked list iteratively and recursively.", testCases:[{input:"head = [1,2,3,4,5]",expectedOutput:"[5,4,3,2,1]",isHidden:false}] },
    { id:"nc-36", order:36, title:"Merge Two Sorted Lists", difficulty:"EASY", pattern:"LINKED_LIST", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/merge-two-sorted-lists/", description:"Merge two sorted linked lists and return it as a sorted list.", testCases:[{input:"list1 = [1,2,4], list2 = [1,3,4]",expectedOutput:"[1,1,2,3,4,4]",isHidden:false}] },
    { id:"nc-37", order:37, title:"Reorder List", difficulty:"MEDIUM", pattern:"LINKED_LIST", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/reorder-list/", description:"Reorder a linked list to: L0→Ln→L1→Ln-1→L2→Ln-2→…", testCases:[{input:"head = [1,2,3,4]",expectedOutput:"[1,4,2,3]",isHidden:false}] },
    { id:"nc-38", order:38, title:"Remove Nth Node From End of List", difficulty:"MEDIUM", pattern:"LINKED_LIST", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/remove-nth-node-from-end-of-list/", description:"Remove the nth node from the end of a linked list.", testCases:[{input:"head = [1,2,3,4,5], n = 2",expectedOutput:"[1,2,3,5]",isHidden:false}] },
    { id:"nc-39", order:39, title:"Copy List with Random Pointer", difficulty:"MEDIUM", pattern:"LINKED_LIST", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/copy-list-with-random-pointer/", description:"Deep copy a linked list with random pointers.", testCases:[{input:"head = [[7,null],[13,0],[11,4],[10,2],[1,0]]",expectedOutput:"[[7,null],[13,0],[11,4],[10,2],[1,0]]",isHidden:false}] },
    { id:"nc-40", order:40, title:"Add Two Numbers", difficulty:"MEDIUM", pattern:"LINKED_LIST", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/add-two-numbers/", description:"Add two non-negative integers represented as linked lists.", testCases:[{input:"l1 = [2,4,3], l2 = [5,6,4]",expectedOutput:"[7,0,8]",isHidden:false}] },
    { id:"nc-41", order:41, title:"Linked List Cycle", difficulty:"EASY", pattern:"LINKED_LIST", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/linked-list-cycle/", description:"Detect a cycle in a linked list using Floyd's algorithm.", testCases:[{input:"head = [3,2,0,-4], pos = 1",expectedOutput:"true",isHidden:false}] },
    { id:"nc-42", order:42, title:"Find the Duplicate Number", difficulty:"MEDIUM", pattern:"LINKED_LIST", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/find-the-duplicate-number/", description:"Find the repeated number in an array of n+1 integers without modifying the array.", testCases:[{input:"nums = [1,3,4,2,2]",expectedOutput:"2",isHidden:false}] },
    { id:"nc-43", order:43, title:"LRU Cache", difficulty:"MEDIUM", pattern:"LINKED_LIST", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/lru-cache/", description:"Design an LRU cache with O(1) get and put operations.", testCases:[{input:'["LRUCache","put","put","get","put","get","put","get","get","get"],[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]',expectedOutput:"[null,null,null,1,null,-1,null,-1,3,4]",isHidden:false}] },
    { id:"nc-44", order:44, title:"Merge K Sorted Lists", difficulty:"HARD", pattern:"LINKED_LIST", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/merge-k-sorted-lists/", description:"Merge k sorted linked lists into one sorted linked list.", testCases:[{input:"lists = [[1,4,5],[1,3,4],[2,6]]",expectedOutput:"[1,1,2,3,4,4,5,6]",isHidden:false}] },
    { id:"nc-45", order:45, title:"Reverse Nodes in k-Group", difficulty:"HARD", pattern:"LINKED_LIST", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/reverse-nodes-in-k-group/", description:"Reverse nodes of a linked list k at a time.", testCases:[{input:"head = [1,2,3,4,5], k = 2",expectedOutput:"[2,1,4,3,5]",isHidden:false}] },
    // Trees
    { id:"nc-46", order:46, title:"Invert Binary Tree", difficulty:"EASY", pattern:"TREES", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/invert-binary-tree/", description:"Invert a binary tree.", testCases:[{input:"root = [4,2,7,1,3,6,9]",expectedOutput:"[4,7,2,9,6,3,1]",isHidden:false}] },
    { id:"nc-47", order:47, title:"Maximum Depth of Binary Tree", difficulty:"EASY", pattern:"TREES", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/maximum-depth-of-binary-tree/", description:"Find the maximum depth of a binary tree.", testCases:[{input:"root = [3,9,20,null,null,15,7]",expectedOutput:"3",isHidden:false}] },
    { id:"nc-48", order:48, title:"Diameter of Binary Tree", difficulty:"EASY", pattern:"TREES", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/diameter-of-binary-tree/", description:"Find the diameter of a binary tree.", testCases:[{input:"root = [1,2,3,4,5]",expectedOutput:"3",isHidden:false}] },
    { id:"nc-49", order:49, title:"Balanced Binary Tree", difficulty:"EASY", pattern:"TREES", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/balanced-binary-tree/", description:"Determine if a binary tree is height-balanced.", testCases:[{input:"root = [3,9,20,null,null,15,7]",expectedOutput:"true",isHidden:false}] },
    { id:"nc-50", order:50, title:"Same Tree", difficulty:"EASY", pattern:"TREES", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/same-tree/", description:"Check if two binary trees are the same.", testCases:[{input:"p = [1,2,3], q = [1,2,3]",expectedOutput:"true",isHidden:false}] },
    { id:"nc-51", order:51, title:"Subtree of Another Tree", difficulty:"EASY", pattern:"TREES", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/subtree-of-another-tree/", description:"Check if subRoot is a subtree of root.", testCases:[{input:"root = [3,4,5,1,2], subRoot = [4,1,2]",expectedOutput:"true",isHidden:false}] },
    { id:"nc-52", order:52, title:"Lowest Common Ancestor of BST", difficulty:"MEDIUM", pattern:"TREES", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/", description:"Find the LCA of two nodes in a BST.", testCases:[{input:"root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8",expectedOutput:"6",isHidden:false}] },
    { id:"nc-53", order:53, title:"Binary Tree Level Order Traversal", difficulty:"MEDIUM", pattern:"TREES", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/binary-tree-level-order-traversal/", description:"Return the level order traversal of its nodes' values.", testCases:[{input:"root = [3,9,20,null,null,15,7]",expectedOutput:"[[3],[9,20],[15,7]]",isHidden:false}] },
    { id:"nc-54", order:54, title:"Binary Tree Right Side View", difficulty:"MEDIUM", pattern:"TREES", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/binary-tree-right-side-view/", description:"Return the values visible from the right side of a binary tree.", testCases:[{input:"root = [1,2,3,null,5,null,4]",expectedOutput:"[1,3,4]",isHidden:false}] },
    { id:"nc-55", order:55, title:"Count Good Nodes in Binary Tree", difficulty:"MEDIUM", pattern:"TREES", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/count-good-nodes-in-binary-tree/", description:"Count nodes where the path from root to that node has no greater value.", testCases:[{input:"root = [3,1,4,3,null,1,5]",expectedOutput:"4",isHidden:false}] },
    { id:"nc-56", order:56, title:"Validate Binary Search Tree", difficulty:"MEDIUM", pattern:"TREES", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/validate-binary-search-tree/", description:"Determine if a binary tree is a valid BST.", testCases:[{input:"root = [2,1,3]",expectedOutput:"true",isHidden:false}] },
    { id:"nc-57", order:57, title:"Kth Smallest Element in a BST", difficulty:"MEDIUM", pattern:"TREES", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/kth-smallest-element-in-a-bst/", description:"Find the kth smallest value in a BST.", testCases:[{input:"root = [3,1,4,null,2], k = 1",expectedOutput:"1",isHidden:false}] },
    { id:"nc-58", order:58, title:"Construct Binary Tree from Preorder and Inorder Traversal", difficulty:"MEDIUM", pattern:"TREES", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/", description:"Construct a binary tree from preorder and inorder traversal arrays.", testCases:[{input:"preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]",expectedOutput:"[3,9,20,null,null,15,7]",isHidden:false}] },
    { id:"nc-59", order:59, title:"Binary Tree Maximum Path Sum", difficulty:"HARD", pattern:"TREES", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/binary-tree-maximum-path-sum/", description:"Find the maximum path sum in a binary tree.", testCases:[{input:"root = [1,2,3]",expectedOutput:"6",isHidden:false}] },
    { id:"nc-60", order:60, title:"Serialize and Deserialize Binary Tree", difficulty:"HARD", pattern:"TREES", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/serialize-and-deserialize-binary-tree/", description:"Design an algorithm to serialize and deserialize a binary tree.", testCases:[{input:"root = [1,2,3,null,null,4,5]",expectedOutput:"[1,2,3,null,null,4,5]",isHidden:false}] },
    // Heap / Priority Queue
    { id:"nc-61", order:61, title:"Kth Largest Element in a Stream", difficulty:"EASY", pattern:"HEAP", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/kth-largest-element-in-a-stream/", description:"Design a class to find the kth largest element in a stream.", testCases:[{input:'["KthLargest","add","add","add","add","add"],[[3,[4,5,8,2]],[3],[5],[10],[9],[4]]',expectedOutput:"[null,4,5,5,8,8]",isHidden:false}] },
    { id:"nc-62", order:62, title:"Last Stone Weight", difficulty:"EASY", pattern:"HEAP", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/last-stone-weight/", description:"Smash the two heaviest stones until one or none remain.", testCases:[{input:"stones = [2,7,4,1,8,1]",expectedOutput:"1",isHidden:false}] },
    { id:"nc-63", order:63, title:"K Closest Points to Origin", difficulty:"MEDIUM", pattern:"HEAP", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/k-closest-points-to-origin/", description:"Return the k closest points to the origin.", testCases:[{input:"points = [[1,3],[-2,2]], k = 1",expectedOutput:"[[-2,2]]",isHidden:false}] },
    { id:"nc-64", order:64, title:"Task Scheduler", difficulty:"MEDIUM", pattern:"HEAP", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/task-scheduler/", description:"Find the minimum number of CPU intervals needed to execute all tasks.", testCases:[{input:'tasks = ["A","A","A","B","B","B"], n = 2',expectedOutput:"8",isHidden:false}] },
    { id:"nc-65", order:65, title:"Design Twitter", difficulty:"MEDIUM", pattern:"HEAP", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/design-twitter/", description:"Design a simplified Twitter with post, follow, and getNewsFeed operations.", testCases:[{input:"see LeetCode",expectedOutput:"see LeetCode",isHidden:false}] },
    { id:"nc-66", order:66, title:"Find Median from Data Stream", difficulty:"HARD", pattern:"HEAP", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/find-median-from-data-stream/", description:"Implement MedianFinder with addNum and findMedian operations.", testCases:[{input:'["MedianFinder","addNum","addNum","findMedian","addNum","findMedian"],[[],[1],[2],[],[3],[]]',expectedOutput:"[null,null,null,1.5,null,2.0]",isHidden:false}] },
    // Backtracking
    { id:"nc-67", order:67, title:"Subsets", difficulty:"MEDIUM", pattern:"BACKTRACKING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/subsets/", description:"Return all possible subsets of nums.", testCases:[{input:"nums = [1,2,3]",expectedOutput:"[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]",isHidden:false}] },
    { id:"nc-68", order:68, title:"Combination Sum", difficulty:"MEDIUM", pattern:"BACKTRACKING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/combination-sum/", description:"Find all unique combinations in candidates where they sum to target.", testCases:[{input:"candidates = [2,3,6,7], target = 7",expectedOutput:"[[2,2,3],[7]]",isHidden:false}] },
    { id:"nc-69", order:69, title:"Permutations", difficulty:"MEDIUM", pattern:"BACKTRACKING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/permutations/", description:"Return all possible permutations of nums.", testCases:[{input:"nums = [1,2,3]",expectedOutput:"[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]",isHidden:false}] },
    { id:"nc-70", order:70, title:"Subsets II", difficulty:"MEDIUM", pattern:"BACKTRACKING", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/subsets-ii/", description:"Return all unique subsets of nums (may contain duplicates).", testCases:[{input:"nums = [1,2,2]",expectedOutput:"[[],[1],[1,2],[1,2,2],[2],[2,2]]",isHidden:false}] },
    { id:"nc-71", order:71, title:"Combination Sum II", difficulty:"MEDIUM", pattern:"BACKTRACKING", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/combination-sum-ii/", description:"Find all unique combinations in candidates where numbers sum to target (each used once).", testCases:[{input:"candidates = [10,1,2,7,6,1,5], target = 8",expectedOutput:"[[1,1,6],[1,2,5],[1,7],[2,6]]",isHidden:false}] },
    { id:"nc-72", order:72, title:"Word Search", difficulty:"MEDIUM", pattern:"BACKTRACKING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/word-search/", description:"Check if a word exists in a 2D board of characters.", testCases:[{input:'board=[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word="ABCCED"',expectedOutput:"true",isHidden:false}] },
    { id:"nc-73", order:73, title:"Palindrome Partitioning", difficulty:"MEDIUM", pattern:"BACKTRACKING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/palindrome-partitioning/", description:"Return all possible palindrome partitionings of string s.", testCases:[{input:'s = "aab"',expectedOutput:'[["a","a","b"],["aa","b"]]',isHidden:false}] },
    { id:"nc-74", order:74, title:"Letter Combinations of a Phone Number", difficulty:"MEDIUM", pattern:"BACKTRACKING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/letter-combinations-of-a-phone-number/", description:"Return all possible letter combinations from a phone number.", testCases:[{input:'digits = "23"',expectedOutput:'["ad","ae","af","bd","be","bf","cd","ce","cf"]',isHidden:false}] },
    { id:"nc-75", order:75, title:"N-Queens", difficulty:"HARD", pattern:"BACKTRACKING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/n-queens/", description:"Place n queens on an n×n chessboard so no two queens attack each other.", testCases:[{input:"n = 4",expectedOutput:'[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]',isHidden:false}] },
    // Graphs
    { id:"nc-76", order:76, title:"Number of Islands", difficulty:"MEDIUM", pattern:"GRAPHS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/number-of-islands/", description:"Count the number of islands in a 2D binary grid.", testCases:[{input:'grid=[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]',expectedOutput:"1",isHidden:false}] },
    { id:"nc-77", order:77, title:"Clone Graph", difficulty:"MEDIUM", pattern:"GRAPHS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/clone-graph/", description:"Return a deep copy (clone) of a connected undirected graph.", testCases:[{input:"adjList = [[2,4],[1,3],[2,4],[1,3]]",expectedOutput:"[[2,4],[1,3],[2,4],[1,3]]",isHidden:false}] },
    { id:"nc-78", order:78, title:"Max Area of Island", difficulty:"MEDIUM", pattern:"GRAPHS", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/max-area-of-island/", description:"Find the maximum area of an island in a 2D binary grid.", testCases:[{input:"grid (see LeetCode)",expectedOutput:"6",isHidden:false}] },
    { id:"nc-79", order:79, title:"Pacific Atlantic Water Flow", difficulty:"MEDIUM", pattern:"GRAPHS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/pacific-atlantic-water-flow/", description:"Find all cells where water can flow to both Pacific and Atlantic oceans.", testCases:[{input:"heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]",expectedOutput:"[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]",isHidden:false}] },
    { id:"nc-80", order:80, title:"Surrounded Regions", difficulty:"MEDIUM", pattern:"GRAPHS", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/surrounded-regions/", description:"Replace all 'O's surrounded by 'X's.", testCases:[{input:'board=[["X","X","X","X"],["X","O","O","X"],["X","X","O","X"],["X","O","X","X"]]',expectedOutput:'[["X","X","X","X"],["X","X","X","X"],["X","X","X","X"],["X","O","X","X"]]',isHidden:false}] },
    { id:"nc-81", order:81, title:"Rotting Oranges", difficulty:"MEDIUM", pattern:"GRAPHS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/rotting-oranges/", description:"Find minimum minutes for all fresh oranges to rot (BFS).", testCases:[{input:"grid = [[2,1,1],[1,1,0],[0,1,1]]",expectedOutput:"4",isHidden:false}] },
    { id:"nc-82", order:82, title:"Walls and Gates", difficulty:"MEDIUM", pattern:"GRAPHS", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/walls-and-gates/", description:"Fill each empty room with the distance to its nearest gate.", testCases:[{input:"rooms (see LeetCode)",expectedOutput:"rooms filled",isHidden:false}] },
    { id:"nc-83", order:83, title:"Course Schedule", difficulty:"MEDIUM", pattern:"GRAPHS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/course-schedule/", description:"Determine if you can finish all courses given prerequisites.", testCases:[{input:"numCourses = 2, prerequisites = [[1,0]]",expectedOutput:"true",isHidden:false}] },
    { id:"nc-84", order:84, title:"Course Schedule II", difficulty:"MEDIUM", pattern:"GRAPHS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/course-schedule-ii/", description:"Return the order in which you should take courses.", testCases:[{input:"numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]",expectedOutput:"[0,2,1,3]",isHidden:false}] },
    { id:"nc-85", order:85, title:"Graph Valid Tree", difficulty:"MEDIUM", pattern:"GRAPHS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/graph-valid-tree/", description:"Determine if a given set of edges forms a valid tree.", testCases:[{input:"n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]",expectedOutput:"true",isHidden:false}] },
    { id:"nc-86", order:86, title:"Number of Connected Components in an Undirected Graph", difficulty:"MEDIUM", pattern:"GRAPHS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/", description:"Count the number of connected components in an undirected graph.", testCases:[{input:"n = 5, edges = [[0,1],[1,2],[3,4]]",expectedOutput:"2",isHidden:false}] },
    { id:"nc-87", order:87, title:"Redundant Connection", difficulty:"MEDIUM", pattern:"GRAPHS", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/redundant-connection/", description:"Find the edge that can be removed to make the graph a tree.", testCases:[{input:"edges = [[1,2],[1,3],[2,3]]",expectedOutput:"[2,3]",isHidden:false}] },
    { id:"nc-88", order:88, title:"Word Ladder", difficulty:"HARD", pattern:"GRAPHS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/word-ladder/", description:"Find the shortest transformation sequence from beginWord to endWord.", testCases:[{input:'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]',expectedOutput:"5",isHidden:false}] },
    // 1D DP
    { id:"nc-89", order:89, title:"Climbing Stairs", difficulty:"EASY", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/climbing-stairs/", description:"Count distinct ways to climb n stairs (1 or 2 steps at a time).", testCases:[{input:"n = 3",expectedOutput:"3",isHidden:false}] },
    { id:"nc-90", order:90, title:"Min Cost Climbing Stairs", difficulty:"EASY", pattern:"DYNAMIC_PROGRAMMING", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/min-cost-climbing-stairs/", description:"Find the minimum cost to reach the top of the floor.", testCases:[{input:"cost = [10,15,20]",expectedOutput:"15",isHidden:false}] },
    { id:"nc-91", order:91, title:"House Robber", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/house-robber/", description:"Find the maximum money you can rob without alerting the police.", testCases:[{input:"nums = [1,2,3,1]",expectedOutput:"4",isHidden:false}] },
    { id:"nc-92", order:92, title:"House Robber II", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/house-robber-ii/", description:"Houses arranged in a circle - maximum money without alerting police.", testCases:[{input:"nums = [2,3,2]",expectedOutput:"3",isHidden:false}] },
    { id:"nc-93", order:93, title:"Longest Palindromic Substring", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/longest-palindromic-substring/", description:"Return the longest palindromic substring.", testCases:[{input:'s = "babad"',expectedOutput:'"bab"',isHidden:false}] },
    { id:"nc-94", order:94, title:"Palindromic Substrings", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/palindromic-substrings/", description:"Count the number of palindromic substrings.", testCases:[{input:'s = "abc"',expectedOutput:"3",isHidden:false}] },
    { id:"nc-95", order:95, title:"Decode Ways", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/decode-ways/", description:"Count the number of ways to decode a digit string.", testCases:[{input:'s = "12"',expectedOutput:"2",isHidden:false}] },
    { id:"nc-96", order:96, title:"Coin Change", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/coin-change/", description:"Find the fewest number of coins needed to make up the amount.", testCases:[{input:"coins = [1,5,6,9], amount = 11",expectedOutput:"2",isHidden:false}] },
    { id:"nc-97", order:97, title:"Maximum Product Subarray", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/maximum-product-subarray/", description:"Find the contiguous subarray with the largest product.", testCases:[{input:"nums = [2,3,-2,4]",expectedOutput:"6",isHidden:false}] },
    { id:"nc-98", order:98, title:"Word Break", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/word-break/", description:"Determine if s can be segmented into words from wordDict.", testCases:[{input:'s = "leetcode", wordDict = ["leet","code"]',expectedOutput:"true",isHidden:false}] },
    { id:"nc-99", order:99, title:"Longest Increasing Subsequence", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/longest-increasing-subsequence/", description:"Return the length of the longest strictly increasing subsequence.", testCases:[{input:"nums = [10,9,2,5,3,7,101,18]",expectedOutput:"4",isHidden:false}] },
    { id:"nc-100", order:100, title:"Partition Equal Subset Sum", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/partition-equal-subset-sum/", description:"Determine if you can partition the array into two subsets with equal sum.", testCases:[{input:"nums = [1,5,11,5]",expectedOutput:"true",isHidden:false}] },
    // Trie
    { id:"nc-101", order:101, title:"Implement Trie (Prefix Tree)", difficulty:"MEDIUM", pattern:"TRIE", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/implement-trie-prefix-tree/", description:"Implement a trie with insert, search, and startsWith methods.", testCases:[{input:'["Trie","insert","search","startsWith"],[[],["apple"],["apple"],["app"]]',expectedOutput:"[null,null,true,true]",isHidden:false}] },
    { id:"nc-102", order:102, title:"Design Add and Search Words", difficulty:"MEDIUM", pattern:"TRIE", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/design-add-and-search-words-data-structure/", description:"Design a data structure that supports adding and searching words with wildcards.", testCases:[{input:'["WordDictionary","addWord","addWord","search","search"],[[],["bad"],["dad"],[".ad"],["b.."]]',expectedOutput:"[null,null,null,true,true]",isHidden:false}] },
    { id:"nc-103", order:103, title:"Word Search II", difficulty:"HARD", pattern:"TRIE", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/word-search-ii/", description:"Find all words from the dictionary that exist in the board.", testCases:[{input:'board=[["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words=["oath","pea","eat","rain"]',expectedOutput:'["eat","oath"]',isHidden:false}] },
    // 2D DP
    { id:"nc-104", order:104, title:"Unique Paths", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/unique-paths/", description:"Count unique paths from top-left to bottom-right of an m x n grid.", testCases:[{input:"m = 3, n = 7",expectedOutput:"28",isHidden:false}] },
    { id:"nc-105", order:105, title:"Longest Common Subsequence", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/longest-common-subsequence/", description:"Return the length of the longest common subsequence.", testCases:[{input:'text1 = "abcde", text2 = "ace"',expectedOutput:"3",isHidden:false}] },
    { id:"nc-106", order:106, title:"Best Time to Buy and Sell Stock with Cooldown", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/", description:"Maximize profit with a 1-day cooldown after selling.", testCases:[{input:"prices = [1,2,3,0,2]",expectedOutput:"3",isHidden:false}] },
    { id:"nc-107", order:107, title:"Coin Change 2", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/coin-change-ii/", description:"Count the number of combinations that make up the amount.", testCases:[{input:"amount = 5, coins = [1,2,5]",expectedOutput:"4",isHidden:false}] },
    { id:"nc-108", order:108, title:"Target Sum", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/target-sum/", description:"Count the number of ways to assign + and - to reach the target.", testCases:[{input:"nums = [1,1,1,1,1], target = 3",expectedOutput:"5",isHidden:false}] },
    { id:"nc-109", order:109, title:"Interleaving String", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/interleaving-string/", description:"Determine if s3 is formed by interleaving s1 and s2.", testCases:[{input:'s1 = "aabcc", s2 = "dbbca", s3 = "aadbbcbcac"',expectedOutput:"true",isHidden:false}] },
    { id:"nc-110", order:110, title:"Longest Increasing Path in a Matrix", difficulty:"HARD", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/longest-increasing-path-in-a-matrix/", description:"Find the length of the longest increasing path in a matrix.", testCases:[{input:"matrix = [[9,9,4],[6,6,8],[2,1,1]]",expectedOutput:"4",isHidden:false}] },
    { id:"nc-111", order:111, title:"Distinct Subsequences", difficulty:"HARD", pattern:"DYNAMIC_PROGRAMMING", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/distinct-subsequences/", description:"Count distinct subsequences of s that equal t.", testCases:[{input:'s = "rabbbit", t = "rabbit"',expectedOutput:"3",isHidden:false}] },
    { id:"nc-112", order:112, title:"Edit Distance", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/edit-distance/", description:"Find the minimum number of operations to convert word1 to word2.", testCases:[{input:'word1 = "horse", word2 = "ros"',expectedOutput:"3",isHidden:false}] },
    { id:"nc-113", order:113, title:"Burst Balloons", difficulty:"HARD", pattern:"DYNAMIC_PROGRAMMING", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/burst-balloons/", description:"Collect the maximum coins by bursting balloons.", testCases:[{input:"nums = [3,1,5,8]",expectedOutput:"167",isHidden:false}] },
    { id:"nc-114", order:114, title:"Regular Expression Matching", difficulty:"HARD", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/regular-expression-matching/", description:"Implement regular expression matching with '.' and '*'.", testCases:[{input:'s = "aa", p = "a*"',expectedOutput:"true",isHidden:false}] },
    // Greedy
    { id:"nc-115", order:115, title:"Maximum Subarray", difficulty:"MEDIUM", pattern:"DYNAMIC_PROGRAMMING", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/maximum-subarray/", description:"Find the subarray with the largest sum (Kadane's algorithm).", testCases:[{input:"nums = [-2,1,-3,4,-1,2,1,-5,4]",expectedOutput:"6",isHidden:false}] },
    { id:"nc-116", order:116, title:"Jump Game", difficulty:"MEDIUM", pattern:"ARRAYS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/jump-game/", description:"Determine if you can reach the last index.", testCases:[{input:"nums = [2,3,1,1,4]",expectedOutput:"true",isHidden:false}] },
    { id:"nc-117", order:117, title:"Jump Game II", difficulty:"MEDIUM", pattern:"ARRAYS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/jump-game-ii/", description:"Find the minimum number of jumps to reach the last index.", testCases:[{input:"nums = [2,3,1,1,4]",expectedOutput:"2",isHidden:false}] },
    { id:"nc-118", order:118, title:"Gas Station", difficulty:"MEDIUM", pattern:"ARRAYS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/gas-station/", description:"Find the starting gas station to complete the circuit.", testCases:[{input:"gas = [1,2,3,4,5], cost = [3,4,5,1,2]",expectedOutput:"3",isHidden:false}] },
    { id:"nc-119", order:119, title:"Hand of Straights", difficulty:"MEDIUM", pattern:"ARRAYS", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/hand-of-straights/", description:"Determine if the hand can be rearranged in groups of consecutive cards.", testCases:[{input:"hand = [1,2,3,6,2,3,4,7,8], groupSize = 3",expectedOutput:"true",isHidden:false}] },
    { id:"nc-120", order:120, title:"Merge Triplets to Form Target Triplet", difficulty:"MEDIUM", pattern:"ARRAYS", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/merge-triplets-to-form-target-triplet/", description:"Determine if you can form the target triplet by selecting and merging triplets.", testCases:[{input:"triplets = [[2,5,3],[1,8,4],[1,7,5]], target = [2,7,5]",expectedOutput:"true",isHidden:false}] },
    { id:"nc-121", order:121, title:"Partition Labels", difficulty:"MEDIUM", pattern:"ARRAYS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/partition-labels/", description:"Partition a string into as many parts as possible so each letter appears in only one part.", testCases:[{input:'s = "ababcbacadefegdehijhklij"',expectedOutput:"[9,7,8]",isHidden:false}] },
    { id:"nc-122", order:122, title:"Valid Parenthesis String", difficulty:"MEDIUM", pattern:"STACK_QUEUE", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/valid-parenthesis-string/", description:"Determine if a string with '(', ')', and '*' can be valid parentheses.", testCases:[{input:'s = "(*)"',expectedOutput:"true",isHidden:false}] },
    // Intervals
    { id:"nc-123", order:123, title:"Insert Interval", difficulty:"MEDIUM", pattern:"ARRAYS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/insert-interval/", description:"Insert a new interval into a sorted list of non-overlapping intervals.", testCases:[{input:"intervals = [[1,3],[6,9]], newInterval = [2,5]",expectedOutput:"[[1,5],[6,9]]",isHidden:false}] },
    { id:"nc-124", order:124, title:"Merge Intervals", difficulty:"MEDIUM", pattern:"ARRAYS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/merge-intervals/", description:"Merge all overlapping intervals.", testCases:[{input:"intervals = [[1,3],[2,6],[8,10],[15,18]]",expectedOutput:"[[1,6],[8,10],[15,18]]",isHidden:false}] },
    { id:"nc-125", order:125, title:"Non-overlapping Intervals", difficulty:"MEDIUM", pattern:"ARRAYS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/non-overlapping-intervals/", description:"Find the minimum number of intervals to remove for no overlaps.", testCases:[{input:"intervals = [[1,2],[2,3],[3,4],[1,3]]",expectedOutput:"1",isHidden:false}] },
    { id:"nc-126", order:126, title:"Meeting Rooms", difficulty:"EASY", pattern:"ARRAYS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/meeting-rooms/", description:"Determine if a person could attend all meetings.", testCases:[{input:"intervals = [[0,30],[5,10],[15,20]]",expectedOutput:"false",isHidden:false}] },
    { id:"nc-127", order:127, title:"Meeting Rooms II", difficulty:"MEDIUM", pattern:"HEAP", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/meeting-rooms-ii/", description:"Find the minimum number of conference rooms required.", testCases:[{input:"intervals = [[0,30],[5,10],[15,20]]",expectedOutput:"2",isHidden:false}] },
    { id:"nc-128", order:128, title:"Minimum Interval to Include Each Query", difficulty:"HARD", pattern:"HEAP", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/minimum-interval-to-include-each-query/", description:"For each query, find the size of the smallest interval containing it.", testCases:[{input:"intervals = [[1,4],[2,4],[3,6],[4,4]], queries = [2,3,4,5]",expectedOutput:"[3,3,1,4]",isHidden:false}] },
    // Math & Geometry
    { id:"nc-129", order:129, title:"Rotate Image", difficulty:"MEDIUM", pattern:"ARRAYS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/rotate-image/", description:"Rotate an n×n matrix 90 degrees clockwise in-place.", testCases:[{input:"matrix = [[1,2,3],[4,5,6],[7,8,9]]",expectedOutput:"[[7,4,1],[8,5,2],[9,6,3]]",isHidden:false}] },
    { id:"nc-130", order:130, title:"Spiral Matrix", difficulty:"MEDIUM", pattern:"ARRAYS", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/spiral-matrix/", description:"Return all elements of the matrix in spiral order.", testCases:[{input:"matrix = [[1,2,3],[4,5,6],[7,8,9]]",expectedOutput:"[1,2,3,6,9,8,7,4,5]",isHidden:false}] },
    { id:"nc-131", order:131, title:"Set Matrix Zeroes", difficulty:"MEDIUM", pattern:"ARRAYS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/set-matrix-zeroes/", description:"If an element is 0, set its entire row and column to 0 in-place.", testCases:[{input:"matrix = [[1,1,1],[1,0,1],[1,1,1]]",expectedOutput:"[[1,0,1],[0,0,0],[1,0,1]]",isHidden:false}] },
    { id:"nc-132", order:132, title:"Happy Number", difficulty:"EASY", pattern:"MATH", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/happy-number/", description:"Determine if a number is happy (sum of squares of digits eventually reaches 1).", testCases:[{input:"n = 19",expectedOutput:"true",isHidden:false}] },
    { id:"nc-133", order:133, title:"Plus One", difficulty:"EASY", pattern:"MATH", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/plus-one/", description:"Increment the large integer represented as an array of digits.", testCases:[{input:"digits = [1,2,3]",expectedOutput:"[1,2,4]",isHidden:false}] },
    { id:"nc-134", order:134, title:"Pow(x, n)", difficulty:"MEDIUM", pattern:"MATH", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/powx-n/", description:"Implement pow(x, n) using fast exponentiation.", testCases:[{input:"x = 2.00000, n = 10",expectedOutput:"1024.00000",isHidden:false}] },
    { id:"nc-135", order:135, title:"Multiply Strings", difficulty:"MEDIUM", pattern:"MATH", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/multiply-strings/", description:"Multiply two non-negative integers represented as strings.", testCases:[{input:'num1 = "2", num2 = "3"',expectedOutput:'"6"',isHidden:false}] },
    { id:"nc-136", order:136, title:"Detect Squares", difficulty:"MEDIUM", pattern:"MATH", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/detect-squares/", description:"Count the number of ways to choose 3 points to form a square.", testCases:[{input:"see LeetCode",expectedOutput:"see LeetCode",isHidden:false}] },
    // Bit Manipulation
    { id:"nc-137", order:137, title:"Single Number", difficulty:"EASY", pattern:"BIT_MANIPULATION", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/single-number/", description:"Find the element that appears only once in an array where every other element appears twice.", testCases:[{input:"nums = [2,2,1]",expectedOutput:"1",isHidden:false}] },
    { id:"nc-138", order:138, title:"Number of 1 Bits", difficulty:"EASY", pattern:"BIT_MANIPULATION", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/number-of-1-bits/", description:"Return the number of set bits in n (Hamming weight).", testCases:[{input:"n = 11",expectedOutput:"3",isHidden:false}] },
    { id:"nc-139", order:139, title:"Counting Bits", difficulty:"EASY", pattern:"BIT_MANIPULATION", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/counting-bits/", description:"Return an array of the number of 1 bits for each i from 0 to n.", testCases:[{input:"n = 5",expectedOutput:"[0,1,1,2,1,2]",isHidden:false}] },
    { id:"nc-140", order:140, title:"Reverse Bits", difficulty:"EASY", pattern:"BIT_MANIPULATION", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/reverse-bits/", description:"Reverse bits of a given 32 bits unsigned integer.", testCases:[{input:"n = 00000010100101000001111010011100",expectedOutput:"964176192",isHidden:false}] },
    { id:"nc-141", order:141, title:"Missing Number", difficulty:"EASY", pattern:"BIT_MANIPULATION", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/missing-number/", description:"Find the missing number in [0, n].", testCases:[{input:"nums = [3,0,1]",expectedOutput:"2",isHidden:false}] },
    { id:"nc-142", order:142, title:"Sum of Two Integers", difficulty:"MEDIUM", pattern:"BIT_MANIPULATION", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/sum-of-two-integers/", description:"Calculate the sum of two integers without using + or -.", testCases:[{input:"a = 1, b = 2",expectedOutput:"3",isHidden:false}] },
    { id:"nc-143", order:143, title:"Reverse Integer", difficulty:"MEDIUM", pattern:"MATH", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/reverse-integer/", description:"Reverse digits of a 32-bit signed integer.", testCases:[{input:"x = 123",expectedOutput:"321",isHidden:false}] },
    // Advanced Graphs
    { id:"nc-144", order:144, title:"Reconstruct Itinerary", difficulty:"HARD", pattern:"GRAPHS", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/reconstruct-itinerary/", description:"Reconstruct the itinerary in order from a list of airline tickets.", testCases:[{input:'tickets = [["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]]',expectedOutput:'["JFK","MUC","LHR","SFO","SJC"]',isHidden:false}] },
    { id:"nc-145", order:145, title:"Min Cost to Connect All Points", difficulty:"MEDIUM", pattern:"GRAPHS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/min-cost-to-connect-all-points/", description:"Connect all points with minimum total Manhattan distance (Prim's / Kruskal's).", testCases:[{input:"points = [[0,0],[2,2],[3,10],[5,2],[7,0]]",expectedOutput:"20",isHidden:false}] },
    { id:"nc-146", order:146, title:"Network Delay Time", difficulty:"MEDIUM", pattern:"GRAPHS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/network-delay-time/", description:"Find the minimum time for all nodes to receive a signal (Dijkstra's).", testCases:[{input:"times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2",expectedOutput:"2",isHidden:false}] },
    { id:"nc-147", order:147, title:"Swim in Rising Water", difficulty:"HARD", pattern:"GRAPHS", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/swim-in-rising-water/", description:"Find the minimum time to swim from top-left to bottom-right.", testCases:[{input:"grid = [[0,2],[1,3]]",expectedOutput:"3",isHidden:false}] },
    { id:"nc-148", order:148, title:"Alien Dictionary", difficulty:"HARD", pattern:"GRAPHS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/alien-dictionary/", description:"Find the order of characters in an alien language from a sorted dictionary.", testCases:[{input:'words = ["wrt","wrf","er","ett","rftt"]',expectedOutput:'"wertf"',isHidden:false}] },
    { id:"nc-149", order:149, title:"Cheapest Flights Within K Stops", difficulty:"MEDIUM", pattern:"GRAPHS", mustDo:true, leetcodeUrl:"https://leetcode.com/problems/cheapest-flights-within-k-stops/", description:"Find the cheapest price from src to dst with at most k stops.", testCases:[{input:"n=4, flights=[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src=0, dst=3, k=1",expectedOutput:"700",isHidden:false}] },
    { id:"nc-150", order:150, title:"Number of Islands II", difficulty:"HARD", pattern:"GRAPHS", mustDo:false, leetcodeUrl:"https://leetcode.com/problems/number-of-islands-ii/", description:"Count islands after each land addition (Union-Find).", testCases:[{input:"m=3, n=3, positions=[[0,0],[0,1],[1,2],[2,1]]",expectedOutput:"[1,1,2,3]",isHidden:false}] },
  ];

  for (const p of neet150) {
    const problem = await prisma.problem.upsert({
      where: { id: p.id },
      create: { id: p.id, title: p.title, description: p.description, difficulty: p.difficulty, pattern: p.pattern, leetcodeUrl: p.leetcodeUrl, gfgUrl: gfgFor(p.leetcodeUrl), mustDo: p.mustDo, order: p.order, sheetId: neetSheet.id, companies: COMPANY_MAP[p.title] ?? [] },
      update: { title: p.title, difficulty: p.difficulty, pattern: p.pattern, mustDo: p.mustDo, gfgUrl: gfgFor(p.leetcodeUrl), companies: COMPANY_MAP[p.title] ?? [] },
    });
    for (let i = 0; i < p.testCases.length; i++) {
      await prisma.testCase.upsert({
        where: { id: `${p.id}-tc-${i}` },
        create: { id: `${p.id}-tc-${i}`, problemId: problem.id, ...p.testCases[i] },
        update: { input: p.testCases[i].input, expectedOutput: p.testCases[i].expectedOutput },
      });
    }
  }
  console.log(`Seeded ${neet150.length} NeetCode 150 problems`);

  // ── Top 300 FAANG Bank ────────────────────────────────────────────────────
  const { TOP_300 } = await import("./top300");

  const top300Sheet = await prisma.sheet.upsert({
    where: { id: "preset-top300" },
    create: { id: "preset-top300", name: "Top 300 · Industry Picks", source: "TOP300", isPreset: true },
    update: { name: "Top 300 · Industry Picks" },
  });

  for (const p of TOP_300) {
    await prisma.problem.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        pattern: p.pattern,
        leetcodeUrl: p.leetcodeUrl,
        gfgUrl: gfgFor(p.leetcodeUrl),
        mustDo: p.mustDo,
        order: p.order,
        sheetId: top300Sheet.id,
        companies: COMPANY_MAP[p.title] ?? [],
      },
      update: { title: p.title, difficulty: p.difficulty, pattern: p.pattern, mustDo: p.mustDo, gfgUrl: gfgFor(p.leetcodeUrl), companies: COMPANY_MAP[p.title] ?? [] },
    });
  }

  console.log(`Seeded ${TOP_300.length} Top 300 FAANG problems`);

  // ── Patch custom-sheet problems with full descriptions and test cases ───────
  const customProblems = await prisma.problem.findMany({
    where: { sheet: { isPreset: false }, leetcodeUrl: { not: null } },
    select: { id: true, leetcodeUrl: true },
  });

  let patched = 0;
  for (const cp of customProblems) {
    const content = cp.leetcodeUrl ? PROBLEM_CONTENT[cp.leetcodeUrl] : null;
    if (!content) continue;

    await prisma.problem.update({
      where: { id: cp.id },
      data: { description: content.description },
    });

    // Replace test cases with the full authoritative set
    await prisma.testCase.deleteMany({ where: { problemId: cp.id } });
    await prisma.testCase.createMany({
      data: content.testCases.map((tc) => ({
        problemId: cp.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
      })),
    });

    patched++;
  }

  if (patched > 0) console.log(`Patched ${patched} custom-sheet problem(s) with full descriptions`);
  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
