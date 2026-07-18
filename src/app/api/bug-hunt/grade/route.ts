export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";
import { chatLimiter } from "@/lib/ratelimit";
import { getBugHuntWithSolution } from "@/content/bug-hunts";

export interface BugHuntGradeResult {
  score: number;
  rootCaught: boolean;
  fixReasonable: boolean;
  feedback: string;
  // revealed after grading
  rootCause: string;
  canonicalFix: string;
  ruledOut: string[];
}

type ParsedGrade = { rootCaught: boolean; fixReasonable: boolean; feedback: string };

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

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (chatLimiter) {
    const { success } = await chatLimiter.limit(userId);
    if (!success) return NextResponse.json({ error: "Too many requests — slow down a bit." }, { status: 429 });
  }

  const { slug, diagnosis } = (await req.json()) as { slug?: string; diagnosis?: string };
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

  const exercise = getBugHuntWithSolution(slug);
  if (!exercise) return NextResponse.json({ error: "Unknown exercise" }, { status: 404 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Grading not configured" }, { status: 503 });

  const groq = new Groq({ apiKey });

  const systemPrompt = `You are a senior engineer grading a debugging exercise. The candidate was shown broken code plus failing tests/logs and asked to diagnose the ROOT CAUSE and propose a fix. Grade strictly by meaning against the known answer. Reward identifying the actual mechanism; do not reward naming a symptom, a tempting-but-wrong hypothesis, or a vague gesture.`;

  const userPrompt = `Known root cause:\n${exercise.rootCause}\n\nKnown correct fix:\n${exercise.canonicalFix}\n\nTempting hypotheses that are WRONG:\n${exercise.ruledOut.map((r) => `- ${r}`).join("\n")}\n\nCandidate's diagnosis:\n"""\n${trimmed}\n"""\n\nDecide: rootCaught (did they identify the actual root-cause mechanism, not just a symptom or a ruled-out hypothesis?), fixReasonable (did they propose a fix in the right direction?), and 2-3 sentences of feedback. Use the grade_bug_hunt tool.`;

  async function gradeOnce(): Promise<ParsedGrade | null> {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        max_tokens: 900,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "grade_bug_hunt",
              description: "Grade the candidate's root-cause diagnosis.",
              parameters: {
                type: "object",
                properties: {
                  rootCaught: { type: "boolean", description: "Did they identify the actual root-cause mechanism?" },
                  fixReasonable: { type: "boolean", description: "Did they propose a fix in the right direction?" },
                  feedback: { type: "string", description: "2-3 sentences of feedback." },
                },
                required: ["rootCaught", "fixReasonable", "feedback"],
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
  if (!parsed || typeof parsed.rootCaught !== "boolean") parsed = await gradeOnce();
  if (!parsed || typeof parsed.rootCaught !== "boolean") {
    return NextResponse.json({ error: "Grading failed. Please try again." }, { status: 502 });
  }

  // Score computed HERE: root cause is the exercise (70), fix direction the rest (30).
  const score = (parsed.rootCaught ? 70 : 0) + (parsed.fixReasonable ? 30 : 0);
  const feedback = parsed.feedback ?? "";

  await prisma.bugHuntAttempt.create({
    data: {
      userId,
      exerciseSlug: slug,
      diagnosis: trimmed,
      score,
      rootCaught: parsed.rootCaught,
      fixReasonable: parsed.fixReasonable,
      feedback,
    },
  });

  const result: BugHuntGradeResult = {
    score,
    rootCaught: parsed.rootCaught,
    fixReasonable: parsed.fixReasonable,
    feedback,
    rootCause: exercise.rootCause,
    canonicalFix: exercise.canonicalFix,
    ruledOut: exercise.ruledOut,
  };
  return NextResponse.json(result);
}
