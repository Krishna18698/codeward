import { CODE_REVIEWS_META } from "@/content/code-reviews";
import { BUG_HUNTS_META } from "@/content/bug-hunts";
import { BUILD_IT_META } from "@/content/build-it";
import { DEEP_DIVES } from "@/content/deep-dives";
import type { MethodStage } from "@/content/method";

/** What the dashboard knows about how far along someone is. */
export type Progress = {
  doneCount: number;
  reviewAttempts: number;
  bugHuntAttempts: number;
  buildItAttempts: number;
  reviseCount: number;
  blind75SheetId?: string;
};

export type NextStep = {
  /** Which stage of the stated method this action belongs to. Lets the method
   *  strip highlight where the user actually is instead of being static copy. */
  stage: MethodStage;
  /** Small mono eyebrow — names the stage, not the mode. */
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
};

/** Codeward has seven modes and no stated order, which leaves a new user with
 *  no idea what to do first. Rather than a fixed curriculum, this surfaces the
 *  ONE next action based on what they've actually done. First match wins, so
 *  the order of these branches IS the recommended progression.
 *
 *  Pure and dependency-free on purpose — everything it needs is passed in. */
export function pickNextStep(p: Progress): NextStep {
  if (p.doneCount === 0) {
    return {
      stage: "RECOGNISE",
      eyebrow: "Start here",
      title: "Begin with Blind 75.",
      body: "75 problems covering every pattern that matters. Get through these before touching anything else.",
      href: p.blind75SheetId ? `/dashboard/dsa?sheet=${p.blind75SheetId}` : "/dashboard/dsa",
      cta: "Open Blind 75",
    };
  }

  if (p.doneCount < 25) {
    return {
      stage: "PRACTISE",
      eyebrow: "Keep going",
      title: `${p.doneCount} down — build the base first.`,
      body: "Patterns only click once you've seen each of them a few times. Push to 25 before branching out.",
      href: p.blind75SheetId ? `/dashboard/dsa?sheet=${p.blind75SheetId}` : "/dashboard/dsa",
      cta: "Continue solving",
    };
  }

  if (p.reviewAttempts === 0) {
    return {
      stage: "PRACTISE",
      eyebrow: "Next up",
      title: "Now read code you didn't write.",
      body: `You've got the base. Senior loops test review, not just solving — ${CODE_REVIEWS_META.length} PRs with planted bugs, graded against the real bug list.`,
      href: `/dashboard/code-review/${CODE_REVIEWS_META[0]?.slug ?? ""}`,
      cta: "Try your first review",
    };
  }

  if (p.bugHuntAttempts === 0) {
    return {
      stage: "PRACTISE",
      eyebrow: "Next up",
      title: "Debug something broken.",
      body: `Failing tests and real logs. Find the root cause, not the symptom — ${BUG_HUNTS_META.length} to work through.`,
      href: `/dashboard/bug-hunt/${BUG_HUNTS_META[0]?.slug ?? ""}`,
      cta: "Start a bug hunt",
    };
  }

  if (p.buildItAttempts === 0) {
    return {
      stage: "PRACTISE",
      eyebrow: "Next up",
      title: "Design something that survives a constraint.",
      body: "Four stages, each adding a constraint that breaks your last design. Stage 3 is where the concurrency invariant bites.",
      href: `/dashboard/build-it/${BUILD_IT_META[0]?.slug ?? ""}`,
      cta: "Open Build It",
    };
  }

  if (p.reviseCount > 0) {
    return {
      stage: "REVISE",
      eyebrow: "Close the loop",
      title: `${p.reviseCount} problem${p.reviseCount === 1 ? "" : "s"} flagged to revise.`,
      body: "Spaced repetition is what makes patterns stick. Clear the queue before adding new problems.",
      href: "/dashboard/dsa",
      cta: "Review flagged",
    };
  }

  return {
    stage: "RECOGNISE",
    eyebrow: "Go deeper",
    title: "Read the theory behind the loops.",
    body: `${DEEP_DIVES.length} long-form deep dives on the distributed-systems topics senior interviews circle back to.`,
    href: `/dashboard/deep-dives/${DEEP_DIVES[0]?.slug ?? ""}`,
    cta: "Open deep dives",
  };
}
