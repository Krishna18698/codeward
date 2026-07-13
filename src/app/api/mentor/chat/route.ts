export const runtime = "nodejs";

import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { retrieveContext } from "@/lib/rag";
import Groq from "groq-sdk";
import { chatLimiter } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }


  if (chatLimiter) {
    const { success } = await chatLimiter.limit(userId);
    if (!success) return new Response("Too many requests — slow down a bit.", { status: 429 });
  }

  const { message, context } = await req.json() as { message?: string; context?: string };

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return new Response("Message required", { status: 400 });
  }
  if (message.length > 4000) {
    return new Response("Message too long (max 4000 chars)", { status: 400 });
  }

  await prisma.chatMessage.create({
    data: { userId, role: "USER", content: message, context },
  });

  // ── System prompt ──────────────────────────────────────────────────────
  let systemPrompt = `You are Codeward Mentor, an expert software engineering interview coach.
You help engineers prepare for technical interviews at top product companies (Google, Meta, Amazon, Microsoft, Apple, and similar).
You specialize in DSA (algorithms and data structures), system design, and AI/ML interviews.
Be concise, practical, and encouraging. Use code examples when helpful (Python preferred unless the user specifies otherwise).
When explaining DSA problems, guide with hints before giving full solutions — ask about their approach first.`;

  if (context?.startsWith("problem:")) {
    const problemId = context.split(":")[1];
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      select: { title: true, description: true, pattern: true, difficulty: true },
    });
    if (problem) {
      systemPrompt += `\n\nThe user is working on: "${problem.title}" (${problem.difficulty}, pattern: ${problem.pattern.replace(/_/g, " ").toLowerCase()}).
Problem: ${problem.description}
Guide them with hints. Ask about their approach before revealing the solution.`;
    }
  } else if (context === "system-design") {
    systemPrompt += `\n\nThe user is in the system design section. Help them understand system design concepts, walk through architectures, discuss trade-offs, and prepare for system design interviews.`;
  } else if (context?.startsWith("sheet:") || context === "dsa") {
    systemPrompt += `\n\nThe user is viewing their DSA sheet. You can help them plan which patterns to focus on, explain DSA concepts, or generate a custom study plan based on their goals, target company, or weak areas.`;
  } else if (context?.startsWith("sd:")) {
    const questionId = context.split(":")[1];
    const question = await prisma.systemDesignQuestion.findUnique({
      where: { id: questionId },
      select: { title: true, description: true, difficulty: true },
    });
    if (question) {
      systemPrompt += `\n\nThe user is studying this system design question: "${question.title}" (${question.difficulty}).
Description: ${question.description}
Help them think through the design — ask clarifying questions first, then guide through requirements, estimation, high-level design, deep dives, and trade-offs.`;
    }
  }

  // ── RAG context ────────────────────────────────────────────────────────
  const ragContext = await retrieveContext(message).catch(() => "");
  if (ragContext) {
    systemPrompt += `\n\n--- Relevant knowledge ---\n${ragContext}\n--- End knowledge ---\nUse this to ground your answer when relevant.`;
  }

  // ── Chat history ───────────────────────────────────────────────────────
  const history = await prisma.chatMessage.findMany({
    where: { userId, context },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { role: true, content: true },
  });

  const messages = [
    ...history
      .reverse()
      .slice(0, -1)
      .map((m) => ({
        role: (m.role === "USER" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      })),
    { role: "user" as const, content: message },
  ];

  // ── No API key fallback ────────────────────────────────────────────────
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const fallback = "The AI mentor isn't available right now. Please check back later.";
    await prisma.chatMessage.create({
      data: { userId, role: "ASSISTANT", content: fallback, context },
    });
    return new Response(fallback);
  }

  // ── Stream from Groq ───────────────────────────────────────────────────
  const groq = new Groq({ apiKey });
  const encoder = new TextEncoder();
  let assistantContent = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const groqStream = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1500,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          stream: true,
        });

        for await (const chunk of groqStream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            assistantContent += text;
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch (e) {
        console.error("[mentor/chat] stream error:", e);
        const errMsg = "Something went wrong. Please try again.";
        controller.enqueue(encoder.encode(errMsg));
        assistantContent = errMsg;
      } finally {
        if (assistantContent) {
          await prisma.chatMessage.create({
            data: { userId, role: "ASSISTANT", content: assistantContent, context },
          });
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
