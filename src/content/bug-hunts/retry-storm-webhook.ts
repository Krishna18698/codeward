import type { BugHuntExercise } from "./types";

export const retryStormWebhook: BugHuntExercise = {
  slug: "retry-storm-webhook",
  title: "A downstream blip becomes a self-inflicted outage",
  brief:
    "When a customer's webhook endpoint is briefly slow, a 2-second downstream blip turns into a 20-minute backlog and a flood of duplicate deliveries. " +
    "Find why the retry logic amplifies the problem instead of absorbing it.",
  language: "TypeScript",
  minutes: 12,
  files: [
    {
      name: "webhook-sender.ts",
      code: `export async function deliver(event: WebhookEvent) {
  let attempt = 0;
  while (attempt < 5) {
    try {
      await httpPost(event.url, event.payload, { timeout: 2000 });
      return; // delivered
    } catch {
      attempt++;
      // Back off and retry
      await sleep(1000);
    }
  }
  await deadLetter(event);
}`,
    },
  ],
  testOutput: `=== RUN   TestDownstreamBlip
    injected: target endpoint slow (3s responses) for 2 seconds, then healthy
    events in flight: 5,000
--- FAIL: retry amplification (21.7s)
    total HTTP requests sent: 24,300  (~5x the events)
    all 5,000 workers retried in lockstep at t+1s, t+2s, t+3s...
    target received synchronized bursts of 5,000 requests
    duplicate deliveries observed: 3,900 events delivered 2+ times
    backlog cleared after 20m instead of ~2s`,
  rootCause:
    "Two compounding problems. (1) The retry delay is a FIXED 1-second sleep with no exponential growth and no jitter, so all 5,000 in-flight deliveries that failed during the blip retry in synchronized lockstep — hammering the just-recovering endpoint with simultaneous bursts, which keeps it slow, which causes more retries: a retry storm that sustains the outage far past the original 2-second blip. (2) Retries aren't idempotent — a request that actually succeeded but timed out at 2s gets retried, so the endpoint receives and processes duplicates (the 3,900 double-deliveries).",
  category: "correctness",
  ruledOut: [
    "The timeout is too short — raising it reduces false-timeout retries but doesn't stop the synchronized lockstep retries that amplify the load; the fixed-delay-no-jitter storm is the core issue.",
    "The customer's endpoint is too slow — it was slow for only 2 seconds; the 20-minute outage is self-inflicted by the retry pattern, not by the downstream.",
    "5 retries is too many — fewer retries reduces total volume but synchronized bursts of 5,000 still overwhelm a recovering endpoint; the pattern, not the count, is the bug.",
  ],
  canonicalFix:
    "Exponential backoff WITH jitter, plus idempotent delivery. Grow the delay (1s, 2s, 4s, 8s…) and add randomness (`delay = base * 2**attempt * (0.5 + random())`) so retries spread out instead of firing in lockstep — this lets a recovering endpoint breathe. Send a stable idempotency/event ID with each delivery so the receiver can dedupe timed-out-but-succeeded requests. Optionally add a circuit breaker per endpoint so a persistently failing target stops receiving the full retry volume.",
};
