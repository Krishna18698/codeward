"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DsaMockup,
  MentorMockup,
  CodeReviewMockup,
  DeepDiveMockup,
  BugHuntMockup,
  BuildItMockup,
  SystemDesignMockup,
} from "./Mockups";

// One interactive card instead of seven stacked rows. Clicking a tab swaps the
// mockup + its blurb inside the same frame — mirrors the app's own tabbed
// workspaces, and it's clickable for a live demo. Flagships lead the row.
type Tab = {
  key: string;
  label: string;
  title: string;
  copy: string;
  cta: string;
  Mockup: () => React.ReactNode;
};

const TABS: Tab[] = [
  {
    key: "build-it",
    label: "Build It",
    title: "Design it, then watch your own design break",
    copy: "5 real low-level-design problems — a thread-safe wallet, an inventory reservation service, a durable job queue, an idempotent payment processor, a notification service — each evolving across 4 stages as new constraints break your last approach, in C#, Python, or Kotlin. Write real code and run it against real tests.",
    cta: "Start building →",
    Mockup: BuildItMockup,
  },
  {
    key: "code-review",
    label: "Code Review",
    title: "Review realistic PRs with planted bugs",
    copy: "15 hand-authored diffs across payments, auth, caching, and infra — each with real bugs at graded severities. Leave inline comments; the AI scores what you caught against the ground-truth list, like a senior reviewer would.",
    cta: "Try a review →",
    Mockup: CodeReviewMockup,
  },
  {
    key: "bug-hunt",
    label: "Bug Hunt",
    title: "Fix the code, then diagnose the failure",
    copy: "9 broken codebases with failing tests and real logs — races, N+1s, leaks, deadlocks. Edit the code, then write your root-cause diagnosis; the AI grades both and reveals the canonical fix and the tempting wrong turns.",
    cta: "Start debugging →",
    Mockup: BugHuntMockup,
  },
  {
    key: "system-design",
    label: "System Design",
    title: "Practice the design round, level by level",
    copy: "Curated system-design questions by difficulty and experience level (junior → senior), plus a challenge spinner that generates a fresh prompt — problem × scale × traffic spike × constraint — to design against.",
    cta: "Open system design →",
    Mockup: SystemDesignMockup,
  },
  {
    key: "dsa",
    label: "DSA Sheets",
    title: "Track every pattern, not just problem counts",
    copy: "Blind 75, Striver's, NeetCode 150, and a 300-problem company-tagged bank — grouped by pattern, with status, revision flags, and notes. Or let the mentor generate a sheet weighted for your target company.",
    cta: "Browse the sheets →",
    Mockup: DsaMockup,
  },
  {
    key: "deep-dives",
    label: "Deep Dives",
    title: "Learn the trade-offs interviews actually probe",
    copy: "13 long-form deep dives — idempotency, caching, rate limiting, Kafka, Raft, consistent hashing, sagas, and more. Failure modes, trade-offs, and the interview traps surface-level guides skip.",
    cta: "Read the deep dives →",
    Mockup: DeepDiveMockup,
  },
  {
    key: "mentor",
    label: "AI Mentor",
    title: "A mentor that knows what you've already solved",
    copy: "RAG-grounded in real prep content and aware of your context — target company, experience level, progress. It explains patterns, reviews your approach, and creates sheets directly in your account.",
    cta: "Meet the mentor →",
    Mockup: MentorMockup,
  },
];

export default function ModesShowcase() {
  const [active, setActive] = useState(0);
  const m = TABS[active];

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-center font-mono text-[13px] uppercase tracking-wide text-emerald-400">
          The platform
        </p>
        <h2 className="text-center text-3xl font-semibold tracking-heading text-white">
          Seven ways to actually get ready
        </h2>

        {/* Tab row — boxy, emerald-selected, matches the app's own workspaces. */}
        <div
          role="tablist"
          aria-label="Practice modes"
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
          {TABS.map((t, i) => {
            const selected = i === active;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(i)}
                className={`rounded-sm px-3.5 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? "bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-500/30"
                    : "text-neutral-500 ring-1 ring-transparent hover:text-neutral-200 hover:ring-neutral-800"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* The single swapping card. key={active} remounts it so the content
            fades in on each tab change. */}
        <div
          key={active}
          className="animate-fade-in mt-10 grid items-center gap-8 md:grid-cols-2 md:gap-12"
        >
          <div>
            <p className="mb-4 font-mono text-[13px] uppercase tracking-wide text-emerald-400">
              {m.label}
            </p>
            <h3 className="mb-3 text-2xl font-semibold tracking-heading leading-tight text-white">
              {m.title}
            </h3>
            <p className="mb-5 max-w-md leading-relaxed text-neutral-400">{m.copy}</p>
            <Link
              href="/register"
              className="text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
            >
              {m.cta}
            </Link>
          </div>
          <div className="w-full min-w-0">
            <m.Mockup />
          </div>
        </div>
      </div>
    </section>
  );
}
