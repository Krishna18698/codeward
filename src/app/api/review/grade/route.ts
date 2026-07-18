export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";
import { chatLimiter } from "@/lib/ratelimit";
import { getExerciseWithBugs } from "@/content/code-reviews";

export interface GradedBug {
  id: string;
  severity: number;
  category: string;
  description: string;
  evidence?: string;
}

export interface GradeResult {
  score: number;
  caught: GradedBug[];
  missed: GradedBug[];
  feedback: string;
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (chatLimiter) {
    const { success } = await chatLimiter.limit(userId);
    if (!success) return NextResponse.json({ error: "Too many requests — slow down a bit." }, { status: 429 });
  }

  const { slug, comments } = (await req.json()) as { slug?: string; comments?: string };
  if (!slug || typeof comments !== "string") {
    return NextResponse.json({ error: "Missing slug or comments" }, { status: 400 });
  }
  const trimmed = comments.trim();
  if (trimmed.length < 30) {
    return NextResponse.json({ error: "Write a bit more — list the issues you found and where." }, { status: 400 });
  }
  if (trimmed.length > 6000) {
    return NextResponse.json({ error: "Review is too long." }, { status: 400 });
  }

  // Ground truth — loaded server-side only, never sent to the client pre-grade.
  const exercise = getExerciseWithBugs(slug);
  if (!exercise) return NextResponse.json({ error: "Unknown exercise" }, { status: 404 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Grading not configured" }, { status: 503 });

  const bugList = exercise.bugs
    .map((b) => `- id "${b.id}" (severity ${b.severity}, ${b.category}): ${b.description}`)
    .join("\n");

  const filesBlock = exercise.files
    .map((f) => `### ${f.name}\n\`\`\`ts\n${f.code}\n\`\`\``)
    .join("\n\n");

  const systemPrompt = `You are a senior engineer grading a code review. A candidate reviewed a PR that contains a known set of planted bugs. Your job is ONLY to decide, for each planted bug, whether the candidate's review identified it — by meaning, not exact wording. A vague gesture in the right direction does not count; they must show they understood the actual issue. Do not invent bugs that aren't in the list. Do not reward generic praise.`;

  const userPrompt = `PR under review:\n${filesBlock}\n\nPlanted bugs (ground truth):\n${bugList}\n\nCandidate's review:\n"""\n${trimmed}\n"""\n\nFor every planted bug id, decide caught=true/false and cite the phrase from the candidate's review that identifies it (evidence). Then give 2-3 sentences of overall feedback. Use the grade_review tool.`;

  const groq = new Groq({ apiKey });

  let completion;
  try {
    completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 1500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "grade_review",
            description: "Report which planted bugs the candidate's review identified.",
            parameters: {
              type: "object",
              properties: {
                results: {
                  type: "array",
                  description: `One entry per planted bug id (${exercise.bugs.map((b) => b.id).join(", ")}).`,
                  items: {
                    type: "object",
                    properties: {
                      bugId: { type: "string" },
                      caught: { type: "boolean" },
                      evidence: { type: "string", description: "Phrase from the review that identifies this bug, or empty if missed." },
                    },
                    required: ["bugId", "caught"],
                  },
                },
                feedback: { type: "string", description: "2-3 sentences of overall feedback for the candidate." },
              },
              required: ["results", "feedback"],
            },
          },
        },
      ],
      tool_choice: "required",
    });
  } catch (e) {
    console.error("[review/grade] groq error:", e);
    return NextResponse.json({ error: "Grading failed. Please try again." }, { status: 502 });
  }

  const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== "grade_review") {
    return NextResponse.json({ error: "Grading failed. Please try again." }, { status: 502 });
  }

  let parsed: { results: { bugId: string; caught: boolean; evidence?: string }[]; feedback: string };
  try {
    parsed = JSON.parse(toolCall.function.arguments);
  } catch {
    return NextResponse.json({ error: "Grading failed. Please try again." }, { status: 502 });
  }

  // Score is computed HERE from severity weights — never trust the model's math.
  const caughtIds = new Set(
    parsed.results.filter((r) => r.caught).map((r) => r.bugId),
  );
  const evidenceById = new Map(parsed.results.map((r) => [r.bugId, r.evidence]));

  const caught: GradedBug[] = [];
  const missed: GradedBug[] = [];
  let caughtWeight = 0;
  const totalWeight = exercise.bugs.reduce((s, b) => s + b.severity, 0);

  for (const b of exercise.bugs) {
    const entry: GradedBug = {
      id: b.id,
      severity: b.severity,
      category: b.category,
      description: b.description,
    };
    if (caughtIds.has(b.id)) {
      entry.evidence = evidenceById.get(b.id) || undefined;
      caught.push(entry);
      caughtWeight += b.severity;
    } else {
      missed.push(entry);
    }
  }

  const score = totalWeight > 0 ? Math.round((caughtWeight / totalWeight) * 100) : 0;
  const feedback = parsed.feedback ?? "";

  await prisma.reviewAttempt.create({
    data: {
      userId,
      exerciseSlug: slug,
      comments: trimmed,
      score,
      caught: caught as unknown as object,
      missed: missed as unknown as object,
      feedback,
    },
  });

  const result: GradeResult = { score, caught, missed, feedback };
  return NextResponse.json(result);
}
