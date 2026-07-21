export const chatAtScale = {
  slug: "chat-at-scale",
  title: "Chat Systems at Scale",
  hook: "A chat app looks trivial until you count the hard parts: millions of live connections, presence that's always slightly wrong, per-conversation ordering across devices, and reconnect storms.",
  tags: ["Realtime", "Distributed Systems"],
  minutes: 35,
  level: "Senior IC",
  prerequisites: "WebSockets, pub/sub fan-out, and connection-state basics.",
  afterThis: "Push Notifications at Scale — reaching users who are offline or backgrounded.",
  suggestedFirstPass: "Read the fan-out and presence sections first; message ordering and delivery come easier once those are clear.",
  body: `
## Why it's a real systems question

"Design WhatsApp" sounds like CRUD with a websocket. The floor is: client opens a persistent connection, sends a message, server stores it and pushes to the recipient. The ceiling — where the interview lives — is everything about *scale and realtime*: holding millions of connections, routing a message to whichever server the recipient happens to be connected to, delivering to a user's three devices in the same order, showing presence without melting the system, and surviving the moment a datacenter blip disconnects a million clients that all reconnect at once.

## The connection layer

Chat needs **server push**, so you hold a persistent connection — **WebSocket** (or long-lived HTTP/2 / SSE for one-directional). The first scaling fact: a single well-tuned server holds ~**100K-1M** idle connections (memory and file descriptors are the limits, not CPU — mostly-idle sockets are cheap). So millions of users = a fleet of **gateway/connection servers**, each owning a slice of connections, sitting behind an L4 load balancer (L7 is wasteful for long-lived sockets).

Now the routing problem: user A (connected to gateway 7) messages user B (connected to gateway 34). Gateway 7 must get the message to gateway 34. You need a **connection registry** — "which gateway is user B on right now?" — kept in Redis or a similar fast store, updated on connect/disconnect. Gateway 7 looks up B, and forwards the message to gateway 34 (directly, or via a message bus like Kafka/Redis pub-sub that all gateways subscribe to). B might be on multiple gateways (multiple devices) — fan out to all.

## Storage and the fan-out question

Messages are stored for history and offline delivery. A message belongs to a **conversation**; the natural model is an append-only log per conversation, partitioned by conversation ID (so all of one chat's messages live together and stay ordered — connect this to Kafka's partition-key idea). Wide-column stores (Cassandra) fit: high write throughput, partition by conversation, cluster by timestamp for range reads ("last 50 messages").

**1:1 vs group fan-out** is the classic follow-up:
- **1:1**: write once to the conversation, push to the (few) connected devices. Easy.
- **Large groups / channels**: a message to a 100K-member group can't push synchronously to 100K connections on the write path. This is **fan-out on write vs fan-out on read**:
  - *Fan-out on write*: when a message arrives, immediately write it into every recipient's inbox/feed. Fast reads, but a message to a huge group is a huge write amplification — and most members may be offline.
  - *Fan-out on read*: store the message once in the channel; each member's client pulls from the channel when it opens. Cheap writes, but active-member reads all hit the channel (hot partition).
  - Real systems **mix**: fan-out on write for small groups and active members; fan-out on read for huge channels; the celebrity/mega-group case gets special handling (same hot-key problem as caches and feeds).

## Ordering, delivery, and "seen"

**Ordering must hold per conversation, across a user's devices.** If A sends "1" then "2", B must never see "2" before "1" on any device. Partitioning by conversation gives you a single ordered log; assign each message a **monotonic sequence number within the conversation** (not wall-clock time — clocks skew across senders). Clients order by sequence, not arrival.

**Delivery semantics** are at-least-once end to end: the server may push a message, not get an ack (client dropped), and re-push on reconnect. So messages carry a stable ID and clients **dedupe** — idempotency again, at the client. The ticks/receipts (sent → delivered → read) are just acknowledgements flowing back: *sent* = server stored it, *delivered* = recipient device acked receipt, *read* = recipient opened it. Each is an event; read receipts at scale are their own fan-out (don't push "read" synchronously to everyone in a big group).

**Offline delivery**: recipient not connected → the message sits durably in storage / their inbox; on reconnect the client asks "everything since sequence N" and catches up. This is why the durable log matters more than the live push.

## Presence — always slightly wrong, on purpose

"Who's online" seems trivial and is a scaling trap. Naive presence (broadcast every online/offline to all contacts instantly) is a fan-out bomb: a user with 1,000 contacts toggling online sends 1,000 notifications, and flaky mobile networks toggle constantly. Real designs **soften** it:
- Presence is a heartbeat with a TTL in Redis ("online" = seen a ping in the last N seconds); miss the window → offline. No explicit offline event needed.
- Presence updates are **throttled and pulled**, not pushed on every change — clients poll or subscribe with debouncing.
- Accept that presence is **eventually consistent and approximate**. "Last seen 2 minutes ago" is fine; instantaneous global presence is not worth its cost. Saying "presence is deliberately approximate" is the senior move.

## Reconnect storms and backpressure

A gateway restarts or a network blips — a million clients disconnect and **all try to reconnect at once**, hammering the auth service, the registry, and the message backfill. This is the same retry-storm failure family as cache stampedes. Defenses: **jittered exponential backoff** on the client (never reconnect all at once), connection **rate limiting** at the gateway, and load-shedding so the backfill queries don't take down the DB. Design the reconnect path as carefully as the happy path — it's where chat systems actually fall over.

## Interview traps

1. Ordering by **timestamp** — sender clocks skew; use a per-conversation monotonic sequence.
2. Synchronous **fan-out on write to huge groups** — write amplification melts the write path; mix in fan-out on read for big channels.
3. Naive **presence broadcast** — a fan-out bomb; use heartbeat+TTL, throttle, and accept approximation.
4. Forgetting **multi-device** — one user, many connections; the registry maps user → set of gateways, and ordering/receipts must hold across all of them.
5. Ignoring the **reconnect storm** — a datacenter blip becomes an outage without jittered backoff and load-shedding.
6. Exactly-once delivery — impossible; at-least-once + client dedupe on message ID.

## The 60-second summary

> A fleet of gateway servers each holds ~a million WebSocket connections; a Redis registry maps user → gateway(s) so a message routes to wherever the recipient is connected, across their devices. Messages persist to an append-only per-conversation log (partitioned by conversation, sequenced monotonically) for ordering and offline catch-up. Small groups fan out on write, huge channels fan out on read. Delivery is at-least-once with client dedupe; receipts are acks flowing back. Presence is heartbeat+TTL, throttled and approximate on purpose. And the reconnect storm — a million clients reconnecting after a blip — needs jittered backoff and load-shedding, or it becomes the outage.
`,
};
