export type { BuildItLanguage } from "./languages";
import type { BuildItLanguage } from "./languages";

export type BuildItSkeleton = { fileName: string; code: string };

/** One gradable criterion for a stage. Mirrors the planted-bug shape used by
 *  Code Review (id + weight + description) so the grading route can score
 *  every stage the same way: weighted-average of criteria the model marks met. */
export type BuildItRubricCriterion = {
  id: string;
  description: string;
  weight: number;
};

export type BuildItStage = {
  stage: 1 | 2 | 3 | 4;
  title: string;
  /** One line: the new constraint this stage adds that breaks the last stage's design. */
  constraintAdded: string;
  /** The scenario/story behind the break — why the previous stage's design fails now. */
  narrative: string;
  /** The exact task instructions shown above the submission form. */
  prompt: string;
  /** Populated only on the make-or-break correctness stage (stage 3, by content
   *  convention — not hardcoded by the type). When present, the workspace pins
   *  it and grading requires the explanation to argue it holds. */
  invariant?: string;
  /** Per-language starter skeleton — the only thing that varies by language.
   *  Everything else on a stage is shared across all three languages. */
  skeletons: Record<BuildItLanguage, BuildItSkeleton>;

  // ── Ground truth — never sent to the client before grading ──
  rubric: BuildItRubricCriterion[];
  canonicalApproach: string;
  /** Tempting-but-wrong approaches, revealed after grading. */
  commonPitfalls: string[];
};

export type BuildItProblem = {
  slug: string;
  title: string;
  category: "concurrency" | "distributed" | "payments" | "api";
  brief: string;
  totalMinutes: number;
  stages: BuildItStage[];
};

/** Client-safe stage: strips rubric/canonicalApproach/commonPitfalls. */
export type BuildItStageMeta = Omit<BuildItStage, "rubric" | "canonicalApproach" | "commonPitfalls">;

/** Client-safe problem. */
export type BuildItProblemMeta = Omit<BuildItProblem, "stages"> & {
  stages: BuildItStageMeta[];
};
