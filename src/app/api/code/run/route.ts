export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { execLimiter } from "@/lib/ratelimit";
import { tryConsume, refund, getRemaining } from "@/lib/execBudget";
import { execute, isExecConfigured, type ExecLanguage } from "@/lib/jdoodle";
import { getBuildItStageWithSolution } from "@/content/build-it";
import { BUILD_IT_PASS_SENTINEL } from "@/content/build-it/languages";

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

/** Language-specific preamble so the assembled script compiles even when the
 *  candidate's edit omits common imports. */
const CSHARP_PREAMBLE = "using System;\nusing System.Collections.Generic;\nusing System.Threading;\n\n";
/** JDoodle names the Kotlin source "JDoodle.kt" and runs class "JDoodle", but a
 *  top-level main compiles to "JDoodleKt" → ClassNotFoundException. This forces
 *  the generated class name to match what JDoodle's runner invokes. */
const KOTLIN_PREAMBLE = '@file:JvmName("JDoodle")\n\n';

/** Assembles a runnable script (candidate code + authoritative test harness).
 *  The harness is loaded server-side from content so the executed tests can't
 *  be tampered with, even though the same tests are shown read-only in the UI. */
function loadHarness(
  mode: string,
  slug: string,
  stage: number | undefined,
  language: ExecLanguage,
  code: string,
): { script: string; sentinel: string } | null {
  if (mode === "build-it") {
    if (typeof stage !== "number") return null;
    const gradedStage = getBuildItStageWithSolution(slug, stage);
    // Build It only executes csharp/python/kotlin.
    if (!gradedStage || (language !== "csharp" && language !== "python" && language !== "kotlin")) return null;
    const harness = gradedStage.tests?.[language];
    if (!harness) return null; // design-only stage (e.g. the concurrency invariant)
    const body = `${code}\n\n${harness}`;
    const preamble = language === "csharp" ? CSHARP_PREAMBLE : language === "kotlin" ? KOTLIN_PREAMBLE : "";
    return { script: preamble + body, sentinel: BUILD_IT_PASS_SENTINEL };
  }
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
    stage?: number;
    language?: string;
    code?: string;
  };
  const { mode, slug, stage, language, code } = body;

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
    const harness = loadHarness(mode, slug, stage, lang, code);
    if (!harness) return NextResponse.json({ error: "No runnable tests for this exercise/stage" }, { status: 404 });
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
