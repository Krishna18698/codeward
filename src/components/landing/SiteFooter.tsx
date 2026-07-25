import Link from "next/link";
import { Sparkles } from "lucide-react";

const footerCols = [
  {
    heading: "Practice",
    links: [
      { label: "DSA Sheets", href: "/dashboard/dsa" },
      { label: "System Design", href: "/dashboard/system-design" },
      { label: "Code Review", href: "/dashboard/code-review" },
      { label: "Bug Hunt", href: "/dashboard/bug-hunt" },
      { label: "Build It", href: "/dashboard/build-it" },
      { label: "Deep Dives", href: "/dashboard/deep-dives" },
      { label: "AI Mentor", href: "/dashboard/mentor" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Sign up", href: "/register" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
];

/** Marketing footer — shared by the landing page and the Company pages. */
export default function SiteFooter() {
  return (
    <footer className="border-t border-border py-14 px-6">
      <div className="mx-auto max-w-6xl grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
        {/* Brand */}
        <div>
          <Link href="/" className="flex items-center gap-1.5 text-sm font-bold text-primary">
            <Sparkles size={14} className="text-accent" />
            Code<span className="text-accent">ward</span>
          </Link>
          <p className="mt-3 text-sm text-muted max-w-xs leading-relaxed">
            Production-shaped interview prep — DSA, system design, code review, debugging, and a mentor that knows where you stand.
          </p>
          <p className="mt-4 font-mono text-xs text-muted">© 2026 Codeward · Built to get you hired</p>
        </div>

        {/* Link columns */}
        {footerCols.map((col) => (
          <div key={col.heading}>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-3">{col.heading}</p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-secondary hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
