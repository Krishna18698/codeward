import type { ReactNode } from "react";
import { Sparkles, Target, Brain, TrendingUp } from "lucide-react";

const features = [
  { icon: Brain,      label: "150+ DSA patterns",             sub: "Curated sheets from NeetCode, Striver & more" },
  { icon: Target,     label: "System design mastery",         sub: "Junior to staff-level architecture problems" },
  { icon: Sparkles,   label: "AI-powered mentor",             sub: "Personalized guidance & custom study plans" },
  { icon: TrendingUp, label: "Progress tracking",             sub: "Visualise your journey across every topic" },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-canvas text-neutral-100">

      {/* ── Left panel ── */}
      <div className="relative hidden lg:flex lg:w-[52%] flex-col justify-between p-12 overflow-hidden">

        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0">
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        {/* Brand */}
        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Sparkles size={16} className="text-emerald-400" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            Code<span className="text-emerald-400">ward</span>
          </span>
        </div>

        {/* Headline */}
        <div className="relative space-y-6 -mt-8">
          <div className="space-y-3">
            <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-emerald-400/80">
              Your product company prep co-pilot
            </p>
            <h1 className="text-4xl font-semibold tracking-heading leading-[1.15] text-white">
              Ace every<br />
              <span className="text-emerald-400">technical interview.</span>
            </h1>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-sm">
              A focused prep platform built for engineers targeting top-tier roles. Track, practice, and grow — all in one place.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 pt-2">
            {features.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="mt-0.5 w-7 h-7 rounded-lg bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-200">{label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer quote */}
        <div className="relative">
          <p className="text-[11px] text-neutral-500 italic">
            &ldquo;The best time to start is now. The second best time was yesterday.&rdquo;
          </p>
        </div>

        {/* Right-edge fade into form panel */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-linear-to-r from-transparent to-black" />
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-canvas">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
