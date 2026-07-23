import Link from "next/link";
import RotatingWord from "@/components/landing/RotatingWord";
import SiteNav from "@/components/landing/SiteNav";
import SiteFooter from "@/components/landing/SiteFooter";
import HeroGlow from "@/components/landing/HeroGlow";
import HeroShowcase from "@/components/landing/HeroShowcase";
import ModesShowcase from "@/components/landing/ModesShowcase";

/* ─── Section marker ────────────────────────────────────────────────────── */
function SectionMarker({ n, label, center }: { n?: string; label: string; center?: boolean }) {
  return (
    <p className={`font-mono text-[13px] uppercase tracking-wide text-emerald-400 mb-4 ${center ? "text-center" : ""}`}>
      {n ? `${n} — ${label}` : label}
    </p>
  );
}

/* ─── Hero ─────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center pt-40 pb-28 px-6">
      <div className="animate-fade-in mb-6 inline-flex max-w-full items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/5 px-2.5 py-1.5 font-mono text-[8px] tracking-tight text-emerald-400 sm:gap-1.5 sm:px-4 sm:text-[12px] sm:tracking-normal">
        <span className="h-1.5 w-1.5 shrink-0 animate-dot-pulse rounded-full bg-emerald-400" />
        <span className="whitespace-nowrap">
          DSA &middot; System Design &middot; Code Review &middot; Bug Hunt &middot; Build It &middot; Deep Dives
        </span>
      </div>

      <h1
        className="animate-fade-up max-w-3xl text-3xl font-semibold tracking-heading leading-tight text-white sm:text-5xl md:text-6xl"
        style={{ animationDelay: "80ms" }}
      >
        Master
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

/* ─── Proof band ────────────────────────────────────────────────────────── */
// One glanceable row of stats — compresses "this is substantial" into a line,
// instead of implying scale across seven full-width cards.
const PROOF: { num: string; label: string }[] = [
  { num: "300+", label: "DSA problems" },
  { num: "15", label: "Code reviews" },
  { num: "9", label: "Bug hunts" },
  { num: "5", label: "Build-it problems" },
  { num: "13", label: "Deep dives" },
  { num: "Free", label: "Every mode" },
];

function ProofBand() {
  return (
    <section className="px-6 py-6">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-5 rounded-[12px] border border-neutral-800 bg-white/2 px-6 py-6">
        {PROOF.map((s) => (
          <div key={s.label} className="flex flex-col items-center text-center">
            <span className="font-mono text-xl font-semibold text-emerald-400">{s.num}</span>
            <span className="mt-0.5 text-[11px] uppercase tracking-wide text-neutral-500">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Build It spotlight ────────────────────────────────────────────────── */
// The one thing nobody else in this space does: your submission actually runs.
function BuildSpotlight() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-sm border border-emerald-500/20 bg-emerald-500/[0.04]">
        <div className="grid items-center gap-8 p-8 md:grid-cols-2 md:gap-12 md:p-12">
          <div>
            <SectionMarker label="Run real code" />
            <h2 className="text-3xl font-semibold tracking-heading leading-tight text-white">
              Write real code. Run it against real tests.
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-neutral-400">
              Build It isn&rsquo;t a prose exercise. You write C#, Python, or Kotlin in a real editor and
              execute it against a hidden test harness in a sandbox — pass/fail, stdout, and stderr, right in
              the workspace. Design reasoning is still AI-graded; correctness is proven by running it.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-block rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-400"
            >
              Start building →
            </Link>
          </div>

          {/* mini terminal — illustrative test run */}
          <div className="overflow-hidden rounded-sm border border-neutral-800 bg-black">
            <div className="flex items-center gap-2 border-b border-neutral-800 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" aria-hidden />
              <span className="ml-1 font-mono text-[10px] text-neutral-500">run · thread-safe-wallet</span>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-6 text-neutral-300">
{`$ run tests · kotlin
✓ basic deposit / withdraw
✓ atomic transfer between wallets
✓ balance never goes negative
✓ 50 concurrent transfers — no lost update
`}<span className="text-emerald-400">{`PASSED · 4/4 · 0.42s`}</span>{`
`}<span className="text-neutral-600">{`17 runs left today`}</span>
            </pre>
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
        <SectionMarker label="FAQ" />
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


/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="min-h-dvh bg-canvas text-neutral-100">
      <SiteNav />

      {/* Permanent top glow + a smaller cursor-following glow — scoped to the
          hero only, so it ends at the divider above the logo strip. */}
      <HeroGlow topGlow>
        <Hero />
      </HeroGlow>

      <HeroShowcase />

      <div className="mx-auto max-w-6xl px-6">
        <div className="section-divider" />
      </div>
      <LogoStrip />
      <ProofBand />

      <div className="mx-auto max-w-5xl px-6">
        <div className="section-divider" />
      </div>
      <ModesShowcase />

      <div className="mx-auto max-w-5xl px-6">
        <div className="section-divider" />
      </div>
      <BuildSpotlight />

      <FAQ />
      <SiteFooter />
    </div>
  );
}
