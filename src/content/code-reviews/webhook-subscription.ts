import type { CodeReviewExercise } from "./types";

export const webhookSubscription: CodeReviewExercise = {
  slug: "webhook-subscription",
  title: "Add webhook subscription endpoint",
  brief:
    "Customers want webhooks for our v2 API — they POST a URL and we fire callbacks on order events. " +
    "This is the subscription endpoint plus a test-ping that fires immediately so they can verify their endpoint. Auth middleware already puts the account on the request.",
  language: "TypeScript",
  minutes: 14,
  files: [
    {
      name: "webhooks.ts",
      code: `router.post("/webhooks", async (req, res) => {
  const { url, events } = req.body;

  const sub = await db.webhook.create({
    data: { accountId: req.account.id, url, events },
  });

  // Fire a test ping so the customer can verify their endpoint
  await fetch(url, {
    method: "POST",
    body: JSON.stringify({ type: "ping", subscriptionId: sub.id }),
  });

  res.json(sub);
});`,
    },
  ],
  bugs: [
    {
      id: "ssrf",
      severity: 5,
      category: "security",
      description:
        "The server immediately fetches a customer-supplied URL with no validation — a classic SSRF. A customer can point it at http://169.254.169.254/ (cloud metadata), http://localhost:6379 (internal Redis), or other internal services and use our server as a proxy into the private network. Validate the URL: https only, public IPs only (block private/link-local ranges after DNS resolution), and consider an allowlist / egress proxy.",
    },
    {
      id: "sync-ping-blocks",
      severity: 4,
      category: "performance",
      description:
        "The test ping is awaited synchronously on the request path with no timeout. A slow or hanging customer endpoint blocks the API response (and holds the request) for as long as their server stalls. The ping should be fired asynchronously (queue it) or awaited with a strict timeout.",
    },
    {
      id: "no-url-validation",
      severity: 4,
      category: "correctness",
      description:
        "`url` and `events` are stored unvalidated. A malformed URL, an empty/oversized value, or unknown event names get persisted, and later deliveries fail cryptically. Validate the URL format and that `events` are a known subset before creating the subscription.",
    },
    {
      id: "no-signing-secret",
      severity: 3,
      category: "security",
      description:
        "No signing secret is generated for the subscription. Webhook deliveries must be signed (HMAC over the payload) so the customer can verify callbacks genuinely came from us; without a per-subscription secret, recipients can't authenticate the webhooks and can be spoofed.",
    },
    {
      id: "ping-failure-unhandled",
      severity: 2,
      category: "correctness",
      description:
        "If the test ping throws (unreachable endpoint), the unhandled rejection fails the whole request and the subscription creation appears to fail even though it was persisted — confusing state. The ping result should be reported separately from the create success.",
    },
  ],
};
