/** Split out from types.ts so client components can import the language list
 *  without pulling in the ground-truth content graph (rubric/canonicalApproach/
 *  commonPitfalls) that index.ts assembles at module scope. */
export type BuildItLanguage = "csharp" | "python" | "kotlin";

export const BUILD_IT_LANGUAGES: { value: BuildItLanguage; label: string }[] = [
  { value: "csharp", label: "C#" },
  { value: "python", label: "Python" },
  { value: "kotlin", label: "Kotlin" },
];
