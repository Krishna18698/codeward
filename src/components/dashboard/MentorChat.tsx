"use client";
import { useState, useRef, useEffect, lazy, Suspense } from "react";
import Link from "next/link";
import { Sparkles, Send, ArrowRight, Square, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

// Lazy so the markdown pipeline stays out of the shared dashboard bundle;
// plain text renders as the fallback for the frame it takes to load.
const MarkdownMessage = lazy(() => import("./MarkdownMessage"));

export type Message =
  | { role: "user" | "assistant"; content: string; type?: "text" }
  | { role: "assistant"; type: "sheet"; sheetId: string; sheetName: string; problemCount: number; rationale: string }
  | { role: "assistant"; type: "sheet-update"; sheetId: string; sheetName: string; addedCount: number; totalCount: number };

type Props = {
  userId?: string;
  context?: string;
  className?: string;
  hideHeader?: boolean;
  conversationId?: string;
  initialMessages?: Message[];
  onSheetOpen?: () => void;
};

const WELCOME: Message = {
  role: "assistant",
  type: "text",
  content:
    "Hey! I'm your AI prep mentor. I can help you plan your DSA sheet, explain patterns, review your approach, or answer system design questions.\n\nTry: *\"Create a sheet for Meta focused on trees and DP\"*",
};

const SHEET_TRIGGERS = [
  "create a sheet", "make a sheet", "generate a sheet", "build a sheet",
  "create sheet", "make sheet", "build sheet",
  "create a plan", "make a study plan", "build a plan", "create study plan",
];

const ADD_TRIGGERS = [
  "add more", "add problems", "more problems", "add to that sheet",
  "add to the sheet", "expand the sheet", "add to sheet", "more to the sheet",
  "add more problems", "add to my sheet",
];

function isSheetRequest(text: string) {
  return SHEET_TRIGGERS.some((t) => text.toLowerCase().includes(t));
}

function isAddToSheetRequest(text: string) {
  return ADD_TRIGGERS.some((t) => text.toLowerCase().includes(t));
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-1.5 h-1.5 rounded-full bg-sky-400/70 animate-bounce"
          style={{ animationDelay: `${delay}ms`, animationDuration: "900ms" }}
        />
      ))}
    </div>
  );
}

const CHARS_PER_FRAME = 5;

export default function MentorChat({
  context = "dashboard",
  className = "",
  hideHeader = false,
  conversationId,
  initialMessages,
  onSheetOpen,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages && initialMessages.length > 0 ? initialMessages : [WELCOME]
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const receivedRef = useRef("");

  useEffect(() => {
    setMessages(initialMessages && initialMessages.length > 0 ? initialMessages : [WELCOME]);
    setInput("");
    setLoading(false);
    setThinking(false);
    setStreaming(false);
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  const stop = () => {
    abortRef.current?.abort();
    if (tickerRef.current) clearInterval(tickerRef.current);
    // Flush whatever was received so far
    const received = receivedRef.current;
    if (received) {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === "assistant" && last.type === "text") {
          updated[updated.length - 1] = { ...last, content: received };
        }
        return updated;
      });
    }
    setStreaming(false);
    setThinking(false);
    setLoading(false);
  };

  const persist = (msgs: Message[]) => {
    if (!conversationId) return;
    const payload = msgs.map((m) => {
      if (m.type === "sheet") {
        return { role: "ASSISTANT" as const, content: m.rationale, messageType: "sheet", sheetId: m.sheetId, sheetName: m.sheetName, problemCount: m.problemCount, rationale: m.rationale };
      }
      if (m.type === "sheet-update") {
        return { role: "ASSISTANT" as const, content: `Added ${m.addedCount} problems to ${m.sheetName}`, messageType: "sheet-update", sheetId: m.sheetId, sheetName: m.sheetName, problemCount: m.totalCount };
      }
      return { role: (m.role === "user" ? "USER" : "ASSISTANT") as "USER" | "ASSISTANT", content: m.content ?? "", messageType: "text" };
    });
    fetch(`/api/mentor/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: payload }),
    }).catch(() => {});
  };

  // Find the most recent sheet in this conversation (for add-to-sheet)
  const lastSheet = [...messages].reverse().find((m): m is Extract<Message, { type: "sheet" }> => m.type === "sheet");

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text, type: "text" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setThinking(true);

    try {
      // ── Add to existing sheet ──────────────────────────────────────────────
      if (isAddToSheetRequest(text) && lastSheet) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", type: "text", content: `Adding more problems to "${lastSheet.sheetName}"…` },
        ]);
        setThinking(false);

        const res = await fetch("/api/mentor/add-to-sheet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, sheetId: lastSheet.sheetId }),
        });

        const data = await res.json();

        if (!res.ok) {
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { role: "assistant", type: "text", content: `Sorry, couldn't add problems: ${data.error}` },
          ]);
          toast.error("Couldn't add problems to sheet");
        } else {
          const updateMsg: Message = {
            role: "assistant",
            type: "sheet-update",
            sheetId: data.sheetId,
            sheetName: data.sheetName,
            addedCount: data.addedCount,
            totalCount: data.totalCount,
          };
          setMessages((prev) => [...prev.slice(0, -1), updateMsg]);
          toast.success(`Added ${data.addedCount} problems to ${data.sheetName}`);
          persist([userMsg, updateMsg]);
        }

      // ── Create new sheet ───────────────────────────────────────────────────
      } else if (isSheetRequest(text)) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", type: "text", content: "Generating your personalized sheet…" },
        ]);
        setThinking(false);

        const res = await fetch("/api/mentor/generate-sheet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });

        const data = await res.json();

        if (!res.ok) {
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { role: "assistant", type: "text", content: `Sorry, couldn't generate the sheet: ${data.error}` },
          ]);
          toast.error("Couldn't generate the sheet");
        } else {
          const sheetMsg: Message = {
            role: "assistant",
            type: "sheet",
            sheetId: data.sheetId,
            sheetName: data.sheetName,
            problemCount: data.problemCount,
            rationale: data.rationale,
          };
          setMessages((prev) => [...prev.slice(0, -1), sheetMsg]);
          toast.success(`Sheet created — ${data.problemCount} problems added`);
          persist([userMsg, sheetMsg]);
        }

      // ── Normal RAG chat with streaming ────────────────────────────────────
      } else {
        abortRef.current = new AbortController();
        receivedRef.current = "";

        const res = await fetch("/api/mentor/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, context }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) throw new Error("Failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let displayed = "";

        setThinking(false);
        setStreaming(true);
        setMessages((prev) => [...prev, { role: "assistant", type: "text", content: "" }]);

        tickerRef.current = setInterval(() => {
          const received = receivedRef.current;
          if (displayed.length < received.length) {
            displayed = received.slice(0, displayed.length + CHARS_PER_FRAME);
            const snap = displayed;
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === "assistant" && last.type === "text") {
                updated[updated.length - 1] = { ...last, content: snap };
              }
              return updated;
            });
          }
        }, 16);

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            receivedRef.current += decoder.decode(value, { stream: true });
          }
        } catch (e: unknown) {
          if (e instanceof Error && e.name === "AbortError") {
            // User stopped — keep what was displayed, exit cleanly
            return;
          }
          throw e;
        }

        // Wait for typewriter to catch up
        await new Promise<void>((resolve) => {
          const check = setInterval(() => {
            if (displayed.length >= receivedRef.current.length) {
              clearInterval(check);
              if (tickerRef.current) clearInterval(tickerRef.current);
              const final = receivedRef.current;
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant" && last.type === "text") {
                  updated[updated.length - 1] = { ...last, content: final };
                }
                return updated;
              });
              resolve();
            }
          }, 50);
        });

        setStreaming(false);
        const assistantMsg: Message = { role: "assistant", type: "text", content: receivedRef.current };
        persist([userMsg, assistantMsg]);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      setThinking(false);
      setStreaming(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", type: "text", content: "Something went wrong. Try again in a moment." },
      ]);
      toast.error("Couldn't reach the mentor");
    } finally {
      setLoading(false);
      setThinking(false);
    }
  };

  return (
    <div className={cn("flex h-full flex-col bg-canvas md:bg-slate-900/50 overflow-hidden", className)}>
      {!hideHeader && (
        <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3 shrink-0">
          <Sparkles size={14} className="text-sky-400 shrink-0" />
          <span className="text-sm font-medium text-white">AI Mentor</span>
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
        </div>
      )}

      <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 text-sm">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-2 animate-msg-pop", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <Sparkles size={12} className="mt-1 shrink-0 text-sky-400" />
            )}

            {msg.type === "sheet" ? (
              <div className="max-w-[92%] rounded-xl border border-sky-500/30 bg-sky-500/8 p-3 space-y-1.5 animate-scale-in">
                <p className="text-[10px] text-sky-400 font-medium uppercase tracking-wide">Sheet created</p>
                <p className="text-sm font-semibold text-white">{msg.sheetName}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{msg.rationale}</p>
                <p className="text-xs text-slate-500">{msg.problemCount} problems</p>
                <Link
                  href={`/dashboard/dsa?sheet=${msg.sheetId}`}
                  onClick={() => onSheetOpen?.()}
                  className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
                >
                  Open sheet <ArrowRight size={11} />
                </Link>
              </div>
            ) : msg.type === "sheet-update" ? (
              <div className="max-w-[92%] rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-3 space-y-1.5 animate-scale-in">
                <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-wide">Problems added</p>
                <p className="text-sm font-semibold text-white">{msg.sheetName}</p>
                <p className="text-xs text-slate-500">+{msg.addedCount} new problems · {msg.totalCount} total</p>
                <Link
                  href={`/dashboard/dsa?sheet=${msg.sheetId}`}
                  onClick={() => onSheetOpen?.()}
                  className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <PlusCircle size={11} /> Open sheet
                </Link>
              </div>
            ) : msg.role === "user" ? (
              <div className="max-w-[88%] rounded-2xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap text-[13px] md:text-sm bg-sky-500/15 text-slate-200 border border-sky-500/20">
                {msg.content}
              </div>
            ) : (
              <div className="max-w-[92%] text-[13px] md:text-sm text-slate-300 space-y-0.5">
                <Suspense fallback={<div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>}>
                  <MarkdownMessage content={msg.content} />
                </Suspense>
                {streaming && i === messages.length - 1 && (
                  <span className="inline-block w-0.5 h-[1em] bg-sky-400 animate-pulse rounded-sm ml-0.5 align-text-bottom" />
                )}
              </div>
            )}
          </div>
        ))}

        {thinking && (
          <div className="flex gap-2 justify-start animate-msg-pop">
            <Sparkles size={12} className="mt-2 shrink-0 text-sky-400" />
            <ThinkingDots />
          </div>
        )}
      </div>

      <div className="border-t border-slate-800 px-3 py-3 md:p-3 shrink-0 bg-canvas md:bg-transparent">
        <div className="flex gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-3 focus-within:border-sky-500/50 transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask me anything…"
            className="flex-1 bg-transparent text-[13px] md:text-sm text-slate-200 placeholder-slate-600 outline-none"
            disabled={loading}
          />
          {(streaming || thinking) ? (
            <button
              onClick={stop}
              className="text-red-400 hover:text-red-300 transition-colors p-1 -mr-1"
              title="Stop"
            >
              <Square size={15} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="text-sky-400 hover:text-sky-300 disabled:text-slate-700 transition-colors p-1 -mr-1"
            >
              <Send size={16} />
            </button>
          )}
        </div>
        <p className="mt-1.5 text-[10px] text-slate-500 text-center hidden md:block">
          Say &quot;create a sheet for Meta&quot; to generate a personalized plan
        </p>
      </div>
    </div>
  );
}
