export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";
import { chatLimiter } from "@/lib/ratelimit";
import { getBuildItStageWithSolution } from "@/content/build-it";
import type { BuildItLanguage } from "@/content/build-it";

export interface GradedCriterion {
  id: string;
  description: string;
  weight: number;
  met: boolean;
  evidence?: string;
}

export interface BuildItGradeResult {
  score: number;
  stage: number;
  criteria: GradedCriterion[];
  invariantHolds: boolean | null;
  feedback: string;
  canonicalApproach: string;
  commonPitfalls: string[];
  nextStageUnlocked: boolean;
}

const LANGUAGES: BuildItLanguage[] = ["csharp", "python", "kotlin"];

/** Groq's tool_use_failed error carries the raw model output in `failed_generation`
 *  at a nesting depth that varies by SDK version — search for it. Same helper as
 *  review/grade and bug-hunt/grade (a dedupe candidate, not done on this pass). */
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

  const body = (await req.json()) as {
    slug?: string;
    stage?: number;
    language?: string;
    approach?: string;
    explanation?: string;
  };
  const { slug, stage, language, approach, explanation } = body;

  if (!slug || typeof stage !== "number" || !Number.isInteger(stage) || stage < 1 || stage > 4) {
    return NextResponse.json({ error: "Missing or invalid slug/stage" }, { status: 400 });
  }
  if (!language || !LANGUAGES.includes(language as BuildItLanguage)) {
    return NextResponse.json({ error: "Missing or invalid language" }, { status: 400 });
  }
  if (typeof approach !== "string" || typeof explanation !== "string") {
    return NextResponse.json({ error: "Missing approach or explanation" }, { status: 400 });
  }

  const trimmedApproach = approach.trim();
  const trimmedExplanation = explanation.trim();
  if (trimmedApproach.length < 20) {
    return NextResponse.json({ error: "Write a bit more of your design before submitting." }, { status: 400 });
  }
  if (trimmedApproach.length > 4000) {
    return NextResponse.json({ error: "Approach is too long." }, { status: 400 });
  }
  if (trimmedExplanation.length < 40) {
    return NextResponse.json({ error: "Explain your reasoning in a bit more detail." }, { status: 400 });
  }
  if (trimmedExplanation.length > 6000) {
    return NextResponse.json({ error: "Explanation is too long." }, { status: 400 });
  }

  // Ground truth — loaded server-side only, never sent to the client pre-grade.
  const gradedStage = getBuildItStageWithSolution(slug, stage);
  if (!gradedStage) return NextResponse.json({ error: "Unknown problem or stage" }, { status: 404 });

  // Server-side gating: never trust the client's disabled buttons. Stage N
  // requires an existing attempt on stage N-1, regardless of that attempt's score.
  if (stage > 1) {
    const prior = await prisma.buildItAttempt.findFirst({
      where: { userId, problemSlug: slug, stage: stage - 1 },
      select: { id: true },
    });
    if (!prior) {
      return NextResponse.json({ error: `Complete stage ${stage - 1} first.` }, { status: 400 });
    }
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Grading not configured" }, { status: 503 });

  const rubricList = gradedStage.rubric
    .map((c) => `- id "${c.id}" (weight ${c.weight}): ${c.description}`)
    .join("\n");

  const invariantBlock = gradedStage.invariant
    ? `\n\nThis stage's correctness invariant (the make-or-break requirement):\n"${gradedStage.invariant}"\n\nDecide invariantHolds: did the candidate's explanation state this invariant in their own words and argue, with a concrete concurrent/failure scenario, why their design can't violate it? A vague "it's thread-safe" does not count — they must show the mechanism.`
    : "\n\nThis stage has no correctness invariant to prove — set invariantHolds to true.";

  const systemPrompt = `You are a senior engineer grading a low-level-design (LLD) submission. The candidate was given a staged design problem and asked to submit a written approach (interfaces/pseudocode — NOT compiled or executed code, so ignore syntax correctness in whatever language they used) plus a prose explanation of their reasoning. Grade the MECHANISM they describe (locking strategy, atomicity, idempotency, ownership/leasing, outbox pattern, permit release, etc.) against the rubric criteria — by meaning, not exact wording. Do not reward vague gestures or generic engineering platitudes; the candidate must demonstrate they understood the specific failure mode each criterion addresses.`;

  const userPrompt = `Stage ${stage} — ${gradedStage.title}\nConstraint added this stage: ${gradedStage.constraintAdded}\n\nRubric criteria (ground truth):\n${rubricList}${invariantBlock}\n\nCandidate's approach (${language}):\n"""\n${trimmedApproach}\n"""\n\nCandidate's explanation:\n"""\n${trimmedExplanation}\n"""\n\nFor every rubric criterion id, decide met=true/false and cite the phrase that supports it (evidence). Decide invariantHolds per the instructions above. Then give 2-3 sentences of overall feedback. Use the grade_build_it tool.`;

  const groq = new Groq({ apiKey });

  type ParsedGrade = {
    criteria: { id: string; met: boolean; evidence?: string }[];
    invariantHolds: boolean;
    feedback: string;
  };

  async function gradeOnce(): Promise<ParsedGrade | null> {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        max_tokens: 1200,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "grade_build_it",
              description: "Report which rubric criteria the candidate's submission satisfied.",
              parameters: {
                type: "object",
                properties: {
                  criteria: {
                    type: "array",
                    description: `One entry per rubric criterion id (${gradedStage!.rubric.map((c) => c.id).join(", ")}).`,
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        met: { type: "boolean" },
                        evidence: { type: "string", description: "Phrase from the submission supporting this decision, or empty if not met." },
                      },
                      required: ["id", "met"],
                    },
                  },
                  invariantHolds: { type: "boolean", description: "Per the invariant instructions above." },
                  feedback: { type: "string", description: "2-3 sentences of overall feedback for the candidate." },
                },
                required: ["criteria", "invariantHolds", "feedback"],
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
        if (m) {
          try { return JSON.parse(m[0]) as ParsedGrade; } catch { /* fall through to retry */ }
        }
      }
      console.error("[build-it/grade] groq attempt failed:", e instanceof Error ? e.message : e);
      return null;
    }
  }

  let parsed = await gradeOnce();
  if (!parsed || !Array.isArray(parsed.criteria)) parsed = await gradeOnce(); // one retry
  if (!parsed || !Array.isArray(parsed.criteria)) {
    return NextResponse.json({ error: "Grading failed. Please try again." }, { status: 502 });
  }

  // Score computed HERE from rubric weights — never trust the model's math.
  const metById = new Map(parsed.criteria.map((c) => [c.id, c]));
  const graded: GradedCriterion[] = [];
  let metWeight = 0;
  const totalWeight = gradedStage.rubric.reduce((s, c) => s + c.weight, 0);

  for (const c of gradedStage.rubric) {
    const result = metById.get(c.id);
    const met = result?.met ?? false;
    graded.push({ id: c.id, description: c.description, weight: c.weight, met, evidence: result?.evidence || undefined });
    if (met) metWeight += c.weight;
  }

  const score = totalWeight > 0 ? Math.round((metWeight / totalWeight) * 100) : 0;
  const invariantHolds = gradedStage.invariant ? Boolean(parsed.invariantHolds) : null;
  const feedback = parsed.feedback ?? "";

  await prisma.buildItAttempt.create({
    data: {
      userId,
      problemSlug: slug,
      stage,
      language,
      approach: trimmedApproach,
      explanation: trimmedExplanation,
      score,
      criteria: graded as unknown as object,
      invariantHolds,
      feedback,
    },
  });

  const result: BuildItGradeResult = {
    score,
    stage,
    criteria: graded,
    invariantHolds,
    feedback,
    canonicalApproach: gradedStage.canonicalApproach,
    commonPitfalls: gradedStage.commonPitfalls,
    nextStageUnlocked: stage < 4,
  };
  return NextResponse.json(result);
}
