// ─── Code-execution daily budget guard ──────────────────────────────────────
// JDoodle's free tier is 20 credits/day, SHARED across the whole app (one key).
// This is a conservative global counter so we stop BEFORE hitting JDoodle's
// hard limit (compiled languages may cost >1 credit/run, so we leave headroom).
// When the budget is gone, callers fall back to LLM-only grading — execution is
// a bonus signal, never the sole gate.
//
// No Redis configured (local dev) → allow and rely on JDoodle's own server-side
// limit as the backstop, so local testing still works.

import { Redis } from "@upstash/redis";

/** Our internal cap, kept below JDoodle's real 20/day to leave headroom for
 *  compiled-language credit costs. Override via env once the spike confirms the
 *  true per-language cost. */
const DAILY_BUDGET = Number(process.env.EXEC_DAILY_BUDGET ?? "18");
const TTL_SECONDS = 60 * 60 * 48; // 2 days — comfortably past any day boundary

function redis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

function todayKey(): string {
  return `exec:budget:${new Date().toISOString().slice(0, 10)}`; // UTC date
}

/** Reserve one execution slot for today. Returns allowed=false when the daily
 *  budget is spent. remaining is null when no Redis is configured (unknown). */
export async function tryConsume(): Promise<{ allowed: boolean; remaining: number | null }> {
  const r = redis();
  if (!r) return { allowed: true, remaining: null };

  const key = todayKey();
  const used = await r.incr(key);
  if (used === 1) await r.expire(key, TTL_SECONDS);

  if (used > DAILY_BUDGET) {
    await r.decr(key); // don't let the counter run away past the cap
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: Math.max(0, DAILY_BUDGET - used) };
}

/** Give a reserved slot back — call when execution failed for a non-quota
 *  reason (network/config error) so a wasted call doesn't cost the day's budget. */
export async function refund(): Promise<void> {
  const r = redis();
  if (!r) return;
  const key = todayKey();
  const used = (await r.get<number>(key)) ?? 0;
  if (Number(used) > 0) await r.decr(key);
}

export async function getRemaining(): Promise<number | null> {
  const r = redis();
  if (!r) return null;
  const used = (await r.get<number>(todayKey())) ?? 0;
  return Math.max(0, DAILY_BUDGET - Number(used));
}
