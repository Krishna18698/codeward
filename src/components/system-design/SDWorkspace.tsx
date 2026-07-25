"use client";
import { useState } from "react";
import Link from "next/link";
import type { SystemDesignQuestion } from "@prisma/client";
import SDNotesPanel from "./SDNotesPanel";
import MentorChat from "@/components/dashboard/MentorChat";

type Props = {
  question: SystemDesignQuestion;
  initialNote: string;
  userId: string;
};

const diffColor = { EASY: "text-accent", MEDIUM: "text-amber-400", HARD: "text-red-400" };
const diffBg   = { EASY: "bg-accent/10 border-accent/20", MEDIUM: "bg-amber-500/10 border-amber-500/20", HARD: "bg-red-500/10 border-red-500/20" };
const expLabel = { JUNIOR: "Junior", MID: "Mid-level", SENIOR: "Senior" };

const FRAMEWORK = [
  { step: "1", label: "Clarify requirements", hint: "Functional vs non-functional. Ask about scale, latency, consistency needs." },
  { step: "2", label: "Capacity estimation", hint: "QPS, storage, bandwidth. Back-of-envelope numbers." },
  { step: "3", label: "High-level design", hint: "Draw the major components and data flow. API design." },
  { step: "4", label: "Deep dives", hint: "Pick 2-3 interesting sub-problems. Database choice, caching, sharding." },
  { step: "5", label: "Trade-offs & bottlenecks", hint: "What breaks at scale? What are you sacrificing?" },
];

type Tab = "prompt" | "framework" | "notes";

export default function SDWorkspace({ question, initialNote, userId }: Props) {
  const [tab, setTab] = useState<Tab>("prompt");
  const [showMentor, setShowMentor] = useState(true);

  const mentorWelcome =
    `Hey! I can help you design **${question.title}** — walk through the requirements, ` +
    `sketch the architecture, quiz you on trade-offs, or explain any concept it touches.\n\n` +
    `Try: *"Walk me through designing this"* or *"What breaks first at 10x scale?"*`;

  // 57px = TopNav's h-14 (56px) + its 1px bottom border, same fix as MentorPageClient.
  return (
    <div className="flex h-[calc(100svh-57px)] overflow-hidden -m-4 md:-m-8">
      {/* ── Left panel ── */}
      <div className="w-[420px] shrink-0 flex flex-col border-r border-border bg-canvas overflow-hidden">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border text-xs text-muted shrink-0">
          <Link href="/dashboard/system-design" className="hover:text-secondary transition">
            System Design
          </Link>
          <span>/</span>
          <span className="text-secondary truncate">{question.title}</span>
        </div>

        {/* Question header */}
        <div className="px-4 pt-4 pb-3 border-b border-border shrink-0">
          <h1 className="text-base font-semibold text-primary leading-snug mb-2">
            {question.title}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] border rounded-full px-2 py-0.5 font-medium ${diffBg[question.difficulty]} ${diffColor[question.difficulty]}`}>
              {question.difficulty.charAt(0) + question.difficulty.slice(1).toLowerCase()}
            </span>
            <span className="text-[11px] text-muted">
              {expLabel[question.experienceLevel]}
            </span>
            {question.mustDo && (
              <span className="text-[10px] text-amber-400/80 border border-amber-500/20 rounded px-1.5 py-0.5">
                must do
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          {(["prompt", "framework", "notes"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2.5 text-xs capitalize transition ${
                tab === t
                  ? "text-primary border-b border-accent"
                  : "text-muted hover:text-secondary"
              }`}
            >
              {t === "prompt" ? "Question" : t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {tab === "prompt" && (
            <div className="px-4 py-4 space-y-4">
              <p className="text-sm text-secondary leading-relaxed">{question.description}</p>

              <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
                <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">
                  What to cover
                </p>
                {[
                  "Functional & non-functional requirements",
                  "Scale estimation (QPS, storage, bandwidth)",
                  "High-level architecture diagram",
                  "Database design & storage choices",
                  "Caching strategy",
                  "Scalability & bottlenecks",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-xs text-secondary">
                    <span className="text-accent mt-0.5 shrink-0">·</span>
                    {item}
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
                <p className="text-xs text-accent font-medium mb-1">✦ Ask the mentor</p>
                <p className="text-xs text-muted">
                  The AI mentor on the right knows this question. Ask it to walk you through the design, quiz you, or explain any concept.
                </p>
              </div>
            </div>
          )}

          {tab === "framework" && (
            <div className="px-4 py-4 space-y-3">
              <p className="text-xs text-muted mb-4">
                Use this framework to structure your 45-minute system design interview.
              </p>
              {FRAMEWORK.map((f) => (
                <div key={f.step} className="flex gap-3 rounded-xl border border-border bg-surface p-3">
                  <span className="w-6 h-6 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {f.step}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-primary">{f.label}</p>
                    <p className="text-xs text-muted mt-0.5">{f.hint}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "notes" && (
            <div className="h-full">
              <SDNotesPanel questionId={question.id} userId={userId} initialContent={initialNote} />
            </div>
          )}

        </div>
      </div>

      {/* ── Right: AI Mentor ── */}
      <div className={`flex-1 flex flex-col overflow-hidden ${showMentor ? "" : "hidden xl:flex"}`}>
        {/* Mentor header bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-canvas shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-accent text-sm">✦</span>
            <span className="text-sm font-medium text-primary">AI Mentor</span>
            <span className="text-xs text-muted">— ask me to walk through this design</span>
          </div>
          <button
            onClick={() => setShowMentor((v) => !v)}
            className="text-muted hover:text-secondary text-xs xl:hidden"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 min-h-0">
          <MentorChat
            userId={userId}
            context={`sd:${question.id}`}
            welcome={mentorWelcome}
            hideHeader
            className="h-full rounded-none border-0"
          />
        </div>
      </div>
    </div>
  );
}
