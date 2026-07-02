import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Window = `${number} ${"s" | "m" | "h" | "d"}`;

function make(requests: number, window: Window): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    // Gracefully skip rate limiting when env vars aren't configured (local dev)
    return null;
  }
  return new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: "prepapc",
  });
}

// 5 registrations per hour per IP
export const registerLimiter = make(5, "1 h");

// 30 chat messages per minute per user
export const chatLimiter = make(30, "1 m");

// 5 sheet generations per hour per user
export const sheetLimiter = make(5, "1 h");
