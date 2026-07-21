export const pushNotifications = {
  slug: "push-notifications",
  title: "Push Notifications at Scale",
  hook: "A notification pipeline: fan-out, queueing, provider delivery, token lifecycle, and the failure modes an interviewer probes — because 'send a push' hides a surprising amount of systems work.",
  tags: ["Infrastructure"],
  minutes: 28,
  level: "Senior IC",
  prerequisites: "Message queues, fan-out, and third-party gateway (APNs/FCM) basics.",
  afterThis: "Chat Systems at Scale — the realtime path push notifications complement.",
  suggestedFirstPass: "Focus on the bounded-concurrency and retry/invalid-token sections; that's where delivery correctness lives.",
  body: `
## The shape of the problem

"When an order ships, notify the user" sounds like one API call. At scale it's a pipeline: some event triggers a notification, you resolve *who* to notify and *how* (push, SMS, email), look up their device tokens, respect their preferences and quiet hours, hand each message to the right external provider (APNs for iOS, FCM for Android, an SMS gateway, an email provider), handle the providers' rate limits and failures, and never send the same thing twice. The interview is about the pipeline and its failure modes, not the one call.

## Trigger → fan-out → delivery

**Triggering.** Notifications come from events (order shipped, someone liked your post, a marketing blast). Decouple the trigger from delivery with a **queue** — the event producer drops a notification request and returns immediately; it must never block on provider latency. This also absorbs spikes (a marketing campaign to 10M users) and lets you scale delivery workers independently.

**Fan-out.** A single event can mean many notifications: a post from a creator with 1M followers, or one user with 4 devices. Same fan-out-on-write vs fan-out-on-read trade as feeds and chat: for a mega-broadcast you don't synchronously enqueue 1M individual sends on the request path — you enqueue one "fan-out job" that expands into per-recipient messages by a pool of workers reading the follower list in batches. Celebrity/mega-list cases get special handling (the recurring hot-key theme).

**Delivery workers** pull from the queue and call the provider. Keep them stateless and horizontally scalable; the queue is the buffer between bursty triggers and rate-limited providers.

## The token lifecycle — the unglamorous hard part

You push to a **device token** (APNs/FCM), not a user. Tokens are where real systems leak reliability:

- Tokens **change and expire** — app reinstall, OS update, long inactivity. Pushing to a dead token wastes quota and, worse, can get your sender flagged.
- Providers tell you when a token is invalid — **APNs/FCM return "unregistered"** on send. You **must** consume that feedback and **delete the dead token**, or your invalid-token rate climbs and providers throttle you. A pipeline that ignores token-cleanup feedback slowly rots.
- One user has **many tokens** (phone, tablet, web). The mapping is user → set of active tokens; fan out to all, prune as they die.

Interviewers probe this because it separates "I called the FCM SDK once" from "I've operated a notification system." Name token expiry and the invalidation-feedback loop unprompted.

## Idempotency and dedup — don't double-notify

The queue is at-least-once (a worker can crash after sending but before acking, and the message redelivers). Without protection the user gets the same "your order shipped" twice. Give each notification a stable **idempotency key** (e.g. \`event_id + user_id + channel\`) and dedupe at the delivery worker or provider layer — the same pattern as payments and chat. Double-notifying is the visible bug that says "we didn't think about redelivery."

## Provider limits, retries, and the storm

External providers enforce **rate limits** and have **outages**. The pipeline must:
- **Respect provider rate limits** — token-bucket the send rate per provider so you don't get throttled or banned; the queue naturally smooths bursts into a steady send rate.
- **Retry transient failures with jittered backoff** — but bound retries and send terminal failures to a **dead-letter queue** for inspection, rather than retrying forever (a poison message shouldn't loop). And when a provider recovers from an outage, jitter prevents all the queued retries from stampeding it (retry-storm family again).
- **Circuit-break** a failing provider so a downstream outage doesn't back up the whole queue.

## Preferences, quiet hours, and dedup windows

Not everything should be sent:
- **User preferences** (this user muted marketing; wants email not push) — check before delivery, not after.
- **Quiet hours / timezones** — a 3am push is a churn event; schedule to the user's local morning. The timezone bug (sending at the wrong local time) is a classic correctness miss.
- **Notification collapsing / rate limiting per user** — 50 likes in a minute should be one "50 people liked your post," not 50 pushes. Providers even support a **collapse key** so a newer notification replaces an unshown older one.

## Delivery guarantees and the honest answer

Push is **best-effort, at-least-once at the pipeline, no guarantee at the device.** APNs/FCM don't promise delivery — the phone may be off, out of coverage, or the OS may drop low-priority notifications. So: never rely on a push for correctness (don't make "we sent a push" the source of truth for anything important — the in-app inbox / pull is), and track **delivery receipts where the provider offers them** to measure (not guarantee) delivery. Saying "push is a best-effort nudge; the durable source of truth is the pull-based inbox" is the mature framing.

## Interview traps

1. **Blocking the trigger on provider latency** — always enqueue and return; delivery is async.
2. Ignoring **token expiry / invalidation feedback** — the pipeline rots; you must consume "unregistered" and prune.
3. No **idempotency** — at-least-once queues double-notify without a dedup key.
4. Forgetting **provider rate limits** — you get throttled/banned; token-bucket the send rate.
5. **Timezone-naive scheduling** — 3am pushes; schedule to local time, respect quiet hours.
6. Treating push as **reliable** — it isn't; the in-app inbox is the source of truth, push is the nudge.

## The 60-second summary

> Triggers drop notification requests on a queue so delivery is async and burst-absorbing; a fan-out stage expands mega-broadcasts into per-recipient messages in batches. Delivery workers resolve the user's active device tokens, check preferences and quiet hours, dedupe on an idempotency key, and call APNs/FCM/SMS respecting per-provider rate limits with jittered-backoff retries and a dead-letter queue. Critically, consume the providers' invalid-token feedback and prune dead tokens, collapse chatty notifications, and treat push as best-effort — the pull-based in-app inbox, not the push, is the source of truth.
`,
};
