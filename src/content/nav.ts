import {
  Code2, Network, Sparkles, BookOpen, GitPullRequest, Bug, Blocks,
  type LucideIcon,
} from "lucide-react";

/** The dashboard's navigation items, in order.
 *
 *  Shared by the desktop rail (NavRail) and the mobile bar/hamburger (TopNav) —
 *  two components, one list, so a new mode can never appear in one and not the
 *  other. Home is the Codeward logo itself, so it isn't an item here.
 *
 *  Deliberately separate from PRACTICE_MODES in @/content/modes: that one drives
 *  the dashboard's practice grid and carries accent colours and marketing
 *  labels, which navigation has no use for. */
export type NavItem = { label: string; href: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { label: "DSA Sheets",    href: "/dashboard/dsa",           icon: Code2 },
  { label: "System Design", href: "/dashboard/system-design", icon: Network },
  { label: "Code Review",   href: "/dashboard/code-review",   icon: GitPullRequest },
  { label: "Bug Hunt",      href: "/dashboard/bug-hunt",      icon: Bug },
  { label: "Build It",      href: "/dashboard/build-it",      icon: Blocks },
  { label: "Deep Dives",    href: "/dashboard/deep-dives",    icon: BookOpen },
  { label: "AI Mentor",     href: "/dashboard/mentor",        icon: Sparkles },
];
