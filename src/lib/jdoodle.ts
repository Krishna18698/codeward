// ─── JDoodle Compiler API client ───────────────────────────────────────────
// Hosted code execution (https://www.jdoodle.com/compiler-api). Chosen because
// it runs on Vercel with no self-hosted sandbox, and one integration covers
// every language we need. FREE TIER = 20 credits/day, SHARED across the whole
// app (one key). Callers MUST go through the budget guard in execBudget.ts and
// only ever execute on an explicit user action — never automatically.
//
// The API takes a SINGLE script (no multi-file array), so a per-language test
// harness is templated together with the candidate's code into one script by
// the caller before it reaches here.
//
// Phase-0 spike (verified live): credit cost is 1/run for both interpreted and
// compiled languages (Python and C# each cost exactly 1), so 20/day = 20 runs.
// python3@versionIndex "4" and csharp@versionIndex "4" confirmed working.
// nodejs/kotlin/go/java versionIndexes below are best-known defaults, not yet
// spike-verified — they'll be exercised (and corrected here if needed) as Bug
// Hunt (nodejs) and Build It (kotlin) land. LANGUAGE_MAP is the single source.

export type ExecLanguage = "nodejs" | "python" | "kotlin" | "csharp" | "go" | "java";

/** Maps our normalized language id → JDoodle's `language` + `versionIndex`.
 *  versionIndex values are JDoodle's "pick a runtime version" selector; the
 *  higher the index the newer the runtime. Defaults below are best-known and
 *  MUST be confirmed in the Phase-0 spike. */
const LANGUAGE_MAP: Record<ExecLanguage, { language: string; versionIndex: string }> = {
  nodejs: { language: "nodejs", versionIndex: "4" },
  python: { language: "python3", versionIndex: "4" },
  kotlin: { language: "kotlin", versionIndex: "3" },
  csharp: { language: "csharp", versionIndex: "4" },
  go: { language: "go", versionIndex: "4" },
  java: { language: "java", versionIndex: "4" },
};

const EXECUTE_URL = "https://api.jdoodle.com/v1/execute";
const CREDIT_SPENT_URL = "https://api.jdoodle.com/v1/credit-spent";

export type JDoodleResult =
  | {
      ok: true;
      /** Combined stdout+stderr as JDoodle returns it (no separate streams). */
      output: string;
      cpuTime: string | null;
      memory: string | null;
    }
  | {
      ok: false;
      /** "unconfigured" (no keys) | "quota" (daily limit) | "error" (other). */
      kind: "unconfigured" | "quota" | "error";
      message: string;
    };

function creds(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.JDOODLE_CLIENT_ID;
  const clientSecret = process.env.JDOODLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/** Execute a single script in the given language. Does NOT enforce the daily
 *  budget — the caller (route) must check execBudget first. */
export async function execute(
  language: ExecLanguage,
  script: string,
  stdin = "",
): Promise<JDoodleResult> {
  const c = creds();
  if (!c) return { ok: false, kind: "unconfigured", message: "JDoodle API keys not configured" };

  const mapping = LANGUAGE_MAP[language];

  let res: Response;
  try {
    res = await fetch(EXECUTE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: c.clientId,
        clientSecret: c.clientSecret,
        script,
        stdin,
        language: mapping.language,
        versionIndex: mapping.versionIndex,
      }),
    });
  } catch (e) {
    return { ok: false, kind: "error", message: e instanceof Error ? e.message : "Network error" };
  }

  // JDoodle signals the daily-limit case with 429 (and sometimes a 200 body
  // whose `error` mentions the limit) — treat both as quota exhaustion so the
  // caller can fall back to LLM-only grading rather than surfacing a raw error.
  if (res.status === 429) {
    return { ok: false, kind: "quota", message: "JDoodle daily limit reached" };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { ok: false, kind: "error", message: `JDoodle returned non-JSON (status ${res.status})` };
  }

  const b = body as { output?: string; statusCode?: number; cpuTime?: string; memory?: string; error?: string };

  if (!res.ok || typeof b.output !== "string") {
    const msg = b.error || `JDoodle error (status ${res.status})`;
    const kind = /limit|credit|quota/i.test(msg) ? "quota" : "error";
    return { ok: false, kind, message: msg };
  }

  return { ok: true, output: b.output, cpuTime: b.cpuTime ?? null, memory: b.memory ?? null };
}

/** How many credits JDoodle says we've spent today (for observability / the
 *  spike). Separate endpoint; also costs nothing. Returns null if unavailable. */
export async function creditsSpentToday(): Promise<number | null> {
  const c = creds();
  if (!c) return null;
  try {
    const res = await fetch(CREDIT_SPENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: c.clientId, clientSecret: c.clientSecret }),
    });
    if (!res.ok) return null;
    const b = (await res.json()) as { used?: number };
    return typeof b.used === "number" ? b.used : null;
  } catch {
    return null;
  }
}

export function isExecConfigured(): boolean {
  return creds() !== null;
}
