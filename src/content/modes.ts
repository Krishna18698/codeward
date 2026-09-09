import { Code2, Network, Sparkles, BookOpen, GitPullRequest, Bug, Blocks } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** The seven practice modes, in the order we recommend working through them.
 *  Extracted from an inline array in the dashboard so the next-step logic and
 *  the practice grid can't drift apart. `accent` alternates purely for looks. */
export type PracticeMode = {
  href: string;
  icon: LucideIcon;
  label: string;
  accent: "emerald" | "rose";
};

export const PRACTICE_MODES: PracticeMode[] = [
  { href: "/dashboard/dsa",           icon: Code2,          label: "DSA Sheets",    accent: "emerald" },
  { href: "/dashboard/system-design", icon: Network,        label: "System Design", accent: "rose" },
  { href: "/dashboard/code-review",   icon: GitPullRequest, label: "Code Review",   accent: "emerald" },
  { href: "/dashboard/bug-hunt",      icon: Bug,            label: "Bug Hunt",      accent: "rose" },
  { href: "/dashboard/build-it",      icon: Blocks,         label: "Build It",      accent: "emerald" },
  { href: "/dashboard/deep-dives",    icon: BookOpen,       label: "Deep Dives",    accent: "rose" },
  { href: "/dashboard/mentor",        icon: Sparkles,       label: "AI Mentor",     accent: "emerald" },
];
