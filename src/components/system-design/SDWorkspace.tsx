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

const diffColor = { EASY: "text-emerald-400", MEDIUM: "text-amber-400", HARD: "text-red-400" };
const diffBg   = { EASY: "bg-emerald-500/10 border-emerald-500/20", MEDIUM: "bg-amber-500/10 border-amber-500/20", HARD: "bg-red-500/10 border-red-500/20" };
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

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden -m-8">
      {/* ── Left panel ── */}
      <div className="w-[420px] shrink-0 flex flex-col border-r border-slate-800 bg-[#07090c] overflow-hidden">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 text-xs text-slate-500 shrink-0">
          <Link href="/dashboard/system-design" className="hover:text-slate-300 transition">
            System Design
          </Link>
          <span>/</span>
          <span className="text-slate-400 truncate">{question.title}</span>
        </div>

        {/* Question header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-800/60 shrink-0">
          <h1 className="text-base font-semibold text-white leading-snug mb-2">
            {question.title}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] border rounded-full px-2 py-0.5 font-medium ${diffBg[question.difficulty]} ${diffColor[question.difficulty]}`}>
              {question.difficulty.charAt(0) + question.difficulty.slice(1).toLowerCase()}
            </span>
            <span className="text-[11px] text-slate-600">
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
        <div className="flex border-b border-slate-800 shrink-0">
          {(["prompt", "framework", "notes"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2.5 text-xs capitalize transition ${
                tab === t
                  ? "text-white border-b border-sky-400"
                  : "text-slate-500 hover:text-slate-300"
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
              <p className="text-sm text-slate-300 leading-relaxed">{question.description}</p>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
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
                  <div key={item} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="text-sky-400 mt-0.5 shrink-0">·</span>
                    {item}
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
                <p className="text-xs text-sky-400 font-medium mb-1">✦ Ask the mentor</p>
                <p className="text-xs text-slate-500">
                  The AI mentor on the right knows this question. Ask it to walk you through the design, quiz you, or explain any concept.
                </p>
              </div>
            </div>
          )}

          {tab === "framework" && (
            <div className="px-4 py-4 space-y-3">
              <p className="text-xs text-slate-500 mb-4">
                Use this framework to structure your 45-minute system design interview.
              </p>
              {FRAMEWORK.map((f) => (
                <div key={f.step} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                  <span className="w-6 h-6 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {f.step}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{f.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{f.hint}</p>
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
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-[#07090c] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sky-400 text-sm">✦</span>
            <span className="text-sm font-medium text-white">AI Mentor</span>
            <span className="text-xs text-slate-600">— ask me to walk through this design</span>
          </div>
          <button
            onClick={() => setShowMentor((v) => !v)}
            className="text-slate-600 hover:text-slate-400 text-xs xl:hidden"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 min-h-0">
          <MentorChat
            userId={userId}
            context={`sd:${question.id}`}
            className="h-full rounded-none border-0"
          />
        </div>
      </div>
    </div>
  );
}
