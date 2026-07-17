import Link from "next/link";
import { Sparkles, Code2, Network, CheckCircle2 } from "lucide-react";

/* ─── Section marker ────────────────────────────────────────────────────── */
function SectionMarker({ n, label, center }: { n: string; label: string; center?: boolean }) {
  return (
    <p className={`font-mono text-[13px] text-neutral-500 mb-4 ${center ? "text-center" : ""}`}>
      <span className="text-emerald-400">{n}</span> — {label}
    </p>
  );
}

/* ─── Navbar ──────────────────────────────────────────────────────────── */
function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-neutral-800 bg-black/85 backdrop-blur-[20px]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-white">
          <Sparkles size={16} className="text-emerald-400" />
          Code<span className="text-emerald-400">ward</span>
        </span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-neutral-400 hover:text-white transition-colors px-3 py-1.5">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-medium px-4 py-2 transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─── Hero ─────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center pt-40 pb-28 px-6">
      <p className="animate-fade-in mb-5 flex items-center gap-1.5 font-mono text-[13px] text-neutral-500">
        <Sparkles size={11} className="text-emerald-400" />
        AI-powered interview prep
      </p>

      <h1
        className="animate-fade-up max-w-3xl text-5xl font-semibold tracking-heading leading-tight text-white sm:text-6xl"
        style={{ animationDelay: "80ms" }}
      >
        Crack your{" "}
        <span className="text-emerald-400">dream offer</span>
        <br />with a mentor that knows you
      </h1>

      <p
        className="animate-fade-up mt-6 max-w-xl text-lg text-neutral-400 leading-relaxed"
        style={{ animationDelay: "160ms" }}
      >
        Codeward combines curated DSA sheets, system design walkthroughs, and a
        RAG-powered AI mentor that adapts to your experience and target company.
      </p>

      <div
        className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-4"
        style={{ animationDelay: "240ms" }}
      >
        <Link
          href="/register"
          className="rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors"
        >
          Start for free
        </Link>
        <Link
          href="/login"
          className="rounded-xl border border-neutral-800 px-7 py-3.5 text-sm font-medium text-neutral-300 hover:border-neutral-600 hover:text-white transition-colors"
        >
          Sign in
        </Link>
      </div>

      <p className="animate-fade-up mt-5 font-mono text-xs text-neutral-500" style={{ animationDelay: "300ms" }}>
        No credit card required
      </p>
    </section>
  );
}

/* ─── Feature cards ─────────────────────────────────────────────────────── */
const features = [
  {
    icon: Code2,
    title: "DSA Tracker",
    description:
      "Work through Blind 75, Striver's sheet, or let the AI mentor build you a personalized pattern-focused sheet based on your target company and timeline.",
    badge: "Must Do + Variations",
  },
  {
    icon: Sparkles,
    title: "AI Mentor",
    description:
      "A RAG-powered assistant that actually understands your prep context — answers questions, explains patterns, reviews your approach, and helps you plan your sheet.",
    badge: "Always available",
  },
  {
    icon: Network,
    title: "System Design",
    description:
      "Curated system design questions organized by level (Easy / Medium / Hard) with must-do flags based on your experience. From URL shorteners to distributed databases.",
    badge: "Level-based",
  },
];

function Features() {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <SectionMarker n="01" label="Practice modes" center />
        <h2 className="text-center text-3xl font-semibold tracking-heading text-white mb-3">
          Everything you need to prep smarter
        </h2>
        <p className="text-center text-neutral-500 mb-12 max-w-xl mx-auto">
          Not another random question bank. Codeward is structured, trackable, and driven by an AI that knows where you stand.
        </p>

        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="animate-fade-up rounded-2xl border border-neutral-800 bg-white/3 p-6 hover:border-neutral-700 hover:bg-white/5 transition-all duration-200"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="mb-4 inline-flex rounded-xl p-2.5 bg-white/6">
                <f.icon size={20} className="text-neutral-200" />
              </div>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="font-semibold text-white">{f.title}</h3>
                <span className="rounded-full px-2 py-0.5 font-mono text-[10px] text-neutral-500 border border-neutral-800">
                  {f.badge}
                </span>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Mentor highlight ──────────────────────────────────────────────────── */
function MentorHighlight() {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-6xl rounded-2xl border border-neutral-800 bg-white/3 p-10">
        <div className="flex flex-col gap-10 md:flex-row md:items-center">
          <div className="flex-1">
            <SectionMarker n="02" label="The mentor" />
            <h2 className="text-3xl font-semibold tracking-heading text-white leading-tight mb-4">
              Your personal prep assistant,<br />
              <span className="text-emerald-400">not just a chatbot</span>
            </h2>
            <p className="text-neutral-400 leading-relaxed mb-6">
              The AI mentor is grounded in real prep content via retrieval-augmented generation.
              It explains patterns, reviews your approach, and can build a full personalized DSA
              sheet — just tell it your experience level and target company.
            </p>
            <ul className="space-y-2 text-sm text-neutral-300">
              {[
                "Answers DSA and system design questions with context",
                "Builds custom sheets based on your goals",
                "Embedded on every question page as a side panel",
                "Available on the dashboard at all times",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 text-emerald-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-1 max-w-sm rounded-xl border border-neutral-800 bg-black p-5 font-mono text-sm space-y-3">
            <div className="flex gap-2">
              <span className="text-neutral-500 shrink-0">you</span>
              <p className="text-neutral-300">I want to prep for Meta. I&apos;m decent at arrays but weak on trees and DP.</p>
            </div>
            <div className="h-px bg-neutral-800" />
            <div className="flex gap-2">
              <Sparkles size={12} className="text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-neutral-400">
                Got it. I&apos;ll build you a Meta-focused sheet starting with trees (10 must-dos),
                then DP (12 patterns), with arrays as warm-up. Want me to add system design too?
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ───────────────────────────────────────────────────────────────── */
const faqs = [
  {
    q: "Is Codeward actually free?",
    a: "Yes. It's a solo-built project, not a startup with a pricing page waiting to happen. No credit card, no trial timer, no locked features.",
  },
  {
    q: "What's in the DSA catalog?",
    a: "Preset sheets like Blind 75, Striver's SDE Sheet, and NeetCode 150, plus a bank of 300 curated problems tagged by company and pattern. You can build your own sheets or have the AI mentor generate one.",
  },
  {
    q: "How is the AI mentor different from just using ChatGPT?",
    a: "It's grounded in the app's prep content via retrieval, and it knows your context — your target company, experience level, and what you've already solved. It can also create sheets directly in your account instead of pasting a list back at you.",
  },
  {
    q: "Do I solve problems inside Codeward?",
    a: "No. Problems link out to LeetCode or GeeksforGeeks; Codeward is the layer on top — tracking status, revision flags, and notes so you always know what's next.",
  },
  {
    q: "Can it build a plan for my target company?",
    a: "Tell the mentor your company and timeline and it generates a pattern-focused sheet weighted toward what that company actually asks, with must-do problems flagged.",
  },
];

function FAQ() {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-2xl">
        <SectionMarker n="03" label="FAQ" />
        <h2 className="text-3xl font-semibold tracking-heading text-white mb-8">
          Questions worth answering honestly.
        </h2>
        <div className="divide-y divide-neutral-800">
          {faqs.map((f) => (
            <div key={f.q} className="py-5">
              <h3 className="text-sm font-medium text-white mb-1.5">{f.q}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-neutral-800 py-12 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <div>
            <span className="flex items-center gap-1.5 text-sm font-bold text-white">
              <Sparkles size={14} className="text-emerald-400" />
              Code<span className="text-emerald-400">ward</span>
            </span>
            <p className="mt-2 text-sm text-neutral-500 max-w-xs">
              Structured interview prep with a mentor that knows where you stand.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-neutral-400">
            <Link href="/login" className="hover:text-white transition-colors">Log in</Link>
            <Link href="/register" className="hover:text-white transition-colors">Sign up</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
        <p className="mt-10 font-mono text-xs text-neutral-500">Built to get you hired</p>
      </div>
    </footer>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="min-h-dvh bg-canvas text-neutral-100">
      <Navbar />
      <Hero />
      <Features />
      <MentorHighlight />
      <FAQ />
      <Footer />
    </div>
  );
}
