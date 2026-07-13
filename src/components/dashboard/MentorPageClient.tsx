"use client";
import { useState, useEffect } from "react";
import { Sparkles, Plus, Trash2, MessageSquare, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import MentorChat, { type Message } from "@/components/dashboard/MentorChat";

type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  lastMessage: string;
};

type Props = {
  initialConversations: ConversationSummary[];
};

function groupByDate(convs: ConversationSummary[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: { label: string; items: ConversationSummary[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Older", items: [] },
  ];

  for (const c of convs) {
    const d = new Date(c.updatedAt);
    d.setHours(0, 0, 0, 0);
    if (d >= today) groups[0].items.push(c);
    else if (d >= yesterday) groups[1].items.push(c);
    else groups[2].items.push(c);
  }

  return groups.filter((g) => g.items.length > 0);
}

export default function MentorPageClient({ initialConversations }: Props) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(
    initialConversations[0]?.id ?? null
  );
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [loadingConv, setLoadingConv] = useState(false);
  const [showList, setShowList] = useState(true); // mobile: toggle between list and chat

  // Load the first conversation's messages on mount
  useEffect(() => {
    if (initialConversations[0]?.id) {
      loadConversation(initialConversations[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConversation = async (id: string) => {
    setShowList(false);
    setLoadingConv(true);
    try {
      const res = await fetch(`/api/mentor/conversations/${id}`);
      const data = await res.json();
      const msgs: Message[] = (data.messages ?? []).map((m: {
        role: string; content: string; messageType: string;
        sheetId?: string; sheetName?: string; problemCount?: number; rationale?: string;
      }) => {
        if (m.messageType === "sheet" && m.sheetId) {
          return {
            role: "assistant" as const,
            type: "sheet" as const,
            sheetId: m.sheetId,
            sheetName: m.sheetName ?? "",
            problemCount: m.problemCount ?? 0,
            rationale: m.rationale ?? "",
          };
        }
        return {
          role: (m.role === "USER" ? "user" : "assistant") as "user" | "assistant",
          type: "text" as const,
          content: m.content,
        };
      });
      setActiveMessages(msgs);
      setActiveId(id);
      setShowList(false);
    } finally {
      setLoadingConv(false);
    }
  };

  const createNew = async () => {
    const res = await fetch("/api/mentor/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    const newConv: ConversationSummary = {
      id: data.id,
      title: data.title,
      updatedAt: new Date().toISOString(),
      lastMessage: "",
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveMessages([]);
    setActiveId(data.id);
    setShowList(false);
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/mentor/conversations/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        loadConversation(remaining[0].id);
      } else {
        setActiveId(null);
        setActiveMessages([]);
        setShowList(true);
      }
    }
  };

  const groups = groupByDate(conversations);

  const sidebar = (
    <div className="flex flex-col h-full border-r border-slate-800/60 bg-canvas md:bg-transparent">
      {/* Sidebar header */}
      <div className="px-4 pt-5 pb-3 shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={14} className="text-sky-400" />
          <span className="text-sm font-semibold text-white">AI Mentor</span>
        </div>
        <button
          onClick={createNew}
          className="w-full flex items-center gap-2 rounded-xl border border-dashed border-sky-500/30 px-3 py-2 text-sm text-sky-400/80 hover:text-sky-400 hover:border-sky-500/50 hover:bg-sky-500/5 transition-colors"
        >
          <Plus size={14} />
          New chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4">
        {groups.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <MessageSquare size={24} className="text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No conversations yet</p>
            <p className="text-xs text-slate-500 mt-1">Click &ldquo;New chat&rdquo; to start</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              <p className="px-2 mb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {group.label}
              </p>
              {group.items.map((conv) => (
                <div key={conv.id} className="relative group">
                  <button
                    onClick={() => loadConversation(conv.id)}
                    className={cn(
                      "w-full text-left flex items-start gap-2 rounded-lg px-2 py-2 pr-7 transition-colors",
                      activeId === conv.id
                        ? "bg-sky-500/10 text-sky-400"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate leading-snug">{conv.title}</p>
                      {conv.lastMessage && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-0.5"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const activeConvTitle = conversations.find((c) => c.id === activeId)?.title ?? "New conversation";

  const chatPanel = (
    <div className="flex flex-col h-full min-w-0">
      {/* Chat header — always visible */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/60 shrink-0 bg-canvas/80 backdrop-blur-sm">
        {/* Mobile back button */}
        <button
          onClick={() => setShowList(true)}
          className="md:hidden flex items-center gap-1 text-slate-400 hover:text-white transition-colors shrink-0"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={13} className="text-sky-400 shrink-0" />
          <span className="text-sm font-semibold text-white truncate">
            {activeId ? activeConvTitle : "AI Mentor"}
          </span>
        </div>
      </div>

      {activeId ? (
        loadingConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex gap-1">
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="w-1.5 h-1.5 rounded-full bg-sky-400/60 animate-bounce"
                  style={{ animationDelay: `${d}ms`, animationDuration: "900ms" }}
                />
              ))}
            </div>
          </div>
        ) : (
          <MentorChat
            key={activeId}
            conversationId={activeId}
            initialMessages={activeMessages}
            context="dashboard"
            hideHeader
            className="flex-1 min-h-0 rounded-none border-0 bg-transparent md:bg-transparent"
          />
        )
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <Sparkles size={20} className="text-sky-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Start a conversation</p>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Ask about DSA patterns, system design,<br />or generate a custom study sheet.
            </p>
          </div>
          <button
            onClick={createNew}
            className="mt-1 px-4 py-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 text-sm hover:bg-sky-500/20 transition-colors"
          >
            New chat
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="-m-6 md:-m-8 h-[calc(100svh-53px)] md:h-screen flex overflow-hidden">
      {/* Sidebar — always visible on desktop, toggled on mobile */}
      <div className={cn(
        "w-full md:w-64 md:flex shrink-0 flex-col",
        showList ? "flex" : "hidden md:flex"
      )}>
        {sidebar}
      </div>

      {/* Chat panel — always visible on desktop, shown when !showList on mobile */}
      <div className={cn(
        "flex-1 min-w-0",
        showList ? "hidden md:flex" : "flex"
      )}>
        {chatPanel}
      </div>
    </div>
  );
}
