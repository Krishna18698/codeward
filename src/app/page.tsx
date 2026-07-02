import Link from "next/link";
import { Sparkles, Code2, Network, CheckCircle2 } from "lucide-react";

/* ─── Navbar ──────────────────────────────────────────────────────────── */
function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-800/60 bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-white">
          <Sparkles size={16} className="text-sky-400" />
          Code<span className="text-sky-400">ward</span>
        </span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium px-4 py-2 transition-all shadow-[0_0_16px_rgba(14,165,233,0.35)]"
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
    <section className="relative flex flex-col items-center justify-center text-center pt-40 pb-28 px-6 overflow-hidden">
      {/* CSS radial gradients — lighter than blur blobs */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(14,165,233,0.12) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 20% 60%, rgba(139,92,246,0.08) 0%, transparent 60%)",
        }}
      />

      <span className="animate-fade-in mb-4 inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1 text-xs font-medium text-sky-400 uppercase tracking-widest">
        <Sparkles size={11} />
        AI-powered interview prep
      </span>

      <h1
        className="animate-fade-up max-w-3xl text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl"
        style={{ animationDelay: "80ms" }}
      >
        Crack your{" "}
        <span className="bg-linear-to-r from-sky-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
          dream offer
        </span>
        <br />with a mentor that knows you
      </h1>

      <p
        className="animate-fade-up mt-6 max-w-xl text-lg text-slate-400 leading-relaxed"
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
          className="rounded-xl bg-linear-to-r from-sky-500 via-indigo-500 to-violet-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_28px_rgba(56,189,248,0.4)] hover:brightness-110 transition-all"
        >
          Start for free
        </Link>
        <Link
          href="/login"
          className="rounded-xl border border-slate-700 px-7 py-3.5 text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
        >
          Sign in
        </Link>
      </div>

      <p className="animate-fade-up mt-5 text-xs text-slate-600" style={{ animationDelay: "300ms" }}>
        No credit card required
      </p>
    </section>
  );
}

/* ─── Feature cards ─────────────────────────────────────────────────────── */
const features = [
  {
    icon: Code2,
    iconColor: "text-sky-400",
    iconBg: "bg-sky-500/10",
    title: "DSA Tracker",
    description:
      "Work through Blind 75, Striver's sheet, or let the AI mentor build you a personalized pattern-focused sheet based on your target company and timeline.",
    badge: "Must Do + Variations",
  },
  {
    icon: Sparkles,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10",
    title: "AI Mentor",
    description:
      "A RAG-powered assistant that actually understands your prep context — answers questions, explains patterns, reviews your approach, and helps you plan your sheet.",
    badge: "Always available",
  },
  {
    icon: Network,
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10",
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
        <h2 className="text-center text-3xl font-bold text-white mb-3">
          Everything you need to prep smarter
        </h2>
        <p className="text-center text-slate-500 mb-12 max-w-xl mx-auto">
          Not another random question bank. Codeward is structured, trackable, and driven by an AI that knows where you stand.
        </p>

        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="animate-fade-up rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:border-sky-500/30 hover:bg-slate-900/80 transition-all duration-200"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`mb-4 inline-flex rounded-xl p-2.5 ${f.iconBg}`}>
                <f.icon size={20} className={f.iconColor} />
              </div>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="font-semibold text-white">{f.title}</h3>
                <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-400 border border-sky-500/20">
                  {f.badge}
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
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
      <div className="mx-auto max-w-6xl rounded-2xl border border-sky-500/20 bg-linear-to-br from-sky-950/40 via-slate-900/60 to-violet-950/30 p-10 shadow-[0_0_60px_rgba(56,189,248,0.07)]">
        <div className="flex flex-col gap-10 md:flex-row md:items-center">
          <div className="flex-1">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 px-3 py-1 text-xs font-medium text-sky-400 uppercase tracking-widest">
              <Sparkles size={11} /> RAG AI Mentor
            </span>
            <h2 className="text-3xl font-bold text-white leading-tight mb-4">
              Your personal prep assistant,<br />
              <span className="text-sky-400">not just a chatbot</span>
            </h2>
            <p className="text-slate-400 leading-relaxed mb-6">
              The AI mentor is grounded in real prep content via retrieval-augmented generation.
              It explains patterns, reviews your approach, and can build a full personalized DSA
              sheet — just tell it your experience level and target company.
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              {[
                "Answers DSA and system design questions with context",
                "Builds custom sheets based on your goals",
                "Embedded on every question page as a side panel",
                "Available on the dashboard at all times",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 text-sky-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-1 max-w-sm rounded-xl border border-slate-700/60 bg-slate-900/80 p-5 font-mono text-sm space-y-3 backdrop-blur">
            <div className="flex gap-2">
              <span className="text-slate-500 shrink-0">you</span>
              <p className="text-slate-300">I want to prep for Meta. I&apos;m decent at arrays but weak on trees and DP.</p>
            </div>
            <div className="h-px bg-slate-800" />
            <div className="flex gap-2">
              <Sparkles size={12} className="text-sky-400 mt-0.5 shrink-0" />
              <p className="text-slate-400">
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

/* ─── Footer ────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-slate-800/60 py-10 px-6">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-sm font-bold text-white">
          <Sparkles size={14} className="text-sky-400" />
          Code<span className="text-sky-400">ward</span>
        </span>
        <div className="flex items-center gap-6 text-xs text-slate-600">
          <span>Built to get you hired</span>
          <Link href="/login" className="hover:text-slate-400 transition-colors">Log in</Link>
          <Link href="/register" className="hover:text-slate-400 transition-colors">Sign up</Link>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="min-h-dvh bg-canvas text-slate-100">
      <Navbar />
      <Hero />
      <Features />
      <MentorHighlight />
      <Footer />
    </div>
  );
}
