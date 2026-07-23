import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/landing/SiteNav";
import SiteFooter from "@/components/landing/SiteFooter";

export const metadata: Metadata = {
  title: "About — Codeward",
  description: "Why Codeward exists: interview prep shaped like the actual job, not a quiz bank.",
};

function SectionEyebrow({ n, label }: { n: string; label: string }) {
  return (
    <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-emerald-400">
      {n}
      <span className="mx-2 text-emerald-400/40">/</span>
      <span className="text-emerald-400/80">{label}</span>
    </p>
  );
}

const modeList = [
  ["DSA Sheets", "Blind 75, Striver’s, NeetCode 150, and a 300-problem company-tagged bank, grouped by pattern."],
  ["System Design", "Curated questions by level, plus a challenge spinner that generates a fresh prompt to design against."],
  ["Code Review", "Real PRs with planted bugs; leave inline comments and get graded like a senior reviewer would."],
  ["Bug Hunt", "Broken codebases with failing tests and logs; fix the code and diagnose the root cause."],
  ["Build It", "Staged low-level-design problems in C#, Python, and Kotlin, with real code execution."],
  ["Deep Dives", "Long-form articles on the distributed-systems trade-offs interviews actually probe."],
  ["AI Mentor", "Grounded in the prep content and aware of your progress, target company, and experience level."],
];

// Subtle band shade — alternates with plain black for a section-to-section cut.
const BAND = "bg-white/[0.02]";

export default function AboutPage() {
  return (
    <div className="relative min-h-dvh bg-canvas text-neutral-100">
      <SiteNav />

      {/* Dotted matrix behind the hero — dimmed, radial-masked so it fades out. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[680px]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(ellipse 65% 55% at 50% 32%, #000 20%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse 65% 55% at 50% 32%, #000 20%, transparent 72%)",
        }}
      />

      {/* Hero — centered */}
      <section className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 pt-36 pb-24 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/5 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-dot-pulse" />
          About
        </span>
        <h1 className="mt-8 text-5xl font-semibold tracking-heading leading-[1.05] text-white md:text-6xl">Codeward</h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-400">
          Interview prep that looks like the actual job — code review, debugging, low-level design, and the
          judgment rounds pattern-grinding skips.
        </p>
        <Link
          href="/register"
          className="mt-8 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-neutral-200"
        >
          Start for free →
        </Link>
      </section>

      {/* Numbered sections — full-width alternating bands, left-aligned content */}
      <div className="relative z-10">
        <section className={BAND}>
          <div className="mx-auto max-w-3xl px-6 py-20">
            <SectionEyebrow n="01" label="Why it exists" />
            <h2 className="text-3xl font-semibold tracking-heading leading-tight text-white md:text-4xl">
              Practice what the job actually tests.
            </h2>
            <div className="mt-6 max-w-2xl space-y-4 text-[15px] leading-7 text-neutral-400">
              <p>
                Grinding isolated algorithm problems teaches you to pass a specific kind of screen and little else.
                Real interviews — and the job that follows — ask you to reason about concurrency, catch a subtle bug
                in a diff, weigh trade-offs in a design, and explain <em className="text-neutral-300">why</em>.
              </p>
              <p>
                Codeward was built to practice those skills directly, with feedback that grades the mechanism, not
                just the answer.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-3xl px-6 py-20">
            <SectionEyebrow n="02" label="What's inside" />
            <h2 className="text-3xl font-semibold tracking-heading leading-tight text-white md:text-4xl">
              Seven modes, one focused platform.
            </h2>
            <div className="mt-8 max-w-2xl divide-y divide-neutral-800 border-y border-neutral-800">
              {modeList.map(([name, desc]) => (
                <div key={name} className="grid grid-cols-[9rem_1fr] gap-4 py-4 max-sm:grid-cols-1 max-sm:gap-1">
                  <span className="text-sm font-medium text-white">{name}</span>
                  <span className="text-[15px] leading-7 text-neutral-500">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={BAND}>
          <div className="mx-auto max-w-3xl px-6 py-20">
            <SectionEyebrow n="03" label="The principles" />
            <h2 className="text-3xl font-semibold tracking-heading leading-tight text-white md:text-4xl">
              Free, production-shaped, honestly graded.
            </h2>
            <div className="mt-6 max-w-2xl space-y-4 text-[15px] leading-7 text-neutral-400">
              <p>
                <strong className="font-semibold text-white">Everything is free.</strong> No locked modes, no trial
                timer, no credit card. It&rsquo;s a solo-built project, not a startup with a pricing page waiting to happen.
              </p>
              <p>
                <strong className="font-semibold text-white">Production-shaped.</strong> The exercises are drawn from
                the failures that actually happen in production — races, N+1s, double charges, lost updates — because
                that&rsquo;s what senior interviews test and what the job requires.
              </p>
              <p>
                <strong className="font-semibold text-white">Honest feedback.</strong> Grading rewards understanding
                the specific failure mode, not reciting keywords.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-3xl px-6 py-20">
            <SectionEyebrow n="04" label="Who it's for" />
            <h2 className="text-3xl font-semibold tracking-heading leading-tight text-white md:text-4xl">
              For engineers who learn by doing.
            </h2>
            <div className="mt-6 max-w-2xl space-y-4 text-[15px] leading-7 text-neutral-400">
              <p>
                Engineers preparing for backend, full-stack, and platform roles at product companies — from your first
                senior loop to leveling up. If you learn best by doing the real thing and getting told where your
                reasoning breaks, this is built for you.
              </p>
            </div>
            <div className="mt-10 flex max-w-2xl flex-wrap items-center gap-x-6 gap-y-2 border-t border-neutral-800 pt-6 text-sm">
              <Link href="/register" className="font-medium text-emerald-400 transition-colors hover:text-emerald-300">
                Start for free →
              </Link>
              <span className="text-neutral-500">
                Questions or feedback?{" "}
                <Link href="/contact" className="text-neutral-300 underline underline-offset-2 hover:text-white">
                  Talk to us →
                </Link>
              </span>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
