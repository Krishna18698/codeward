export const SYSTEM_DESIGN_CONCEPTS = [
  {
    title: "URL Shortener Design",
    source: "sd:url-shortener",
    content: `# Designing a URL Shortener (bit.ly)

## Functional requirements
- Given a long URL, return a short URL
- Redirect short URL to original long URL
- (Optional) Custom aliases, analytics, expiry

## Non-functional requirements
- High availability (99.99%)
- Low latency reads (<10ms p99)
- Scale: 100M URLs created/day, 10B redirects/day

## Capacity estimation
- Write: 100M/day = ~1150 writes/sec
- Read: 10B/day = ~115K reads/sec (read-heavy, 100:1 ratio)
- Storage: 100M URLs × 500 bytes = 50GB/day → manageable

## Core design

### URL shortening
Two approaches:
1. **Hash-based**: MD5/SHA256 of long URL, take first 7 chars. Problem: collisions.
2. **Counter-based**: Use a distributed ID generator (Snowflake), encode to Base62.

Base62 with 7 chars = 62^7 = ~3.5 trillion unique URLs. Enough.

### Data model
\`\`\`
urls table:
  short_code  VARCHAR(7)  PRIMARY KEY
  long_url    TEXT        NOT NULL
  user_id     BIGINT
  created_at  TIMESTAMP
  expires_at  TIMESTAMP
  click_count BIGINT DEFAULT 0
\`\`\`

### System components
1. **API servers** (stateless, horizontally scalable)
2. **PostgreSQL** (source of truth for URL mappings)
3. **Redis cache** (cache hot short→long mappings, 80% of traffic served from cache)
4. **Redirect flow**: GET /{code} → check Redis → if miss, check DB → 301/302 redirect

### Caching strategy
- LRU cache in Redis, cache top 20% of URLs that serve 80% of traffic
- TTL = 24h for cached entries
- 301 (permanent) vs 302 (temporary): use 302 if you need accurate click analytics

### Scalability
- Read replicas for DB (reads >> writes)
- CDN for redirect responses
- Consistent hashing for cache sharding

## Interview tips
- Clarify: analytics needed? Custom aliases? Expiry?
- Mention CAP theorem: favor availability + partition tolerance over consistency for reads
- Discuss 301 vs 302 trade-off (browser caching vs analytics accuracy)`,
  },
  {
    title: "Designing a Chat System",
    source: "sd:chat-system",
    content: `# Designing a Chat System (WhatsApp/Slack)

## Functional requirements
- 1:1 messaging
- Group chats (up to 500 members)
- Online/offline presence
- Push notifications when offline
- Message persistence and history

## Non-functional requirements
- Low latency (<100ms message delivery)
- High availability
- Scale: 50M DAU, each sends 40 messages/day = 2B messages/day

## Core components

### Connection layer: WebSockets
HTTP polling wastes resources. Use **WebSockets** for persistent bidirectional connections.
- Each user maintains a WebSocket connection to a chat server
- Chat servers are stateful (hold active connections)
- Use a service registry (ZooKeeper) to track which server holds which user's connection

### Message flow (1:1)
1. User A sends message via WebSocket to Chat Server 1
2. Chat Server 1 checks if User B is online (via user presence service)
3. If online: route to Chat Server 2 (which holds B's connection) via **message queue**
4. If offline: store message, send push notification (APNs/FCM)
5. Store message in DB for history

### Message storage
- **Cassandra** (wide-column store) is ideal: append-only writes, fast reads by user_id + timestamp
- Schema: partition key = (sender_id, receiver_id), clustering key = timestamp

### Presence system
- Heartbeat: client sends pulse every 5s, server marks user online
- Redis: store user_id → {server_id, last_seen} with TTL of 30s
- Publish presence changes to subscribers via pub/sub

### Group chat fan-out
Two strategies:
1. **Fan-out on write**: when message sent, write to each member's inbox. Fast reads, slow writes for large groups.
2. **Fan-out on read**: store once, each member fetches. Fast writes, slower reads.
Use fan-out on write for small groups, fan-out on read for large groups.

### Push notifications
- Apple Push Notification Service (APNs) for iOS
- Firebase Cloud Messaging (FCM) for Android
- Store device tokens per user in DB

## Data model
\`\`\`
messages: id, sender_id, receiver_id, group_id, content, created_at, status
channels: id, name, type (1:1 / group), created_at
memberships: user_id, channel_id, joined_at
\`\`\``,
  },
  {
    title: "Designing a News Feed (Twitter/Facebook)",
    source: "sd:news-feed",
    content: `# Designing a Social Media News Feed

## Requirements
- Users follow other users
- See posts from people they follow, ordered by time
- Like, comment on posts
- Scale: 500M users, 300M DAU, 500M tweets/day

## The core challenge: feed generation

### Option 1: Fan-out on write (push model)
When user A posts:
- Find all of A's followers
- Write the post to each follower's feed cache (Redis sorted set)
- On read: just fetch from cache → very fast reads

**Problem**: celebrities with 100M followers cause massive write amplification (100M writes per tweet).

### Option 2: Fan-out on read (pull model)
When user opens feed:
- Fetch IDs of people they follow
- Fetch their recent posts
- Merge and sort

**Problem**: slow reads for users who follow thousands of accounts.

### Hybrid approach (used by Twitter)
- Regular users (< 1M followers): fan-out on write
- Celebrities (> 1M followers): fan-out on read, injected at read time
- Combine both feeds at read time

## Data model
\`\`\`
users: id, username, follower_count, following_count
posts: id, user_id, content, media_url, created_at, like_count
follows: follower_id, followee_id, created_at
feed_cache: user_id → sorted set of {post_id, score=timestamp}
\`\`\`

## Caching strategy
- Feed: Redis sorted set per user, store top 1000 post IDs
- Posts: cache hot post content (LRU)
- User graph: cache follow relationships

## Media storage
- Images/videos → S3 / CDN (CloudFront)
- Thumbnails generated asynchronously after upload
- Store only URL in posts table

## Timeline of a tweet being served
1. User opens app → GET /feed
2. Check Redis cache for user's feed (list of post IDs)
3. Fetch post details from posts service (also cached)
4. Hydrate with user data, like counts
5. Return paginated results

## Interview tips
- Always clarify: is this read-heavy or write-heavy? (feeds are read-heavy)
- Discuss trade-offs between push vs pull vs hybrid
- Pagination: cursor-based (post_id) > offset-based for feeds`,
  },
  {
    title: "System Design Fundamentals: Caching",
    source: "sd:caching",
    content: `# Caching in System Design

## Why cache?
- Reduce database load
- Decrease latency (RAM >> disk)
- Handle traffic spikes

## Cache placement strategies

### Client-side caching
Browser cache, CDN edge caches. Good for static assets, public content.

### CDN caching
Geographically distributed cache for static/semi-static content. Reduces origin server load.

### Server-side (application) caching
Redis or Memcached. Cache results of expensive DB queries or computations.

### Database caching
Query cache built into DB. Usually limited, better to use explicit caching.

## Cache eviction policies
- **LRU (Least Recently Used)**: evict item not accessed for longest time. Good for temporal locality.
- **LFU (Least Frequently Used)**: evict item accessed fewest times. Better for skewed access patterns.
- **FIFO**: evict oldest added. Simple but often suboptimal.
- **TTL-based**: expire after fixed time. Useful for data with natural staleness (sessions, rate limits).

## Cache invalidation strategies (the hard part)
1. **TTL**: data expires after N seconds. Simple, but stale reads during TTL window.
2. **Write-through**: write to cache AND DB simultaneously. No stale reads, but write latency increases.
3. **Write-back (write-behind)**: write to cache only, async flush to DB. Fast writes, risk of data loss.
4. **Cache-aside (lazy loading)**: read from cache; on miss, read DB, populate cache. Most common pattern.

## Cache-aside pattern
\`\`\`python
def get_user(user_id):
    user = redis.get(f"user:{user_id}")
    if user:
        return user  # cache hit
    user = db.query("SELECT * FROM users WHERE id = ?", user_id)
    redis.setex(f"user:{user_id}", ttl=3600, value=user)
    return user
\`\`\`

## Thundering herd problem
When cache expires, many requests simultaneously go to DB. Solutions:
- **Mutex/lock**: only one thread refreshes cache, others wait
- **Probabilistic early expiry**: randomly refresh before actual expiry
- **Staggered TTLs**: add small random jitter to expiry times

## Redis vs Memcached
- **Redis**: supports rich data structures (sorted sets, lists, pub/sub), persistence, replication. Use for leaderboards, rate limiting, pub/sub.
- **Memcached**: simpler, slightly faster for pure key-value, multi-threaded. Use when you just need a fast KV cache.

## Cache sizing rule of thumb
The 80/20 rule: 20% of your data accounts for 80% of reads. Cache that 20%.`,
  },
  {
    title: "System Design Fundamentals: Databases",
    source: "sd:databases",
    content: `# Database Design in System Design Interviews

## SQL vs NoSQL — how to choose

### Use SQL (PostgreSQL, MySQL) when:
- Data has clear structure and relationships
- You need ACID transactions (financial systems, orders)
- Complex queries with JOINs
- Data integrity is critical

### Use NoSQL when:
- Massive scale with flexible schema (MongoDB)
- Time-series or append-only data (Cassandra, DynamoDB)
- Caching / session storage (Redis)
- Full-text search (Elasticsearch)
- Graph relationships (Neo4j)

## Scaling SQL databases

### Vertical scaling
Bigger machine. Has limits, eventually you need horizontal.

### Read replicas
Write to primary, read from replicas. Good for read-heavy workloads (most apps).

### Sharding (horizontal partitioning)
Split data across multiple DB instances by a shard key.
- **Range sharding**: users A-M on shard 1, N-Z on shard 2. Risk: hot spots.
- **Hash sharding**: hash(user_id) % num_shards. Even distribution. Harder to range query.
- **Directory-based**: lookup table maps key → shard. Flexible but lookup is a single point of failure.

## Indexes
- B-tree index: default, great for equality and range queries
- Composite index: (user_id, created_at) — column order matters
- Covering index: include all columns needed by query to avoid table lookup
- Never index low-cardinality columns (boolean, status with few values)

## Normalization vs denormalization
- **Normalized**: less data duplication, slower reads (JOINs), consistent writes
- **Denormalized**: duplicate data, faster reads, more complex writes
- In practice: normalize for write-heavy systems, denormalize for read-heavy

## CAP Theorem
A distributed system can guarantee at most 2 of:
- **Consistency**: all nodes see same data at same time
- **Availability**: every request gets a response
- **Partition tolerance**: system works despite network splits

Network partitions are inevitable in distributed systems, so you choose C or A:
- **CP systems** (HBase, ZooKeeper): consistent but may be unavailable during partitions
- **AP systems** (Cassandra, CouchDB): available but may return stale data

## Replication strategies
- **Synchronous replication**: leader waits for all replicas to confirm write. Strong consistency, higher latency.
- **Asynchronous replication**: leader responds after writing locally. Lower latency, risk of data loss on leader failure.
- **Semi-synchronous**: wait for at least one replica. Balance of both.`,
  },
  {
    title: "Distributed Systems: Consistency and Availability",
    source: "sd:distributed-systems",
    content: `# Distributed Systems Fundamentals

## Consistency models

### Strong consistency
After a write completes, all subsequent reads return that value. Most user-friendly but expensive.
Example: bank account balance after a transfer.

### Eventual consistency
After writes stop, all nodes will eventually converge to the same value. Allows higher availability.
Example: social media like counts (slightly stale is fine).

### Read-your-writes consistency
After you write, you'll always see your own writes. Important for user-facing updates.

## Consensus algorithms

### Raft
Used for leader election and log replication. Easier to understand than Paxos.
- Nodes: leader, followers, candidates
- Leader election: timeout → candidate → request votes → win majority → become leader
- Log replication: leader appends entry → replicates to majority → commits

## Message queues

### When to use
- Decouple producers from consumers
- Buffer bursts of traffic
- Ensure reliable delivery
- Enable async processing

### Kafka
- Topics → Partitions (ordered log)
- Consumers in consumer groups (each partition consumed by one consumer in group)
- Offset-based: consumers track their position
- Retention: keeps messages for configurable period (default 7 days)
- Use case: event streaming, activity tracking, audit logs

### RabbitMQ
- Message broker, push-based
- Queues, exchanges, routing keys
- Messages deleted after consumption
- Use case: task queues, RPC patterns

## Rate limiting algorithms

### Token bucket
Tokens added at fixed rate. Request consumes a token. Allows bursts up to bucket size.

### Leaky bucket
Requests enter queue. Processed at fixed rate. Smooths bursts, can drop excess.

### Fixed window
Count requests per time window. Problem: burst at window boundaries (2x limit).

### Sliding window log
Store timestamp of each request. Count requests in last N seconds. Accurate but memory-intensive.

### Sliding window counter
Hybrid: use fixed windows but weight based on position in current window.

## Consistent hashing
Used for distributed caching and sharding.
- Map both nodes and keys to a ring via hash function
- Key belongs to nearest node clockwise
- Adding/removing a node only redistributes 1/n of keys (vs all keys with modular hashing)
- Virtual nodes: each physical node has multiple points on the ring for better distribution`,
  },
];
