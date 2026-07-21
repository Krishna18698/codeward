export const runtime = "nodejs";
// Groq calls (grading retries / streamed replies) can exceed the default 10s
// function limit; raise the ceiling so slow responses finish instead of 504ing.
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";
import type { ProblemPattern, Difficulty } from "@prisma/client";
import { sheetLimiter } from "@/lib/ratelimit";
import { GFG_URL_MAP } from "@/lib/gfg-url-map";

function gfgFor(leetcodeUrl: string | undefined): string | null {
  if (!leetcodeUrl) return null;
  if (leetcodeUrl.includes("geeksforgeeks.org")) return leetcodeUrl;
  // Normalize: ensure trailing slash for map lookup
  const normalized = leetcodeUrl.endsWith("/") ? leetcodeUrl : `${leetcodeUrl}/`;
  return GFG_URL_MAP[normalized] ?? GFG_URL_MAP[leetcodeUrl] ?? null;
}

const VALID_PATTERNS: ProblemPattern[] = [
  "ARRAYS","STRINGS","LINKED_LIST","TREES","GRAPHS","DYNAMIC_PROGRAMMING",
  "BACKTRACKING","BINARY_SEARCH","SLIDING_WINDOW","TWO_POINTERS",
  "STACK_QUEUE","HEAP","TRIE","MATH","BIT_MANIPULATION","OTHER",
];
const VALID_DIFFICULTIES: Difficulty[] = ["EASY","MEDIUM","HARD"];

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


  if (sheetLimiter) {
    const { success } = await sheetLimiter.limit(userId);
    if (!success) return NextResponse.json({ error: "Sheet generation limit reached. Try again in an hour." }, { status: 429 });
  }

  const { message } = await req.json() as { message?: string };
  if (!message || typeof message !== "string" || message.length > 2000) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 503 });
  }

  const groq = new Groq({ apiKey });

  const systemPrompt = `You are an expert DSA interview coach.
When asked to create a study sheet, generate a comprehensive list of 15-25 problems covering all the key patterns relevant to the request.
For a company-specific sheet (e.g. Google, Meta, Amazon), cover the patterns they are known to focus on heavily — aim for 20+ problems.
Always use the create_sheet tool to output the sheet. Do not just describe it — call the tool.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "create_sheet",
          description: "Create a personalized DSA study sheet for the user",
          parameters: {
            type: "object",
            properties: {
              sheetName: { type: "string", description: "Name for this study sheet, e.g. 'Meta Trees & DP Focus'" },
              rationale: { type: "string", description: "1-2 sentence explanation of why these problems were chosen" },
              problems: {
                type: "array",
                description: "List of problems to include in the sheet",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] },
                    pattern: { type: "string", enum: VALID_PATTERNS },
                    mustDo: { type: "boolean", description: "True for essential problems, false for variations" },
                    leetcodeUrl: { type: "string", description: "Full LeetCode URL if known, else empty string" },
                    description: { type: "string", description: "One sentence problem description" },
                  },
                  required: ["title", "difficulty", "pattern", "mustDo", "description"],
                },
              },
            },
            required: ["sheetName", "rationale", "problems"],
          },
        },
      },
    ],
    tool_choice: "required",
    max_tokens: 4000,
  });

  const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== "create_sheet") {
    return NextResponse.json({ error: "Model did not call create_sheet" }, { status: 500 });
  }

  const args = JSON.parse(toolCall.function.arguments) as {
    sheetName: string;
    rationale: string;
    problems: Array<{
      title: string;
      difficulty: string;
      pattern: string;
      mustDo: boolean;
      leetcodeUrl?: string;
      description: string;
    }>;
  };

  // Persist to DB
  const sheet = await prisma.sheet.create({
    data: { name: args.sheetName, source: "CUSTOM", isPreset: false, userId },
  });

  const created = await Promise.all(
    args.problems.map((p, i) =>
      prisma.problem.create({
        data: {
          title: p.title,
          description: p.description,
          difficulty: VALID_DIFFICULTIES.includes(p.difficulty as Difficulty)
            ? (p.difficulty as Difficulty)
            : "MEDIUM",
          pattern: VALID_PATTERNS.includes(p.pattern as ProblemPattern)
            ? (p.pattern as ProblemPattern)
            : "OTHER",
          mustDo: p.mustDo,
          order: i + 1,
          leetcodeUrl: p.leetcodeUrl || null,
          gfgUrl: gfgFor(p.leetcodeUrl),
          sheetId: sheet.id,
        },
      })
    )
  );

  return NextResponse.json({
    sheetId: sheet.id,
    sheetName: args.sheetName,
    rationale: args.rationale,
    problemCount: created.length,
  });
}
