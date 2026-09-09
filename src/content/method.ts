/** Codeward's stated method.
 *
 *  Seven modes and a next-step card answer "what do I do now?", but neither
 *  says what the modes are FOR. This is the spine: three stages that every
 *  mode belongs to, so the order isn't just implied by the recommendation
 *  engine — it's written down where the user can read it.
 *
 *  Kept as content, not copy buried in a component, because the same three
 *  stages are referenced by `pickNextStep` in `@/lib/nextStep`. */

export type MethodStage = "RECOGNISE" | "PRACTISE" | "REVISE";

export type MethodStep = {
  id: MethodStage;
  label: string;
  /** One line, shown when this stage is the active one. */
  blurb: string;
};

export const METHOD: MethodStep[] = [
  {
    id: "RECOGNISE",
    label: "Recognise",
    blurb: "Learn to name the pattern before you write a line of code.",
  },
  {
    id: "PRACTISE",
    label: "Practise",
    blurb: "Solve, review, debug and build until the pattern is automatic.",
  },
  {
    id: "REVISE",
    label: "Revise",
    blurb: "Return to what you flagged, so it survives the interview.",
  },
];

export const methodIndex = (stage: MethodStage) => METHOD.findIndex((m) => m.id === stage);
