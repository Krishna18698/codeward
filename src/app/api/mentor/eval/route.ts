export const runtime = "nodejs";
// Groq calls (grading retries / streamed replies) can exceed the default 10s
// function limit; raise the ceiling so slow responses finish instead of 504ing.
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";
import { chatLimiter } from "@/lib/ratelimit";

export type EvalType = "code" | "system-design";

export interface RubricItem {
  category: string;
  score: number;
  max: 10;
  feedback: string;
}

export interface EvalResult {
  score: number;
  grade: "S" | "A" | "B" | "C" | "D";
  rubric: RubricItem[];
  summary: string;
  improvements: string[];
}

const CODE_RUBRIC = [
  { name: "Correctness",       description: "Does the solution correctly solve the problem for all inputs and cases?" },
  { name: "Time Complexity",   description: "Is the approach optimal or near-optimal for this problem? Consider the best known algorithm." },
  { name: "Space Complexity",  description: "Is memory usage reasonable and appropriate?" },
  { name: "Code Quality",      description: "Readability, naming conventions, structure, and clarity." },
  { name: "Edge Cases",        description: "Does it handle empty input, single element, duplicates, boundary values, and negative numbers?" },
];

const SD_RUBRIC = [
  { name: "Requirements",         description: "Functional and non-functional requirements clearly identified? Scale, latency, and consistency constraints noted?" },
  { name: "Capacity Estimation",  description: "Back-of-envelope calculations present for QPS, storage, and bandwidth?" },
  { name: "Architecture",         description: "Clear high-level design with major components, data flow, and API design?" },
  { name: "Data Model",           description: "Database choices justified, schema thoughtful, appropriate storage tiers chosen?" },
  { name: "Scalability",          description: "Caching, sharding, replication, load balancing — bottlenecks identified and addressed with trade-offs discussed?" },
];

function scoreToGrade(score: number): EvalResult["grade"] {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


  if (chatLimiter) {
    const { success } = await chatLimiter.limit(userId);
    if (!success) return NextResponse.json({ error: "Too many requests — slow down a bit." }, { status: 429 });
  }

  const body = await req.json() as {
    type?: string;
    content?: string;
    problemId?: string;
    sdQuestionId?: string;
    language?: string;
  };

  const { type, content, problemId, sdQuestionId, language } = body;

  if (!type || !["code", "system-design"].includes(type)) {
    return NextResponse.json({ error: "type must be 'code' or 'system-design'" }, { status: 400 });
  }
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }
  if (content.length > 8000) {
    return NextResponse.json({ error: "Content too long (max 8000 chars)" }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 503 });

  // Build context block from the problem/question
  let contextBlock = "";
  if (type === "code" && problemId) {
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      select: { title: true, description: true, difficulty: true, pattern: true },
    });
    if (problem) {
      contextBlock = `Problem: "${problem.title}" (${problem.difficulty}, ${problem.pattern.replace(/_/g, " ").toLowerCase()})
Description: ${problem.description.slice(0, 600)}`;
    }
  } else if (type === "system-design" && sdQuestionId) {
    const question = await prisma.systemDesignQuestion.findUnique({
      where: { id: sdQuestionId },
      select: { title: true, description: true, difficulty: true },
    });
    if (question) {
      contextBlock = `Question: "${question.title}" (${question.difficulty})
Description: ${question.description}`;
    }
  }

  const rubricDef = type === "code" ? CODE_RUBRIC : SD_RUBRIC;
  const rubricDesc = rubricDef.map((r, i) => `${i + 1}. ${r.name}: ${r.description}`).join("\n");

  const systemPrompt = type === "code"
    ? `You are a senior software engineer at a top product company evaluating a coding interview solution.
Be honest and fair. A 10/10 in any category is rare — only for genuinely exemplary work.
Grade as if you were deciding whether to pass the candidate. Be specific in feedback.`
    : `You are a senior staff engineer at a top product company evaluating a system design interview answer.
Be honest and fair. A 10/10 in any category is rare — only for genuinely comprehensive, well-reasoned work.
Grade as if you were deciding whether to pass the candidate. Be specific in feedback.`;

  const userPrompt = type === "code"
    ? `${contextBlock ? contextBlock + "\n\n" : ""}Language: ${language ?? "unknown"}

Candidate's solution:
\`\`\`
${content}
\`\`\`

Evaluate this solution using the evaluate_solution tool.`
    : `${contextBlock ? contextBlock + "\n\n" : ""}Candidate's design answer:
${content}

Evaluate this answer using the evaluate_solution tool.`;

  const groq = new Groq({ apiKey });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    max_tokens: 1500,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "evaluate_solution",
          description: "Return a structured rubric-based evaluation of the candidate's solution",
          parameters: {
            type: "object",
            properties: {
              rubric: {
                type: "array",
                description: `Exactly ${rubricDef.length} items in this exact order:\n${rubricDesc}`,
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    score:    { type: "number", description: "Integer 0–10" },
                    feedback: { type: "string", description: "2-3 sentences of specific, actionable feedback" },
                  },
                  required: ["category", "score", "feedback"],
                },
              },
              summary: {
                type: "string",
                description: "2-3 sentence overall verdict. Mention the strongest and weakest area.",
              },
              improvements: {
                type: "array",
                items: { type: "string" },
                description: "3–5 specific, actionable improvements the candidate should work on",
              },
            },
            required: ["rubric", "summary", "improvements"],
          },
        },
      },
    ],
    tool_choice: "required",
  });

  const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== "evaluate_solution") {
    return NextResponse.json({ error: "Model did not return an evaluation" }, { status: 500 });
  }

  const args = JSON.parse(toolCall.function.arguments) as {
    rubric: Array<{ category: string; score: number; feedback: string }>;
    summary: string;
    improvements: string[];
  };

  const rubric: RubricItem[] = args.rubric.map((r) => ({
    category: r.category,
    score: Math.min(10, Math.max(0, Math.round(r.score))),
    max: 10,
    feedback: r.feedback,
  }));

  const totalScore = rubric.reduce((sum, r) => sum + r.score, 0);
  const score = Math.round((totalScore / (rubric.length * 10)) * 100);

  const result: EvalResult = {
    score,
    grade: scoreToGrade(score),
    rubric,
    summary: args.summary,
    improvements: args.improvements.slice(0, 5),
  };

  return NextResponse.json(result);
}
