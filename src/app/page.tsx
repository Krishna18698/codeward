import Link from "next/link";
import { Sparkles } from "lucide-react";
import { DsaMockup, MentorMockup, CodeReviewMockup, DeepDiveMockup, BugHuntMockup, BuildItMockup, SystemDesignMockup } from "@/components/landing/Mockups";
import RotatingWord from "@/components/landing/RotatingWord";

/* ─── Section marker ────────────────────────────────────────────────────── */
function SectionMarker({ n, label, center }: { n: string; label: string; center?: boolean }) {
  return (
    <p className={`font-mono text-[13px] uppercase tracking-wide text-emerald-400 mb-4 ${center ? "text-center" : ""}`}>
      {n} — {label}
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
      <div className="animate-fade-in mb-6 inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/5 px-3 py-1.5 font-mono text-[8.5px] tracking-tight text-emerald-400 sm:px-4 sm:text-[12px] sm:tracking-normal">
        <span className="h-1.5 w-1.5 shrink-0 animate-dot-pulse rounded-full bg-emerald-400" />
        <span className="whitespace-nowrap">
          DSA &middot; System Design &middot; Code Review &middot; Bug Hunt &middot; Build It &middot; Deep Dives
        </span>
      </div>

      <h1
        className="animate-fade-up max-w-3xl text-5xl font-semibold tracking-heading leading-tight text-white sm:text-6xl"
        style={{ animationDelay: "80ms" }}
      >
        Get interview-ready at
        <br />
        <span className="text-emerald-400"><RotatingWord /></span>
      </h1>

      <p
        className="animate-fade-up mt-6 max-w-xl text-lg text-neutral-400 leading-relaxed"
        style={{ animationDelay: "160ms" }}
      >
        DSA sheets, system design, code review, live debugging, staged low-level
        design builds, deep dives on distributed systems, and an AI mentor that
        adapts to your experience and target company — seven ways to actually
        get ready, all free.
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

/* ─── Logo strip (marquee) ──────────────────────────────────────────────── */
// Logo marquee — real brand marks pulled from Google's favicon service (the same
// source the DSA problem rows already use), so no logo assets ship in the bundle.
const COMPANIES: { name: string; domain: string }[] = [
  { name: "Google", domain: "google.com" },
  { name: "Amazon", domain: "amazon.com" },
  { name: "Meta", domain: "meta.com" },
  { name: "Microsoft", domain: "microsoft.com" },
  { name: "Netflix", domain: "netflix.com" },
  { name: "Uber", domain: "uber.com" },
  { name: "Airbnb", domain: "airbnb.com" },
  { name: "Stripe", domain: "stripe.com" },
  { name: "Atlassian", domain: "atlassian.com" },
  { name: "LinkedIn", domain: "linkedin.com" },
  { name: "Flipkart", domain: "flipkart.com" },
  { name: "Swiggy", domain: "swiggy.com" },
];

function LogoStrip() {
  // Track is the list rendered twice; translating -50% lands on the identical copy → seamless.
  const track = [...COMPANIES, ...COMPANIES];
  return (
    <section className="py-10 px-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[12px] border border-neutral-800 bg-white/2">
        <div className="flex flex-col sm:flex-row sm:items-center">
          <p className="hidden shrink-0 px-5 font-mono text-[11px] uppercase tracking-widest text-neutral-500 sm:block sm:py-6">
            Problems asked in real interviews at
          </p>
          {/* fade the seam where the label meets the scroll */}
          <div
            className="relative min-w-0 flex-1 overflow-hidden py-6"
            style={{ maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)" }}
          >
            <div className="flex w-max animate-marquee items-center gap-9">
              {track.map((c, i) => (
                <span key={i} className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${c.domain}&sz=64`}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    decoding="async"
                    width={18}
                    height={18}
                    className="h-[18px] w-[18px] rounded-sm opacity-80"
                  />
                  <span className="text-sm font-semibold text-neutral-400">{c.name}</span>
                </span>
              ))}
            </div>
          </div>
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
    marker: "System Design",
    title: "Practice the design round, level by level",
    copy: "Curated system-design questions by difficulty and experience level (junior → senior), plus a challenge spinner that generates a fresh prompt — problem × scale × traffic spike × constraint — to design against.",
    cta: "Open system design →",
    href: "/register",
    Mockup: SystemDesignMockup,
  },
  {
    n: "04",
    marker: "Code Review",
    title: "Review realistic PRs with planted bugs",
    copy: "15 hand-authored diffs across payments, auth, caching, and infra — each with real bugs at graded severities. Leave inline comments; the AI scores what you caught against the ground-truth list, like a senior reviewer would.",
    cta: "Try a review →",
    href: "/register",
    Mockup: CodeReviewMockup,
  },
  {
    n: "05",
    marker: "Bug Hunt",
    title: "Diagnose the failure, not the symptom",
    copy: "9 broken codebases with failing tests and real logs — races, N+1s, leaks, deadlocks. Write your root-cause diagnosis; the AI grades it and reveals the canonical fix and the tempting wrong turns.",
    cta: "Start debugging →",
    href: "/register",
    Mockup: BugHuntMockup,
  },
  {
    n: "06",
    marker: "Build It",
    title: "Design it, then watch your own design break",
    copy: "5 real low-level-design problems — a thread-safe wallet, an inventory reservation service, a durable job queue, an idempotent payment processor, a notification service — each evolving across 4 stages as new constraints break your last approach, in C#, Python, or Kotlin. Stage 3 always makes you prove a correctness invariant holds under concurrency.",
    cta: "Start building →",
    href: "/register",
    Mockup: BuildItMockup,
  },
  {
    n: "07",
    marker: "Deep Dives",
    title: "Learn the trade-offs interviews actually probe",
    copy: "13 long-form deep dives — idempotency, caching, rate limiting, Kafka, Raft, consistent hashing, sagas, and more. Failure modes, trade-offs, and the interview traps surface-level guides skip.",
    cta: "Read the deep dives →",
    href: "/register",
    Mockup: DeepDiveMockup,
  },
];

function PracticeModes() {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-center font-mono text-[13px] uppercase tracking-wide text-emerald-400 mb-4">
          The Platform
        </p>
        <h2 className="text-center text-3xl font-semibold tracking-heading text-white mb-16">
          Seven ways to actually get ready
        </h2>

        <div className="space-y-20">
          {modes.map((m, i) => (
            <div key={m.n}>
              <div
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
              <div className="section-divider mt-20" />
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
    a: "Seven modes: DSA sheets (Blind 75, Striver's, NeetCode 150 + a 300-problem company-tagged bank), a RAG-powered AI mentor, System Design questions with a challenge spinner, 15 Code Review exercises with planted bugs and AI grading, 9 Bug Hunt debugging exercises, 5 staged Build It low-level-design problems in C#/Python/Kotlin, and 13 long-form Deep Dives on distributed systems. Everything is free.",
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
        <SectionMarker n="08" label="FAQ" />
        <h2 className="text-3xl font-semibold tracking-heading text-white mb-8">
          Questions worth answering honestly.
        </h2>
        <div className="divide-y divide-neutral-800">
          {faqs.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 select-none [&::-webkit-details-marker]:hidden">
                <span className="text-sm font-medium text-white leading-snug">{f.q}</span>
                <span className="w-[18px] shrink-0 text-center font-mono text-base text-neutral-600 transition-colors duration-150 group-open:text-emerald-400">
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">&minus;</span>
                </span>
              </summary>
              <p className="mt-3 text-sm text-neutral-400 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ────────────────────────────────────────────────────────────── */
const footerCols = [
  {
    heading: "Practice",
    links: [
      { label: "DSA Sheets", href: "/dashboard/dsa" },
      { label: "System Design", href: "/dashboard/system-design" },
      { label: "Code Review", href: "/dashboard/code-review" },
      { label: "Bug Hunt", href: "/dashboard/bug-hunt" },
      { label: "Build It", href: "/dashboard/build-it" },
      { label: "Deep Dives", href: "/dashboard/deep-dives" },
      { label: "AI Mentor", href: "/dashboard/mentor" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Sign up", href: "/register" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
];

function Footer() {
  return (
    <footer className="border-t border-neutral-800 py-14 px-6">
      <div className="mx-auto max-w-6xl grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr]">
        {/* Brand */}
        <div>
          <span className="flex items-center gap-1.5 text-sm font-bold text-white">
            <Sparkles size={14} className="text-emerald-400" />
            Code<span className="text-emerald-400">ward</span>
          </span>
          <p className="mt-3 text-sm text-neutral-500 max-w-xs leading-relaxed">
            Production-shaped interview prep — DSA, system design, code review, debugging, and a mentor that knows where you stand.
          </p>
          <p className="mt-4 font-mono text-xs text-neutral-600">© 2026 Codeward · Built to get you hired</p>
        </div>

        {/* Link columns */}
        {footerCols.map((col) => (
          <div key={col.heading}>
            <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 mb-3">{col.heading}</p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-neutral-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="min-h-dvh bg-canvas text-neutral-100">
      <Navbar />

      {/* Ambient emerald glow behind the hero + logo strip — on by default
          (matches the reference), brightens further on hover. */}
      <div className="group relative isolate">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[700px] opacity-60 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
          style={{ background: "radial-gradient(650px circle at 50% 0%, rgba(52,211,153,0.18), transparent 70%)" }}
        />
        <Hero />
        <LogoStrip />
      </div>

      <PracticeModes />
      <FAQ />
      <Footer />
    </div>
  );
}
