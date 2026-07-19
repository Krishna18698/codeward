export type PlantedBug = {
  id: string;
  /** 1 (nit) – 5 (ship-blocking) */
  severity: 1 | 2 | 3 | 4 | 5;
  category: "correctness" | "security" | "performance" | "api-design" | "observability";
  description: string;
};

export type ExerciseFile = {
  name: string;
  code: string;
};

export type CodeReviewExercise = {
  slug: string;
  title: string;
  brief: string;
  language: "TypeScript";
  minutes: number;
  files: ExerciseFile[];
  /** Ground truth — must NEVER be sent to the client before grading. */
  bugs: PlantedBug[];
};

/** Client-safe shape: everything except the planted bug list. */
export type ExerciseMeta = Omit<CodeReviewExercise, "bugs"> & {
  bugCount: number;
};
