import type { BrowserContext, Request } from "@playwright/test";
import { ORIGIN } from "../config";

/**
 * Browser-side read-only guard, installed on every context the harness opens.
 *
 * Every database write in the app lives in a POST, PATCH or DELETE handler —
 * no GET route and no page writes during render — so the rule is exact:
 *
 *   - GET/HEAD to our origin: allowed.
 *   - NextAuth's own posts that don't write (credentials sign-in, sign-out,
 *     client logging): allowed. Sessions are JWTs, so neither touches the DB.
 *   - A write the harness asked for: answered here with the same body the real
 *     handler returns, so the UI behaves exactly as after a real save. The
 *     request never leaves the browser.
 *   - Any other write: aborted, and recorded so the run can fail on it.
 *
 * That last line is what catches /api/auth/forgot-password, which would
 * otherwise have sent a real email as well as written a reset token.
 *
 * The server has its own guard (server/db-readonly.cjs) that refuses any
 * non-read SQL, so a write that slipped past this one still could not land.
 */

const AUTH_PASSTHROUGH = new Set([
  "/api/auth/callback/credentials",
  "/api/auth/signout",
  "/api/auth/_log",
]);

export type StubHit = { method: string; path: string; body: unknown };

type Stub = {
  method: string;
  path: RegExp;
  respond: (req: Request) => { status?: number; contentType?: string; body: string };
};

const json = (value: unknown) => ({ contentType: "application/json", body: JSON.stringify(value) });

/** The writes the app makes in the journeys we drive, with the response each
 *  real handler returns on success. */
export const WRITE_STUBS: Stub[] = [
  { method: "POST", path: /^\/api\/dsa\/status$/, respond: () => json({ success: true }) },
  { method: "POST", path: /^\/api\/dsa\/revise$/, respond: () => json({ success: true }) },
  { method: "POST", path: /^\/api\/dsa\/hint$/, respond: () => json({ success: true }) },
  { method: "POST", path: /^\/api\/notes\/upsert$/, respond: () => json({ success: true }) },
  {
    method: "POST",
    path: /^\/api\/dsa\/sheets\/[^/]+\/add-problem$/,
    respond: (req) => json({ problem: { id: "stub-problem", ...(safeJson(req.postData()) as object) } }),
  },
  {
    method: "POST",
    path: /^\/api\/mentor\/conversations$/,
    respond: () => json({ id: "stub-conversation", title: "Two pointers vs sliding window" }),
  },
  {
    method: "POST",
    path: /^\/api\/mentor\/conversations\/[^/]+\/messages$/,
    respond: () => json({ success: true }),
  },
  {
    // The mentor streams plain text. A canned answer keeps the run offline —
    // no Groq call, no tokens spent, and the same reply every time.
    method: "POST",
    path: /^\/api\/mentor\/chat$/,
    respond: () => ({ contentType: "text/plain; charset=utf-8", body: MENTOR_REPLY }),
  },
];

export const MENTOR_REPLY = [
  "Reach for **two pointers** when the input is sorted (or can be) and you are looking for a *pair* — the pointers move toward each other and each step rules out a whole row of candidates.",
  "",
  "Reach for a **sliding window** when the question is about a *contiguous* run: longest, shortest, or count of subarrays meeting a condition. Both ends move the same direction, and you keep a running summary of what's inside.",
  "",
  "A quick tell: if the problem says *subarray* or *substring*, think window. If it says *pair* or *triplet* on sorted data, think pointers.",
].join("\n");

function safeJson(text: string | null): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export type Guard = {
  /** Writes answered by a stub, in order. */
  stubbed: StubHit[];
  /** Writes that had no stub and were aborted. Should stay empty. */
  blocked: string[];
};

export async function installGuard(context: BrowserContext): Promise<Guard> {
  const guard: Guard = { stubbed: [], blocked: [] };

  await context.route("**/*", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();

    if (url.origin !== ORIGIN) return route.continue();
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") return route.continue();
    if (AUTH_PASSTHROUGH.has(url.pathname)) return route.continue();

    const stub = WRITE_STUBS.find((s) => s.method === method && s.path.test(url.pathname));
    if (stub) {
      guard.stubbed.push({ method, path: url.pathname, body: safeJson(req.postData()) });
      const { status = 200, contentType, body } = stub.respond(req);
      return route.fulfill({ status, contentType, body });
    }

    guard.blocked.push(`${method} ${url.pathname}`);
    return route.abort("blockedbyclient");
  });

  return guard;
}
