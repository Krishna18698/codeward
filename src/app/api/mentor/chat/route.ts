export const runtime = "nodejs";
// Groq calls (grading retries / streamed replies) can exceed the default 10s
// function limit; raise the ceiling so slow responses finish instead of 504ing.
export const maxDuration = 60;

import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { retrieveContext } from "@/lib/rag";
import Groq from "groq-sdk";
import { GROQ_MODEL } from "@/lib/groq";
import { chatLimiter } from "@/lib/ratelimit";
import { CONTROL_DELIMITER, type MentorRoute } from "@/lib/mentorStream";

/** Routing tools. These carry no payload — they only say which path the turn
 *  takes. The descriptions do the real work, so they spell out the two cases
 *  the old substring matcher got wrong: a declined sheet, and a question that
 *  merely mentions one. */
const SHEET_ROUTING_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "create_study_sheet",
      description:
        "Call this ONLY when the user is affirmatively asking you to build a new study sheet or " +
        "practice plan for them — e.g. 'create a sheet for Meta', 'make me a custom sheet named X', " +
        "'put together a two-week plan'. Do NOT call it if the user is declining or forbidding one " +
        "('do not create a sheet', 'no sheet needed', 'without making a sheet'), if they are merely " +
        "asking a question that mentions sheets ('what's on my sheet?', 'how do your sheets work?'), " +
        "or if they are quoting an example. When in doubt, answer in prose instead of calling this.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_problems_to_sheet",
      description:
        "Call this ONLY when the user is affirmatively asking to add more problems to the sheet " +
        "already created earlier in this conversation — e.g. 'add five more', 'expand that sheet'. " +
        "Do not call it when no sheet has been created yet, or when the user is declining.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }


  if (chatLimiter) {
    const { success } = await chatLimiter.limit(userId);
    if (!success) return new Response("Too many requests — slow down a bit.", { status: 429 });
  }

  const { message, context, conversationId } = await req.json() as {
    message?: string;
    context?: string;
    conversationId?: string;
  };

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return new Response("Message required", { status: 400 });
  }
  if (message.length > 4000) {
    return new Response("Message too long (max 4000 chars)", { status: 400 });
  }

  // The full-page mentor owns persistence: it POSTs the finished exchange to
  // /conversations/[id]/messages once the stream settles, so that it can attach
  // sheet cards and the real final text. Writing here as well stored every
  // exchange twice — once orphaned with a null conversationId — so this route
  // only persists for the embedded mentor, which has no conversation of its own.
  const ownsPersistence = !conversationId;

  if (ownsPersistence) {
    await prisma.chatMessage.create({
      data: { userId, role: "USER", content: message, context },
    });
  }

  // ── Fetch the three independent inputs in parallel ─────────────────────
  // The RAG embedding round-trip is the slow one; running the context lookup
  // and chat-history read alongside it (rather than in sequence) shortens the
  // time before the first token streams.
  const contextRecordP = context?.startsWith("problem:")
    ? prisma.problem
        .findUnique({
          where: { id: context.split(":")[1] },
          select: { title: true, description: true, pattern: true, difficulty: true },
        })
        .then((p) => (p ? { kind: "problem" as const, ...p } : null))
    : context?.startsWith("sd:")
      ? prisma.systemDesignQuestion
          .findUnique({
            where: { id: context.split(":")[1] },
            select: { title: true, description: true, difficulty: true },
          })
          .then((q) => (q ? { kind: "sd" as const, ...q } : null))
      : Promise.resolve(null);

  const [ragContext, history, contextRecord] = await Promise.all([
    retrieveContext(message).catch(() => ""),
    prisma.chatMessage.findMany({
      // Scoped to the conversation when there is one. Keying on `context` alone
      // meant every full-page conversation shared the single "dashboard" bucket,
      // so unrelated threads bled into each other's history.
      where: conversationId ? { userId, conversationId } : { userId, context },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { role: true, content: true },
    }),
    contextRecordP,
  ]);

  // ── System prompt ──────────────────────────────────────────────────────
  let systemPrompt = `You are Codeward Mentor, an expert software engineering interview coach.
You help engineers prepare for technical interviews at top product companies (Google, Meta, Amazon, Microsoft, Apple, and similar).
You specialize in DSA (algorithms and data structures), system design, and AI/ML interviews.
Be concise, practical, and encouraging. Use code examples when helpful (Python preferred unless the user specifies otherwise).
When explaining DSA problems, guide with hints before giving full solutions — ask about their approach first.`;

  if (contextRecord?.kind === "problem") {
    systemPrompt += `\n\nThe user is working on: "${contextRecord.title}" (${contextRecord.difficulty}, pattern: ${contextRecord.pattern.replace(/_/g, " ").toLowerCase()}).
Problem: ${contextRecord.description}
Guide them with hints. Ask about their approach before revealing the solution.`;
  } else if (context === "system-design") {
    systemPrompt += `\n\nThe user is in the system design section. Help them understand system design concepts, walk through architectures, discuss trade-offs, and prepare for system design interviews.`;
  } else if (context?.startsWith("sheet:") || context === "dsa") {
    systemPrompt += `\n\nThe user is viewing their DSA sheet. You can help them plan which patterns to focus on, explain DSA concepts, or generate a custom study plan based on their goals, target company, or weak areas.`;
  } else if (contextRecord?.kind === "sd") {
    systemPrompt += `\n\nThe user is studying this system design question: "${contextRecord.title}" (${contextRecord.difficulty}).
Description: ${contextRecord.description}
Help them think through the design — ask clarifying questions first, then guide through requirements, estimation, high-level design, deep dives, and trade-offs.`;
  }

  if (ragContext) {
    systemPrompt += `\n\n--- Relevant knowledge ---\n${ragContext}\n--- End knowledge ---\nUse this to ground your answer when relevant.`;
  }

  // `history` came back newest-first. Reversed it reads oldest-first, and when
  // this route did the writing its last entry is the message we just stored —
  // drop it so the current turn isn't sent twice. When the client owns
  // persistence nothing has been written yet, so every row is a prior turn.
  const ascending = history.reverse();
  const priorTurns = ownsPersistence ? ascending.slice(0, -1) : ascending;

  const messages = [
    ...priorTurns.map((m) => ({
      role: (m.role === "USER" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  // ── No API key fallback ────────────────────────────────────────────────
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const fallback = "The AI mentor isn't available right now. Please check back later.";
    if (ownsPersistence) {
      await prisma.chatMessage.create({
        data: { userId, role: "ASSISTANT", content: fallback, context },
      });
    }
    return new Response(fallback);
  }

  // ── Stream from Groq ───────────────────────────────────────────────────
  const groq = new Groq({ apiKey });
  const encoder = new TextEncoder();
  let assistantContent = "";
  let route: MentorRoute | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const groqStream = await groq.chat.completions.create({
          model: GROQ_MODEL,
          max_tokens: 1500,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          stream: true,
          // The model decides whether this turn is a conversation or a request
          // to build something. This replaced a client-side substring match that
          // fired on "Do not create a sheet" (it contains "create a sheet") and
          // missed "Create a custom sheet named X" (it matched no trigger).
          //
          // MUST stay "auto" — the other AI routes use "required" because they
          // exist only to call one tool. Copying that here would turn every
          // question into a sheet.
          tool_choice: "auto",
          tools: SHEET_ROUTING_TOOLS,
        });

        for await (const chunk of groqStream) {
          const delta = chunk.choices[0]?.delta;

          // A routing tool call ends the turn: the client takes over and calls
          // the heavy sheet endpoint. Deliberately not generating the sheet in
          // here — that's a forced tool call at max_tokens 4000, which has no
          // business inside a streaming conversational reply.
          const called = delta?.tool_calls?.[0]?.function?.name;
          if (called && (called === "create_study_sheet" || called === "add_problems_to_sheet")) {
            route = called === "create_study_sheet" ? "create_sheet" : "add_problems";
            break;
          }

          const text = delta?.content ?? "";
          if (text) {
            assistantContent += text;
            controller.enqueue(encoder.encode(text));
          }
        }

        if (route) {
          // Any prose streamed before the tool call is discarded on the client —
          // the sheet flow replaces the message, as it always did.
          assistantContent = "";
          controller.enqueue(encoder.encode(CONTROL_DELIMITER + JSON.stringify({ route })));
        }
      } catch (e) {
        console.error("[mentor/chat] stream error:", e);
        const errMsg = "Something went wrong. Please try again.";
        controller.enqueue(encoder.encode(errMsg));
        assistantContent = errMsg;
      } finally {
        if (ownsPersistence && assistantContent) {
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
