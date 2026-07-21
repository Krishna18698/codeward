export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { execLimiter } from "@/lib/ratelimit";
import { tryConsume, refund, getRemaining } from "@/lib/execBudget";
import { execute, isExecConfigured, type ExecLanguage } from "@/lib/jdoodle";

const LANGUAGES: ExecLanguage[] = ["nodejs", "python", "kotlin", "csharp", "go", "java"];

export interface CodeRunResult {
  passed: boolean | null;
  output: string;
  cpuTime: string | null;
  creditsRemaining: number | null;
}

/** Canned, no-user-input snippet per language for the Phase-0 "ping" spike —
 *  lets us verify JDoodle end-to-end (keys, versionIndex, credit cost) through
 *  the real route without executing any candidate code. */
const PING_SNIPPETS: Record<ExecLanguage, string> = {
  nodejs: `console.log("__EXEC_OK__")`,
  python: `print("__EXEC_OK__")`,
  kotlin: `fun main() { println("__EXEC_OK__") }`,
  csharp: `using System; class P { static void Main() { Console.WriteLine("__EXEC_OK__"); } }`,
  go: `package main\nimport "fmt"\nfunc main() { fmt.Println("__EXEC_OK__") }`,
  java: `public class Main { public static void main(String[] a) { System.out.println("__EXEC_OK__"); } }`,
};

/** Assembles a runnable script (candidate code + ground-truth test harness) for
 *  a given mode. Wired per phase: bug-hunt (Phase 2), build-it (Phase 3). The
 *  harness is loaded server-side only so tests are never leaked or tamperable. */
async function loadHarness(
  mode: string,
  slug: string,
  language: ExecLanguage,
  code: string,
): Promise<{ script: string; sentinel: string } | null> {
  void mode; void slug; void language; void code; // TODO(phase 2/3): dispatch to getBugHuntHarness / getBuildItHarness.
  return null;
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isExecConfigured()) {
    return NextResponse.json({ error: "Code execution not configured" }, { status: 503 });
  }

  if (execLimiter) {
    const { success } = await execLimiter.limit(userId);
    if (!success) {
      return NextResponse.json({ error: "Too many runs — take a short break." }, { status: 429 });
    }
  }

  const body = (await req.json()) as {
    mode?: string;
    slug?: string;
    language?: string;
    code?: string;
  };
  const { mode, slug, language, code } = body;

  if (!language || !LANGUAGES.includes(language as ExecLanguage)) {
    return NextResponse.json({ error: "Missing or unsupported language" }, { status: 400 });
  }
  const lang = language as ExecLanguage;

  // Resolve the script to run + how to detect success.
  let script: string;
  let sentinel: string;

  if (mode === "ping") {
    script = PING_SNIPPETS[lang];
    sentinel = "__EXEC_OK__";
  } else {
    if (!mode || !slug || typeof code !== "string") {
      return NextResponse.json({ error: "Missing mode, slug, or code" }, { status: 400 });
    }
    if (code.length > 20000) {
      return NextResponse.json({ error: "Code is too long." }, { status: 400 });
    }
    const harness = await loadHarness(mode, slug, lang, code);
    if (!harness) return NextResponse.json({ error: "Unknown mode or exercise" }, { status: 404 });
    script = harness.script;
    sentinel = harness.sentinel;
  }

  // Reserve a slot from the shared daily budget BEFORE spending a credit.
  const budget = await tryConsume();
  if (!budget.allowed) {
    return NextResponse.json(
      { error: "Daily run budget reached — grading still works without running.", budgetExhausted: true },
      { status: 429 },
    );
  }

  const result = await execute(lang, script);

  if (!result.ok) {
    // Non-quota failure wasted the reserved slot — give it back.
    if (result.kind !== "quota") await refund();
    const status = result.kind === "quota" ? 429 : result.kind === "unconfigured" ? 503 : 502;
    return NextResponse.json(
      { error: result.message, budgetExhausted: result.kind === "quota" },
      { status },
    );
  }

  const payload: CodeRunResult = {
    passed: result.output.includes(sentinel),
    output: result.output,
    cpuTime: result.cpuTime,
    creditsRemaining: budget.remaining ?? (await getRemaining()),
  };
  return NextResponse.json(payload);
}
