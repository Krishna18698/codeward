"use client";
import { useState, useRef, useEffect, lazy, Suspense } from "react";
import Link from "next/link";
import { Sparkles, Send, ArrowRight, Square, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { CONTROL_DELIMITER, parseMentorStream } from "@/lib/mentorStream";

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
  /** Overrides the default welcome message — e.g. a hint scoped to the
   *  specific system-design question this chat instance is attached to. */
  welcome?: string;
};

const DEFAULT_WELCOME =
  "Hey! I'm your AI prep mentor. I can help you plan your DSA sheet, explain patterns, review your approach, or answer system design questions.\n\nTry: *\"Create a sheet for Meta focused on trees and DP\"*";

// Sheet intent used to be decided here, by testing the message against two
// lists of trigger substrings. That fired on "Do not create a sheet" (which
// contains "create a sheet") and stayed silent on "Create a custom sheet named
// QA Smoke" (which matched no trigger). The model now makes the call and says
// so in a control frame at the end of the stream — see @/lib/mentorStream.

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-1.5 h-1.5 rounded-full bg-accent/70 animate-bounce"
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
  welcome,
}: Props) {
  const welcomeMsg: Message = { role: "assistant", type: "text", content: welcome ?? DEFAULT_WELCOME };
  const [messages, setMessages] = useState<Message[]>(
    initialMessages && initialMessages.length > 0 ? initialMessages : [welcomeMsg]
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
    setMessages(initialMessages && initialMessages.length > 0 ? initialMessages : [welcomeMsg]);
    setInput("");
    setLoading(false);
    setThinking(false);
    setStreaming(false);
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-grow the input textarea with its content (capped by max-h-24)
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 96)}px`;
  }, [input]);

  // Pin-to-bottom: only auto-scroll while the user is already near the bottom,
  // so scrolling up to re-read during streaming doesn't get yanked back down.
  const pinnedRef = useRef(true);
  const handleMessagesScroll = () => {
    const el = messagesRef.current;
    if (el) pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  useEffect(() => {
    const el = messagesRef.current;
    if (el && pinnedRef.current) el.scrollTop = el.scrollHeight;
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
    // A swallowed failure here is how a broken save stayed invisible for so
    // long: the reply rendered, nothing was stored, and the conversation came
    // back empty on the next load with no error anywhere. Surface it instead.
    fetch(`/api/mentor/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: payload }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`save failed (${res.status})`);
      })
      .catch(() => toast.error("Couldn't save this message — it may not be here when you come back."));
  };

  // Find the most recent sheet in this conversation (for add-to-sheet)
  const lastSheet = [...messages].reverse().find((m): m is Extract<Message, { type: "sheet" }> => m.type === "sheet");

  /** Swaps the last message (the streamed placeholder) for a status line, then
   *  replaces that in turn with the result. Both sheet flows share the shape. */
  const replaceLast = (msg: Message) => setMessages((prev) => [...prev.slice(0, -1), msg]);

  const runSheetCreation = async (userMsg: Message, text: string) => {
    replaceLast({ role: "assistant", type: "text", content: "Generating your personalized sheet…" });
    setThinking(false);

    const res = await fetch("/api/mentor/generate-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();

    if (!res.ok) {
      // The loading line is replaced, not left hanging, and the failure names
      // what actually went wrong rather than a generic apology.
      replaceLast({
        role: "assistant",
        type: "text",
        content: `Sorry, couldn't generate the sheet: ${data.error ?? "the request failed"}. Your request is still above — try again.`,
      });
      toast.error("Couldn't generate the sheet");
      return;
    }

    const sheetMsg: Message = {
      role: "assistant",
      type: "sheet",
      sheetId: data.sheetId,
      sheetName: data.sheetName,
      problemCount: data.problemCount,
      rationale: data.rationale,
    };
    replaceLast(sheetMsg);
    toast.success(`Sheet created — ${data.problemCount} problems added`);
    persist([userMsg, sheetMsg]);
  };

  const runSheetAddition = async (
    userMsg: Message,
    text: string,
    sheet: Extract<Message, { type: "sheet" }>,
  ) => {
    replaceLast({ role: "assistant", type: "text", content: `Adding more problems to "${sheet.sheetName}"…` });
    setThinking(false);

    const res = await fetch("/api/mentor/add-to-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, sheetId: sheet.sheetId }),
    });
    const data = await res.json();

    if (!res.ok) {
      replaceLast({
        role: "assistant",
        type: "text",
        content: `Sorry, couldn't add problems: ${data.error ?? "the request failed"}. Your request is still above — try again.`,
      });
      toast.error("Couldn't add problems to sheet");
      return;
    }

    const updateMsg: Message = {
      role: "assistant",
      type: "sheet-update",
      sheetId: data.sheetId,
      sheetName: data.sheetName,
      addedCount: data.addedCount,
      totalCount: data.totalCount,
    };
    replaceLast(updateMsg);
    toast.success(`Added ${data.addedCount} problems to ${data.sheetName}`);
    persist([userMsg, updateMsg]);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text, type: "text" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setThinking(true);

    try {
      // Every turn goes to the chat route first. It streams prose, and if the
      // model judged this a build request it ends with a control frame naming
      // the follow-up — so intent is decided by the model, not by matching
      // substrings against the user's wording.
      {
        abortRef.current = new AbortController();
        receivedRef.current = "";

        const res = await fetch("/api/mentor/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Sending the conversation id both scopes the model's history to this
          // thread and tells the route not to persist — `persist()` below writes
          // the finished exchange against the same conversation.
          body: JSON.stringify({ message: text, context, conversationId }),
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

        // The control frame is split off the raw buffer on every read rather
        // than tested per-chunk, because the delimiter can land across a chunk
        // boundary. receivedRef only ever holds prose, so the typewriter never
        // types a NUL or the JSON behind it.
        let raw = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            raw += decoder.decode(value, { stream: true });
            const split = raw.indexOf(CONTROL_DELIMITER);
            receivedRef.current = split === -1 ? raw : raw.slice(0, split);
          }
        } catch (e: unknown) {
          if (e instanceof Error && e.name === "AbortError") {
            // User stopped — keep what was displayed, exit cleanly
            return;
          }
          throw e;
        }

        const { control } = parseMentorStream(raw);

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

        // The model asked to build something. The placeholder message (empty,
        // since a tool call streams no prose) becomes the status line, and the
        // heavy endpoint does the work.
        if (control?.route === "create_sheet") {
          await runSheetCreation(userMsg, text);
          return;
        }
        if (control?.route === "add_problems") {
          if (lastSheet) {
            await runSheetAddition(userMsg, text, lastSheet);
            return;
          }
          // Model wanted to extend a sheet that doesn't exist in this thread.
          // Say so rather than silently falling through to an empty reply.
          const noSheet: Message = {
            role: "assistant",
            type: "text",
            content: "I don't have a sheet from this conversation to add to yet — ask me to create one first.",
          };
          replaceLast(noSheet);
          persist([userMsg, noSheet]);
          return;
        }

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
    <div className={cn("flex h-full flex-col bg-canvas md:bg-surface overflow-hidden", className)}>
      {!hideHeader && (
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 shrink-0">
          <Sparkles size={14} className="text-accent shrink-0" />
          <span className="text-sm font-medium text-primary">AI Mentor</span>
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent-hover" />
        </div>
      )}

      <div ref={messagesRef} onScroll={handleMessagesScroll} className="flex-1 overflow-y-auto px-5 md:px-8 py-6 text-sm">
        <div className="mx-auto max-w-3xl space-y-5">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-2.5 animate-msg-pop", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "assistant" && (
                <Sparkles size={12} className="mt-1 shrink-0 text-accent" />
              )}

              {msg.type === "sheet" ? (
                <div className="max-w-[90%] rounded-2xl border border-accent/30 bg-accent/8 p-4 space-y-2 animate-scale-in">
                  <p className="text-[10px] text-accent font-medium uppercase tracking-wide">Sheet created</p>
                  <p className="text-sm font-semibold text-primary">{msg.sheetName}</p>
                  <p className="text-xs text-secondary leading-relaxed">{msg.rationale}</p>
                  <p className="text-xs text-muted">{msg.problemCount} problems</p>
                  <Link
                    href={`/dashboard/dsa?sheet=${msg.sheetId}`}
                    onClick={() => onSheetOpen?.()}
                    className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
                  >
                    Open sheet <ArrowRight size={11} />
                  </Link>
                </div>
              ) : msg.type === "sheet-update" ? (
                <div className="max-w-[90%] rounded-2xl border border-accent/30 bg-accent/8 p-4 space-y-2 animate-scale-in">
                  <p className="text-[10px] text-accent font-medium uppercase tracking-wide">Problems added</p>
                  <p className="text-sm font-semibold text-primary">{msg.sheetName}</p>
                  <p className="text-xs text-muted">+{msg.addedCount} new problems · {msg.totalCount} total</p>
                  <Link
                    href={`/dashboard/dsa?sheet=${msg.sheetId}`}
                    onClick={() => onSheetOpen?.()}
                    className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
                  >
                    <PlusCircle size={11} /> Open sheet
                  </Link>
                </div>
              ) : msg.role === "user" ? (
                <div className="max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed whitespace-pre-wrap text-[13px] md:text-sm bg-accent/15 text-primary border border-accent/20">
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-[90%] text-[13px] md:text-sm text-secondary space-y-0.5">
                  <Suspense fallback={<div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>}>
                    <MarkdownMessage content={msg.content} />
                  </Suspense>
                  {streaming && i === messages.length - 1 && (
                    <span className="inline-block w-0.5 h-[1em] bg-accent-hover animate-pulse rounded-sm ml-0.5 align-text-bottom" />
                  )}
                </div>
              )}
            </div>
          ))}

          {thinking && (
            <div className="flex gap-2.5 justify-start animate-msg-pop">
              <Sparkles size={12} className="mt-2 shrink-0 text-accent" />
              <ThinkingDots />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border px-5 md:px-8 py-4 shrink-0 bg-canvas md:bg-transparent">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-3xl border border-border bg-surface px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
            <textarea
              ref={inputRef}
              value={input}
              rows={1}
              autoComplete="off"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask me anything…"
              className="chat-textarea flex-1 bg-transparent text-[13px] md:text-sm text-primary placeholder-neutral-500 outline-none resize-none max-h-24 leading-relaxed"
              disabled={loading}
            />
            {(streaming || thinking) ? (
              <button
                onClick={stop}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400 transition-colors hover:bg-red-500/25"
                title="Stop"
                aria-label="Stop generating"
              >
                <Square size={12} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-fill text-black transition-colors hover:bg-accent-hover disabled:bg-border disabled:text-muted"
              >
                <Send size={13} />
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[10px] text-muted text-center hidden md:block">
            Say &quot;create a sheet for Meta&quot; to generate a personalized plan
          </p>
        </div>
      </div>
    </div>
  );
}
