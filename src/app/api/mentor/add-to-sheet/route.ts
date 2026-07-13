export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";
import type { ProblemPattern, Difficulty } from "@prisma/client";
import { GFG_URL_MAP } from "@/lib/gfg-url-map";
import { chatLimiter } from "@/lib/ratelimit";

const VALID_PATTERNS: ProblemPattern[] = [
  "ARRAYS","STRINGS","LINKED_LIST","TREES","GRAPHS","DYNAMIC_PROGRAMMING",
  "BACKTRACKING","BINARY_SEARCH","SLIDING_WINDOW","TWO_POINTERS",
  "STACK_QUEUE","HEAP","TRIE","MATH","BIT_MANIPULATION","OTHER",
];
const VALID_DIFFICULTIES: Difficulty[] = ["EASY","MEDIUM","HARD"];

function gfgFor(leetcodeUrl: string | undefined): string | null {
  if (!leetcodeUrl) return null;
  if (leetcodeUrl.includes("geeksforgeeks.org")) return leetcodeUrl;
  const normalized = leetcodeUrl.endsWith("/") ? leetcodeUrl : `${leetcodeUrl}/`;
  return GFG_URL_MAP[normalized] ?? GFG_URL_MAP[leetcodeUrl] ?? null;
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


  // Rate limit — this endpoint makes a paid Groq call
  if (chatLimiter) {
    const { success } = await chatLimiter.limit(userId);
    if (!success) return NextResponse.json({ error: "Too many requests — slow down a bit." }, { status: 429 });
  }

  const { message, sheetId } = await req.json() as { message?: string; sheetId?: string };
  if (!message || !sheetId) return NextResponse.json({ error: "Missing message or sheetId" }, { status: 400 });

  // Verify the sheet belongs to this user
  const sheet = await prisma.sheet.findFirst({
    where: { id: sheetId, userId: userId },
    include: { problems: { select: { title: true }, orderBy: { order: "asc" } } },
  });
  if (!sheet) return NextResponse.json({ error: "Sheet not found" }, { status: 404 });

  const existingTitles = sheet.problems.map((p) => p.title);
  const currentCount = existingTitles.length;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 503 });

  const groq = new Groq({ apiKey });

  const systemPrompt = `You are an expert DSA interview coach helping expand an existing study sheet.
The sheet "${sheet.name}" already has these ${currentCount} problems: ${existingTitles.join(", ")}.
Generate 10-15 NEW problems that are NOT already in that list. Cover different patterns and difficulty levels.
Always use the add_problems tool. Do not repeat any existing problems.`;

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
          name: "add_problems",
          description: "Add more problems to the existing study sheet",
          parameters: {
            type: "object",
            properties: {
              problems: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] },
                    pattern: { type: "string", enum: VALID_PATTERNS },
                    mustDo: { type: "boolean" },
                    leetcodeUrl: { type: "string", description: "Full LeetCode URL if known, else empty string" },
                    description: { type: "string", description: "One sentence problem description" },
                  },
                  required: ["title", "difficulty", "pattern", "mustDo", "description"],
                },
              },
            },
            required: ["problems"],
          },
        },
      },
    ],
    tool_choice: "required",
    max_tokens: 4000,
  });

  const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== "add_problems") {
    return NextResponse.json({ error: "Model did not call add_problems" }, { status: 500 });
  }

  const args = JSON.parse(toolCall.function.arguments) as {
    problems: Array<{
      title: string; difficulty: string; pattern: string;
      mustDo: boolean; leetcodeUrl?: string; description: string;
    }>;
  };

  const added = await Promise.all(
    args.problems.map((p, i) =>
      prisma.problem.create({
        data: {
          title: p.title,
          description: p.description,
          difficulty: VALID_DIFFICULTIES.includes(p.difficulty as Difficulty) ? (p.difficulty as Difficulty) : "MEDIUM",
          pattern: VALID_PATTERNS.includes(p.pattern as ProblemPattern) ? (p.pattern as ProblemPattern) : "OTHER",
          mustDo: p.mustDo,
          order: currentCount + i + 1,
          leetcodeUrl: p.leetcodeUrl || null,
          gfgUrl: gfgFor(p.leetcodeUrl),
          sheetId,
        },
      })
    )
  );

  return NextResponse.json({
    sheetId,
    sheetName: sheet.name,
    addedCount: added.length,
    totalCount: currentCount + added.length,
  });
}
