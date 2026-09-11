export const runtime = "nodejs";
// Groq calls (grading retries / streamed replies) can exceed the default 10s
// function limit; raise the ceiling so slow responses finish instead of 504ing.
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";
import { GROQ_MODEL } from "@/lib/groq";
import type { ProblemPattern, Difficulty } from "@prisma/client";
import { sheetLimiter } from "@/lib/ratelimit";
import { GFG_URL_MAP } from "@/lib/gfg-url-map";
import { PATTERN_ORDER } from "@/content/patterns";

function gfgFor(leetcodeUrl: string | undefined): string | null {
  if (!leetcodeUrl) return null;
  if (leetcodeUrl.includes("geeksforgeeks.org")) return leetcodeUrl;
  // Normalize: ensure trailing slash for map lookup
  const normalized = leetcodeUrl.endsWith("/") ? leetcodeUrl : `${leetcodeUrl}/`;
  return GFG_URL_MAP[normalized] ?? GFG_URL_MAP[leetcodeUrl] ?? null;
}

const VALID_PATTERNS = PATTERN_ORDER as ProblemPattern[];
const VALID_DIFFICULTIES: Difficulty[] = ["EASY","MEDIUM","HARD"];

/** LeetCode slug from a problem URL — "…/problems/rotate-array/" → "rotate-array". */
function leetcodeSlug(url: string | undefined | null): string | null {
  if (!url) return null;
  const m = url.match(/leetcode\.com\/problems\/([^/?#]+)/i);
  return m ? m[1].toLowerCase() : null;
}

/** Fallback key when the model gives no usable URL. Lowercased, punctuation
 *  dropped, so "3Sum" and "3-sum" collapse onto the same catalog row. */
function titleKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

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
    model: GROQ_MODEL,
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

  // ── Reconcile against the curated catalog ──────────────────────────────
  // The model supplies its own difficulty and pattern, and it gets them wrong:
  // it labelled Rotate Array EASY where the catalog (and LeetCode) say MEDIUM.
  // For any problem we already carry on a preset sheet, the catalog wins — so a
  // generated sheet grades and groups identically to every other sheet. One
  // query for the whole batch, since this already sits behind a slow AI call.
  const catalog = await prisma.problem.findMany({
    where: { sheet: { isPreset: true } },
    select: {
      title: true, description: true, difficulty: true,
      pattern: true, leetcodeUrl: true, gfgUrl: true,
    },
  });

  type CatalogRow = (typeof catalog)[number];
  const bySlug = new Map<string, CatalogRow>();
  const byTitle = new Map<string, CatalogRow>();
  for (const row of catalog) {
    const slug = leetcodeSlug(row.leetcodeUrl);
    if (slug && !bySlug.has(slug)) bySlug.set(slug, row);
    const key = titleKey(row.title);
    if (!byTitle.has(key)) byTitle.set(key, row);
  }

  const resolved = args.problems.map((p) => {
    const slug = leetcodeSlug(p.leetcodeUrl);
    const match = (slug && bySlug.get(slug)) || byTitle.get(titleKey(p.title)) || null;

    if (match) {
      return {
        // Catalog is authoritative for everything factual about the problem.
        title: match.title,
        description: match.description,
        difficulty: match.difficulty,
        pattern: match.pattern,
        leetcodeUrl: match.leetcodeUrl,
        gfgUrl: match.gfgUrl,
        // …but which problems are must-do is this sheet's editorial call.
        mustDo: p.mustDo,
      };
    }

    // Not in the catalog — keep the model's values, validated as before.
    return {
      title: p.title,
      description: p.description,
      difficulty: VALID_DIFFICULTIES.includes(p.difficulty as Difficulty)
        ? (p.difficulty as Difficulty)
        : "MEDIUM",
      pattern: VALID_PATTERNS.includes(p.pattern as ProblemPattern)
        ? (p.pattern as ProblemPattern)
        : "HASH_MAP",
      leetcodeUrl: p.leetcodeUrl || null,
      gfgUrl: gfgFor(p.leetcodeUrl),
      mustDo: p.mustDo,
    };
  });

  // Persist to DB
  const sheet = await prisma.sheet.create({
    data: { name: args.sheetName, source: "CUSTOM", isPreset: false, userId },
  });

  const created = await Promise.all(
    resolved.map((p, i) =>
      prisma.problem.create({
        data: { ...p, order: i + 1, sheetId: sheet.id },
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
