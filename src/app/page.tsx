import Link from "next/link";
import { Sparkles } from "lucide-react";
import { DsaMockup, MentorMockup, CodeReviewMockup, DeepDiveMockup } from "@/components/landing/Mockups";

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
        <span className="text-emerald-400 motion-safe:animate-pulse">_</span>
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

/* ─── Logo strip ────────────────────────────────────────────────────────── */
function LogoStrip() {
  const companies = ["Google", "Amazon", "Meta", "Microsoft", "Netflix", "Uber", "Airbnb", "Stripe"];
  return (
    <section className="py-10 px-6 border-y border-neutral-800/60">
      <div className="mx-auto max-w-6xl">
        <p className="text-center font-mono text-[11px] text-neutral-600 mb-5">
          Problems drawn from the companies you&apos;re targeting
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {companies.map((c) => (
            <span key={c} className="text-sm font-semibold text-neutral-500">{c}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Practice modes (alternating product mockups) ──────────────────────── */
const modes = [
  {
    n: "01",
    marker: "DSA Sheets",
    title: "Track every pattern, not just problem counts",
    copy: "Blind 75, Striver's, NeetCode 150, and a 300-problem company-tagged bank — grouped by pattern, with status, revision flags, and notes. Or let the mentor generate a sheet weighted for your target company.",
    cta: "Browse the sheets →",
    href: "/register",
    Mockup: DsaMockup,
  },
  {
    n: "02",
    marker: "AI Mentor",
    title: "A mentor that knows what you've already solved",
    copy: "RAG-grounded in real prep content and aware of your context — target company, experience level, progress. It explains patterns, reviews your approach, and creates sheets directly in your account.",
    cta: "Meet the mentor →",
    href: "/register",
    Mockup: MentorMockup,
  },
  {
    n: "03",
    marker: "Code Review",
    title: "Review realistic PRs with planted bugs",
    copy: "Hand-authored diffs across payments, auth, and caching — each with real bugs at graded severities. Write your review; the AI scores what you caught against the ground-truth list, like a senior reviewer would.",
    cta: "Try a review →",
    href: "/register",
    Mockup: CodeReviewMockup,
  },
  {
    n: "04",
    marker: "Deep Dives",
    title: "Learn the trade-offs interviews actually probe",
    copy: "Long-form deep dives on idempotency, caching, rate limiting, Kafka, consistent hashing, and more — failure modes, trade-offs, and the interview traps surface-level guides skip.",
    cta: "Read the deep dives →",
    href: "/register",
    Mockup: DeepDiveMockup,
  },
];

function PracticeModes() {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-6xl">
        <SectionMarker n="00" label="The platform" center />
        <h2 className="text-center text-3xl font-semibold tracking-heading text-white mb-16">
          Four ways to actually get ready
        </h2>

        <div className="space-y-20">
          {modes.map((m, i) => (
            <div
              key={m.n}
              className={`flex flex-col gap-8 md:items-center md:gap-12 ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"}`}
            >
              <div className="flex-1">
                <SectionMarker n={m.n} label={m.marker} />
                <h3 className="text-2xl font-semibold tracking-heading text-white leading-tight mb-3">{m.title}</h3>
                <p className="text-neutral-400 leading-relaxed mb-5 max-w-md">{m.copy}</p>
                <Link href={m.href} className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                  {m.cta}
                </Link>
              </div>
              <div className="flex-1 w-full min-w-0">
                <m.Mockup />
              </div>
            </div>
          ))}
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
    q: "What's actually on the platform?",
    a: "Four modes: DSA sheets (Blind 75, Striver's, NeetCode 150 + a 300-problem company-tagged bank), a RAG-powered AI mentor, Code Review exercises with planted bugs and AI grading, and long-form Deep Dives on distributed systems. Everything is free.",
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
        <SectionMarker n="05" label="FAQ" />
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
      <LogoStrip />
      <PracticeModes />
      <FAQ />
      <Footer />
    </div>
  );
}
