import type { Metadata } from "next";
import Link from "next/link";
import MarketingPage, { MarketingSection } from "@/components/landing/MarketingPage";

export const metadata: Metadata = {
  title: "About — Codeward",
  description: "Why Codeward exists: interview prep shaped like the actual job, not a quiz bank.",
};

export default function AboutPage() {
  return (
    <MarketingPage
      eyebrow="About"
      title="Interview prep that looks like the actual job."
      intro="Most prep tools drill puzzles in a vacuum. Codeward practices the things you're really evaluated on — reading code, finding the bug, designing under constraints, and defending your reasoning."
    >
      <MarketingSection title="Why it exists">
        <p>
          Grinding isolated algorithm problems teaches you to pass a specific kind of screen and little else.
          Real interviews — and the job that follows — ask you to reason about concurrency, catch a subtle bug
          in a diff, weigh trade-offs in a design, and explain <em>why</em>. Codeward was built to practice those
          skills directly, with feedback that grades the mechanism, not just the answer.
        </p>
      </MarketingSection>

      <MarketingSection title="What's inside">
        <p>Seven modes, each targeting a different muscle:</p>
        <ul className="list-disc ml-5 space-y-1.5 text-neutral-300">
          <li><strong className="text-white">DSA Sheets</strong> — Blind 75, Striver&rsquo;s, NeetCode 150, and a 300-problem company-tagged bank, grouped by pattern with progress, revision flags, and notes.</li>
          <li><strong className="text-white">System Design</strong> — curated questions by level, plus a challenge spinner that generates a fresh prompt to design against.</li>
          <li><strong className="text-white">Code Review</strong> — real PRs with planted bugs; leave inline comments and get graded like a senior reviewer would.</li>
          <li><strong className="text-white">Bug Hunt</strong> — broken codebases with failing tests and logs; fix the code and diagnose the root cause.</li>
          <li><strong className="text-white">Build It</strong> — staged low-level-design problems in C#, Python, and Kotlin, with real code execution and a correctness invariant to prove.</li>
          <li><strong className="text-white">Deep Dives</strong> — long-form articles on the distributed-systems trade-offs interviews actually probe.</li>
          <li><strong className="text-white">AI Mentor</strong> — grounded in the prep content and aware of your progress, target company, and experience level.</li>
        </ul>
      </MarketingSection>

      <MarketingSection title="The principles">
        <p>
          <strong className="text-white">Everything is free.</strong> No locked modes, no trial timer, no credit card.
          It&rsquo;s a solo-built project, not a startup with a pricing page waiting to happen.
        </p>
        <p>
          <strong className="text-white">Production-shaped.</strong> The exercises are drawn from the kinds of failures
          that actually happen in production — races, N+1s, double charges, lost updates — because that&rsquo;s what
          senior interviews test and what the job requires.
        </p>
        <p>
          <strong className="text-white">Honest feedback.</strong> Grading rewards understanding the specific failure
          mode, not reciting keywords.
        </p>
      </MarketingSection>

      <MarketingSection title="Who it's for">
        <p>
          Engineers preparing for backend, full-stack, and platform roles at product companies — from your first
          senior loop to leveling up. If you learn best by doing the real thing and getting told where your
          reasoning breaks, this is built for you.
        </p>
        <p className="pt-2">
          <Link href="/register" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
            Start for free →
          </Link>
        </p>
      </MarketingSection>
    </MarketingPage>
  );
}
