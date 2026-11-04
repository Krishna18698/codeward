import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
export { LOGIN_THROTTLED } from "@/lib/loginErrors";

type Window = `${number} ${"s" | "m" | "h" | "d"}`;

/** One policy, one counter.
 *
 *  Every limiter used to share the prefix "prepapc", so two policies keyed on
 *  the same identifier wrote to the same Redis key: sheet generation and code
 *  execution (both per user, both hourly) ate each other's allowance, and so
 *  did registration and password reset (both per IP). The name is now part of
 *  the prefix, so each policy counts only its own requests. */
function make(name: string, requests: number, window: Window): Ratelimit | null {
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
    prefix: `codeward:rl:${name}`,
  });
}

// 5 registrations per hour per IP
export const registerLimiter = make("register", 5, "1 h");

// 30 AI calls per minute per user — mentor chat and the three graders share
// this one budget on purpose: it caps a user's model usage, whichever mode.
export const chatLimiter = make("ai", 30, "1 m");

// 5 sheet generations per hour per user
export const sheetLimiter = make("sheet", 5, "1 h");

// 8 code executions per hour per user — a per-user cap so a single user can't
// drain the shared daily JDoodle budget (the global cap lives in execBudget.ts).
export const execLimiter = make("exec", 8, "1 h");

// 4 password-reset requests per hour per IP — enough for a genuine retry,
// tight enough that the endpoint can't be used to spam an inbox.
export const passwordResetLimiter = make("password-reset", 4, "1 h");

// Failed password sign-ins: 10 per 15 minutes per account, 30 per IP. Only
// failures count, so someone who signs in correctly never spends any of it.
const loginAccountLimiter = make("login-account", 10, "15 m");
const loginIpLimiter = make("login-ip", 30, "15 m");

type LoginLimiter = Pick<Ratelimit, "getRemaining" | "limit">;
type LoginLimiters = { account: LoginLimiter | null; ip: LoginLimiter | null };
const LOGIN_LIMITERS: LoginLimiters = { account: loginAccountLimiter, ip: loginIpLimiter };

/** Whether this account and IP may try a password. Checked BEFORE the user
 *  lookup and bcrypt, so a blocked caller costs neither.
 *
 *  Fails open: if Redis is unreachable, signing in still works — a limiter
 *  outage shouldn't lock every user out. */
export async function loginAllowed(email: string, ip: string, limiters: LoginLimiters = LOGIN_LIMITERS): Promise<boolean> {
  try {
    const [account, byIp] = await Promise.all([
      limiters.account?.getRemaining(email),
      limiters.ip?.getRemaining(ip),
    ]);
    return (account?.remaining ?? 1) > 0 && (byIp?.remaining ?? 1) > 0;
  } catch (e) {
    console.error("[auth] login limiter unavailable, allowing attempt:", e);
    return true;
  }
}

/** Spends one attempt from the account's and the IP's allowance. */
export async function recordLoginFailure(email: string, ip: string, limiters: LoginLimiters = LOGIN_LIMITERS): Promise<void> {
  try {
    await Promise.all([limiters.account?.limit(email), limiters.ip?.limit(ip)]);
  } catch (e) {
    console.error("[auth] could not record a failed login:", e);
  }
}
