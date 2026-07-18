import type { BugHuntExercise } from "./types";

export const slowProfileEndpoint: BugHuntExercise = {
  slug: "slow-profile-endpoint",
  title: "Profile page endpoint times out under load",
  brief:
    "The /users/:id/feed endpoint is fine in dev but p99 latency spikes to 8s in production and it started timing out. " +
    "The query log below is from one single request. Find why it's slow.",
  language: "TypeScript",
  minutes: 12,
  files: [
    {
      name: "feed-service.ts",
      code: `export async function getFeed(userId: string) {
  const posts = await db.post.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const feed = [];
  for (const post of posts) {
    const author = await db.user.findUnique({ where: { id: post.authorId } });
    const likes = await db.like.count({ where: { postId: post.id } });
    feed.push({ ...post, author, likes });
  }
  return feed;
}`,
    },
  ],
  testOutput: "",
  logs: `[query] SELECT * FROM "Post" WHERE "authorId" = $1 ORDER BY "createdAt" DESC LIMIT 20   (4ms)
[query] SELECT * FROM "User" WHERE "id" = $1   (3ms)
[query] SELECT count(*) FROM "Like" WHERE "postId" = $1   (5ms)
[query] SELECT * FROM "User" WHERE "id" = $1   (3ms)
[query] SELECT count(*) FROM "Like" WHERE "postId" = $1   (4ms)
[query] SELECT * FROM "User" WHERE "id" = $1   (3ms)
[query] SELECT count(*) FROM "Like" WHERE "postId" = $1   (6ms)
   ... 34 more query lines ...
[request] GET /users/42/feed  →  200  (8140ms, 41 queries)`,
  rootCause:
    "Classic N+1 query problem. The endpoint runs 1 query for the posts, then inside the loop runs 2 more queries per post (author + like count) — 1 + 20×2 = 41 sequential queries. In dev with a local DB and little data each is ~4ms, but in production with network round-trips to the DB and connection contention, 41 serialized queries blow the latency budget. The author lookup is also redundant: every post has the same authorId (it's the user's own feed).",
  category: "performance",
  ruledOut: [
    "The database needs an index — no, each query is already fast (3-6ms); the problem is the number of queries, not the speed of any one.",
    "The connection pool is too small — a contributing factor under load, but the root cause is issuing 41 queries where 2-3 would do.",
    "orderBy without an index is slow — the posts query is 4ms; sorting isn't the bottleneck.",
  ],
  canonicalFix:
    "Eliminate the N+1. Fetch all like counts in one grouped query (`groupBy postId`) keyed by the post IDs, and drop the per-post author lookup entirely since authorId is constant (fetch the one author once, or `include` it). Two or three queries total instead of 41. With Prisma, `include: { _count: { select: { likes: true } } }` collapses the like counts into the posts query.",
};
