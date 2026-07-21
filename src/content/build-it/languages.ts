/** Split out from types.ts so client components can import the language list
 *  without pulling in the ground-truth content graph (rubric/canonicalApproach/
 *  commonPitfalls) that index.ts assembles at module scope. */
export type BuildItLanguage = "csharp" | "python" | "kotlin";

export const BUILD_IT_LANGUAGES: { value: BuildItLanguage; label: string }[] = [
  { value: "csharp", label: "C#" },
  { value: "python", label: "Python" },
  { value: "kotlin", label: "Kotlin" },
];

/** A test harness must print this exact token on stdout iff every assertion
 *  passes. The runner checks for it to decide pass/fail (a thrown exception or
 *  compile error prints a stack trace without the token → fail). */
export const BUILD_IT_PASS_SENTINEL = "__BUILD_IT_PASS__";

/** Maps a BuildItLanguage → the /api/code/run execution language id. */
export const BUILD_IT_EXEC_LANG: Record<BuildItLanguage, "csharp" | "python" | "kotlin"> = {
  csharp: "csharp",
  python: "python",
  kotlin: "kotlin",
};
