import Link from "next/link";
import { DsaMockup, MentorMockup, CodeReviewMockup, DeepDiveMockup, BugHuntMockup, BuildItMockup, SystemDesignMockup } from "@/components/landing/Mockups";
import RotatingWord from "@/components/landing/RotatingWord";
import { CompanyLogo, CompanyLogoSprite } from "@/components/ui/CompanyLogo";
import SiteNav from "@/components/landing/SiteNav";
import SiteFooter from "@/components/landing/SiteFooter";
import HeroGlow from "@/components/landing/HeroGlow";
import HeroShowcase from "@/components/landing/HeroShowcase";
import { METHOD } from "@/content/method";
import { RecogniseFragment, PractiseFragment, ReviseFragment } from "@/components/landing/MethodFragments";

/* ─── Section marker ────────────────────────────────────────────────────── */
function SectionMarker({ n, label, center }: { n: string; label: string; center?: boolean }) {
  return (
    <p className={`font-mono text-[13px] uppercase tracking-wide text-accent mb-4 ${center ? "text-center" : ""}`}>
      {n} — {label}
    </p>
  );
}

/* ─── Hero ─────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center pt-40 pb-28 px-6">
      <div className="animate-fade-in mb-6 inline-flex max-w-full items-center gap-1 rounded-full border border-accent/25 bg-accent/5 px-2.5 py-1.5 font-mono text-[8px] tracking-tight text-accent sm:gap-1.5 sm:px-4 sm:text-[12px] sm:tracking-normal">
        <span className="h-1.5 w-1.5 shrink-0 animate-dot-pulse rounded-full bg-accent-hover" />
        <span className="whitespace-nowrap">
          DSA &middot; System Design &middot; Code Review &middot; Bug Hunt &middot; Build It &middot; Deep Dives
        </span>
      </div>

      {/* Each line rises from behind its own mask rather than fading up as one
          block — the two-beat entrance reads more editorial, and it's still a
          plain transform, so it composites. */}
      <h1 className="max-w-3xl text-3xl font-semibold tracking-heading leading-tight text-primary sm:text-5xl md:text-6xl">
        <span className="rise-mask">
          <span className="animate-rise-in" style={{ animationDelay: "80ms" }}>Master</span>
        </span>
        <span className="rise-mask text-accent">
          <span className="animate-rise-in" style={{ animationDelay: "180ms" }}><RotatingWord /></span>
        </span>
      </h1>

      <p
        className="animate-fade-up mt-6 max-w-xl text-lg text-secondary leading-relaxed"
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
          className="rounded-xl bg-accent-fill px-7 py-3.5 text-sm font-semibold text-black hover:bg-accent-hover transition-colors"
        >
          Start for free
        </Link>
        <Link
          href="/login"
          className="rounded-xl border border-border px-7 py-3.5 text-sm font-medium text-secondary hover:border-border hover:text-primary transition-colors"
        >
          Sign in
        </Link>
      </div>

      <p className="animate-fade-up mt-5 font-mono text-xs text-muted" style={{ animationDelay: "300ms" }}>
        No credit card required
      </p>
    </section>
  );
}

/* ─── Logo strip (marquee) ──────────────────────────────────────────────── */
// Logo marquee — brand marks inlined from CompanyLogo (the same source the DSA
// problem rows use). Previously these were hotlinked from Google's favicon
// service, which cost 11 third-party requests on this page alone.
const COMPANIES: { name: string }[] = [
  { name: "Google" },
  { name: "Amazon" },
  { name: "Meta" },
  { name: "Microsoft" },
  { name: "Netflix" },
  { name: "Uber" },
  { name: "Airbnb" },
  { name: "Stripe" },
  { name: "Atlassian" },
  { name: "LinkedIn" },
  { name: "Flipkart" },
  { name: "Swiggy" },
];

function LogoStrip() {
  // Track is the list rendered twice; translating -50% lands on the identical copy → seamless.
  const track = [...COMPANIES, ...COMPANIES];
  return (
    <section className="py-10 px-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[12px] border border-border bg-surface">
        <div className="flex flex-col sm:flex-row sm:items-center">
          <p className="hidden shrink-0 px-5 font-mono text-[11px] uppercase tracking-widest text-muted sm:block sm:py-6">
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
                  <span aria-hidden className="inline-flex opacity-80">
                    <CompanyLogo name={c.name} size={18} />
                  </span>
                  <span className="text-sm font-semibold text-secondary">{c.name}</span>
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
    copy: "Blind 75, Striver's, NeetCode 150, and a 500-problem company-tagged bank — grouped by pattern, with status, revision flags, and notes. Or let the mentor generate a sheet weighted for your target company.",
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
        <p className="text-center font-mono text-[13px] uppercase tracking-wide text-accent mb-4">
          The Platform
        </p>
        <h2 className="text-center text-3xl font-semibold tracking-heading text-primary mb-16">
          Seven ways to actually get ready
        </h2>

        <div className="section-divider mb-20" />

        <div className="space-y-20">
          {modes.map((m, i) => (
            <div key={m.n}>
              <div
                className={`flex flex-col gap-8 md:items-center md:gap-12 ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"}`}
              >
                <div className="flex-1">
                  <SectionMarker n={m.n} label={m.marker} />
                  <h3 className="text-2xl font-semibold tracking-heading text-primary leading-tight mb-3">{m.title}</h3>
                  <p className="text-secondary leading-relaxed mb-5 max-w-md">{m.copy}</p>
                  <Link href={m.href} className="text-sm font-medium text-accent hover:text-accent-hover transition-colors">
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
    a: "Seven modes: DSA sheets (Blind 75, Striver's, NeetCode 150 + a 500-problem company-tagged bank), a RAG-powered AI mentor, System Design questions with a challenge spinner, 15 Code Review exercises with planted bugs and AI grading, 9 Bug Hunt debugging exercises, 11 staged Build It low-level-design problems in C#/Python/Kotlin, and 13 long-form Deep Dives on distributed systems. Everything is free.",
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
        <h2 className="text-3xl font-semibold tracking-heading text-primary mb-8">
          Questions worth answering honestly.
        </h2>
        <div className="divide-y divide-border">
          {faqs.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 select-none [&::-webkit-details-marker]:hidden">
                <span className="text-sm font-medium text-primary leading-snug">{f.q}</span>
                <span className="w-[18px] shrink-0 text-center font-mono text-base text-muted transition-colors duration-150 group-open:text-accent">
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">&minus;</span>
                </span>
              </summary>
              <p className="mt-3 text-sm text-secondary leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}



/* ─── The method ────────────────────────────────────────────────────────────
   Seven modes with no stated order left a new user guessing. The dashboard's
   next-step card answers "what now?"; this answers "what is the shape of the
   whole thing?" — with real product surfaces rather than three icons.

   Stage copy comes from @/content/method, the same source the in-app method
   strip reads, so the landing page and the product cannot drift apart. */
const METHOD_FRAGMENTS = [RecogniseFragment, PractiseFragment, ReviseFragment];

const METHOD_HEADLINES = [
  "Learn the pattern, not the problem.",
  "Work the sequence in order.",
  "Revise what you actually got wrong.",
];

function Method() {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-center font-mono text-[13px] uppercase tracking-wide text-accent mb-4">
          How it works
        </p>
        <h2 className="text-center text-3xl font-semibold tracking-heading text-primary mb-4">
          Three habits, <span className="text-accent">repeated</span>
        </h2>
        <p className="mx-auto mb-16 max-w-xl text-center text-secondary leading-relaxed">
          There is no trick to this. Every mode on the platform exists to make one of
          these three habits easier to keep.
        </p>

        <div className="section-divider mb-20" />

        <div className="space-y-20">
          {METHOD.map((stage, i) => {
            const Fragment = METHOD_FRAGMENTS[i];
            return (
              <div key={stage.id}>
                <div
                  className={`flex flex-col gap-8 md:items-center md:gap-12 ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"}`}
                >
                  <div className="flex-1">
                    <SectionMarker n={`${i + 1}.0`} label={stage.label} />
                    <h3 className="mb-3 text-2xl font-semibold leading-tight tracking-heading text-primary">
                      {METHOD_HEADLINES[i]}
                    </h3>
                    <p className="max-w-md leading-relaxed text-secondary">{stage.blurb}</p>
                  </div>
                  <div className="w-full min-w-0 flex-1">
                    <Fragment />
                  </div>
                </div>
                {i < METHOD.length - 1 && <div className="section-divider mt-20" />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="min-h-dvh bg-canvas text-primary">
      <CompanyLogoSprite />
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

      <PracticeModes />
      <Method />
      <FAQ />
      <SiteFooter />
    </div>
  );
}
