export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";
import { chatLimiter } from "@/lib/ratelimit";
import { getBugHuntWithSolution } from "@/content/bug-hunts";

export type FindingCategory = "root-cause" | "side-effect";
export type FindingStatus = "fixed" | "partial" | "missed" | "introduced";

export interface BugFinding {
  file: string;
  line: number | null;
  category: FindingCategory;
  status: FindingStatus;
  title: string;
  detail: string;
}

export interface BugHuntGradeResult {
  score: number;
  rootCaught: boolean;
  fixReasonable: boolean;
  findings: BugFinding[];
  feedback: string;
  // revealed after grading
  rootCause: string;
  canonicalFix: string;
  ruledOut: string[];
}

type ParsedFinding = {
  file?: string;
  line?: number | null;
  category?: string;
  status?: string;
  title?: string;
  detail?: string;
};
type ParsedGrade = {
  findings?: ParsedFinding[];
  rootCauseInDiagnosis?: boolean;
  feedback?: string;
};

/** Groq's tool_use_failed carries the raw output in failed_generation at a varying depth. */
function findFailedGeneration(err: unknown, depth = 0): string | null {
  if (depth > 4 || err === null || typeof err !== "object") return null;
  const o = err as Record<string, unknown>;
  if (typeof o.failed_generation === "string") return o.failed_generation;
  for (const v of Object.values(o)) {
    const found = findFailedGeneration(v, depth + 1);
    if (found) return found;
  }
  return null;
}

const CATEGORIES: FindingCategory[] = ["root-cause", "side-effect"];
const STATUSES: FindingStatus[] = ["fixed", "partial", "missed", "introduced"];

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (chatLimiter) {
    const { success } = await chatLimiter.limit(userId);
    if (!success) return NextResponse.json({ error: "Too many requests — slow down a bit." }, { status: 429 });
  }

  const { slug, diagnosis, code } = (await req.json()) as { slug?: string; diagnosis?: string; code?: string };
  if (!slug || typeof diagnosis !== "string") {
    return NextResponse.json({ error: "Missing slug or diagnosis" }, { status: 400 });
  }
  const trimmed = diagnosis.trim();
  if (trimmed.length < 30) {
    return NextResponse.json({ error: "Describe the root cause in a bit more detail first." }, { status: 400 });
  }
  if (trimmed.length > 4000) {
    return NextResponse.json({ error: "Diagnosis is too long." }, { status: 400 });
  }
  const fixedCode = typeof code === "string" ? code.slice(0, 20000) : null;

  const exercise = getBugHuntWithSolution(slug);
  if (!exercise) return NextResponse.json({ error: "Unknown exercise" }, { status: 404 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Grading not configured" }, { status: 503 });

  const groq = new Groq({ apiKey });

  const originalCode = exercise.files.map((f) => `// ${f.name}\n${f.code}`).join("\n\n");

  const systemPrompt = `You are a senior engineer reviewing a candidate's bug fix, exactly like a code-review diff. You are given the ORIGINAL broken code, the candidate's EDITED code, and the known root cause + canonical fix. Produce a structured, line-anchored review of what the candidate changed.

Emit one finding per notable observation:
- category "root-cause": about THE bug they were asked to fix. status "fixed" (their edit genuinely resolves the real mechanism), "partial" (right direction but incomplete/leaky), or "missed" (the buggy code is unchanged or their change doesn't address the real cause).
- category "side-effect": a change the candidate introduced that is NOT part of the intended fix. status "introduced" (a new bug/regression/typo/corruption they added — e.g. renamed a symbol to something invalid, broke unrelated logic).

Anchor each finding to the file and the approximate line number IN THE CANDIDATE'S EDITED CODE. Judge by meaning, not cosmetics — reformatting or renaming a local variable safely is not a side-effect. Do not invent side-effects that aren't really there. Always emit exactly one root-cause finding.`;

  const codeBlock = fixedCode
    ? `Candidate's EDITED code:\n"""\n${fixedCode}\n"""`
    : `(The candidate did not edit the code — emit a root-cause finding with status "missed" and judge only their diagnosis.)`;

  const userPrompt = `Known root cause:\n${exercise.rootCause}\n\nKnown correct fix:\n${exercise.canonicalFix}\n\nTempting hypotheses that are WRONG (do not credit these):\n${exercise.ruledOut.map((r) => `- ${r}`).join("\n")}\n\nORIGINAL broken code:\n"""\n${originalCode}\n"""\n\n${codeBlock}\n\nCandidate's written diagnosis:\n"""\n${trimmed}\n"""\n\nProduce the findings (one root-cause finding required; add side-effect findings only for real regressions they introduced). Also decide rootCauseInDiagnosis: did their written diagnosis name the actual root-cause mechanism (not a symptom or a ruled-out hypothesis)? Then give 2-3 sentences of overall feedback in the voice of a senior reviewer. Use the grade_bug_hunt tool.`;

  async function gradeOnce(): Promise<ParsedGrade | null> {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        max_tokens: 1400,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "grade_bug_hunt",
              description: "Report a structured, line-anchored review of the candidate's bug fix.",
              parameters: {
                type: "object",
                properties: {
                  findings: {
                    type: "array",
                    description: "One root-cause finding (required) plus any real side-effects introduced.",
                    items: {
                      type: "object",
                      properties: {
                        file: { type: "string", description: "File name the finding is in." },
                        line: { type: "number", description: "Approx line number in the candidate's edited code." },
                        category: { type: "string", enum: ["root-cause", "side-effect"] },
                        status: { type: "string", enum: ["fixed", "partial", "missed", "introduced"] },
                        title: { type: "string", description: "Short label, e.g. 'Guard still not atomic'." },
                        detail: { type: "string", description: "One or two sentences explaining it." },
                      },
                      required: ["file", "category", "status", "title", "detail"],
                    },
                  },
                  rootCauseInDiagnosis: { type: "boolean", description: "Did their written diagnosis name the real root-cause mechanism?" },
                  feedback: { type: "string", description: "2-3 sentences of senior-reviewer feedback." },
                },
                required: ["findings", "rootCauseInDiagnosis", "feedback"],
              },
            },
          },
        ],
        tool_choice: "required",
      });
      const args = completion.choices[0]?.message?.tool_calls?.[0]?.function.arguments;
      if (args) return JSON.parse(args) as ParsedGrade;
      return null;
    } catch (e) {
      const failed = findFailedGeneration(e);
      if (failed) {
        const m = failed.match(/\{[\s\S]*\}/);
        if (m) { try { return JSON.parse(m[0]) as ParsedGrade; } catch { /* retry */ } }
      }
      console.error("[bug-hunt/grade] groq attempt failed:", e instanceof Error ? e.message : e);
      return null;
    }
  }

  let parsed = await gradeOnce();
  if (!parsed || !Array.isArray(parsed.findings)) parsed = await gradeOnce();
  if (!parsed || !Array.isArray(parsed.findings)) {
    return NextResponse.json({ error: "Grading failed. Please try again." }, { status: 502 });
  }

  // Sanitize findings into the strict shape.
  const findings: BugFinding[] = parsed.findings
    .filter((f) => CATEGORIES.includes(f.category as FindingCategory) && STATUSES.includes(f.status as FindingStatus))
    .map((f) => ({
      file: typeof f.file === "string" && f.file ? f.file : exercise.files[0].name,
      line: typeof f.line === "number" && Number.isFinite(f.line) ? Math.max(1, Math.round(f.line)) : null,
      category: f.category as FindingCategory,
      status: f.status as FindingStatus,
      title: (f.title ?? "").toString().slice(0, 160),
      detail: (f.detail ?? "").toString().slice(0, 800),
    }))
    .slice(0, 12);

  // Score computed HERE, never trusted from the model.
  const rootFinding = findings.find((f) => f.category === "root-cause");
  const fixBase = rootFinding?.status === "fixed" ? 70 : rootFinding?.status === "partial" ? 40 : 0;
  const diagBonus = parsed.rootCauseInDiagnosis ? 30 : 0;
  const introduced = findings.filter((f) => f.status === "introduced").length;
  const penalty = Math.min(30, introduced * 15);
  const score = Math.max(0, Math.min(100, fixBase + diagBonus - penalty));

  const fixReasonable = rootFinding?.status === "fixed" || rootFinding?.status === "partial";
  const rootCaught = Boolean(parsed.rootCauseInDiagnosis) || fixReasonable;
  const feedback = parsed.feedback ?? "";

  await prisma.bugHuntAttempt.create({
    data: {
      userId,
      exerciseSlug: slug,
      diagnosis: trimmed,
      fixedCode,
      score,
      rootCaught,
      fixReasonable,
      findings: findings as unknown as object,
      feedback,
    },
  });

  const result: BugHuntGradeResult = {
    score,
    rootCaught,
    fixReasonable,
    findings,
    feedback,
    rootCause: exercise.rootCause,
    canonicalFix: exercise.canonicalFix,
    ruledOut: exercise.ruledOut,
  };
  return NextResponse.json(result);
}
