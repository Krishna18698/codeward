export type BugHuntFile = { name: string; code: string };

export type BugHuntExercise = {
  slug: string;
  title: string;
  brief: string;
  language: "TypeScript";
  minutes: number;
  files: BugHuntFile[];
  /** Failing test output the candidate sees. */
  testOutput: string;
  /** Optional log excerpt. */
  logs?: string;

  // ── Ground truth (never sent to client before grading) ──
  rootCause: string;
  category: "correctness" | "performance" | "concurrency" | "resource-leak";
  /** Tempting-but-wrong hypotheses, revealed after grading. */
  ruledOut: string[];
  canonicalFix: string;
};

/** Client-safe shape: no root cause, fix, or ruled-out hypotheses. */
export type BugHuntMeta = Pick<
  BugHuntExercise,
  "slug" | "title" | "brief" | "language" | "minutes" | "category"
> & {
  files?: BugHuntFile[];
  testOutput?: string;
  logs?: string;
  locked?: boolean;
};
