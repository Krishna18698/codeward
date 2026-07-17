"use client";
import { useState } from "react";
import { Shuffle, Zap, Users, Globe, Clock, AlertTriangle, Copy, Check } from "lucide-react";
import { cn } from "@/lib/cn";

const BASE_PROBLEMS = [
  "E-commerce platform",
  "URL shortener",
  "Social media feed",
  "Real-time chat system",
  "Video streaming service",
  "Ride-sharing app",
  "Food delivery platform",
  "Hotel booking system",
  "Payment gateway",
  "Online code judge",
  "Notification service",
  "Search autocomplete",
  "File storage & sync",
  "Gaming leaderboard",
  "Stock trading platform",
  "Distributed task queue",
  "Rate limiter service",
  "API gateway",
  "Content delivery network",
  "Distributed cache",
  "Analytics pipeline",
  "Event streaming platform",
  "Authentication service",
  "Healthcare appointment system",
  "Flight booking platform",
  "Live sports scoring system",
  "Collaborative document editor",
  "Music streaming service",
  "Coupon & deals platform",
  "Log aggregation system",
  "Email delivery service",
  "Distributed job scheduler",
  "News feed aggregator",
  "Ad serving platform",
  "IoT data ingestion system",
];

const SCALES = [
  { label: "1K DAU",   desc: "Early-stage startup",       color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { label: "50K DAU",  desc: "Growing startup scale",     color: "text-teal-400",    bg: "bg-teal-500/10 border-teal-500/20" },
  { label: "1M DAU",   desc: "Mid-size product scale",    color: "text-emerald-400",     bg: "bg-emerald-500/10 border-emerald-500/20" },
  { label: "10M DAU",  desc: "Large company scale",       color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" },
  { label: "100M DAU", desc: "Top-tier global product",   color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20" },
  { label: "500M DAU", desc: "FAANG-level global scale",  color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20" },
];

const SPIKES = [
  "Traffic spike at 8–10 PM daily",
  "Flash sale: 50× traffic surge in minutes",
  "Holiday season: 10× sustained load for 2 weeks",
  "Viral event: 100× peak for 30 minutes",
  "Gradual growth: 5× over the next 6 months",
  "Global rollout to 3 new regions simultaneously",
  "No predictable pattern — always-on high availability",
  "IPO day: 200× read traffic for 6 hours",
  "Major outage recovery: full traffic dump in under 5 minutes",
  "Sports final: 30× spike for 90 minutes then instant drop",
  "Daily batch job: all writes hit at midnight UTC",
  "End-of-quarter reporting: 20× analytical query load",
  "New feature launch: 10× signup rate for 48 hours",
  "DDoS mitigation: 1000× invalid request flood",
  "Black Friday: 100× transactions over 24 hours",
];

const CONSTRAINTS = [
  "< 100 ms p99 latency for reads",
  "Strong consistency for writes",
  "Eventual consistency is acceptable",
  "Mobile-first, offline support required",
  "Multi-region active-active setup",
  "99.999% uptime SLA",
  "Cost optimised — keep infra spend minimal",
  "Real-time updates via WebSocket/SSE",
  "Data must never leave the user's home region (GDPR)",
  "Read-heavy: 1000:1 read-to-write ratio",
  "Write-heavy: 10M writes per second at peak",
  "Idempotent operations required for all mutations",
  "Zero data loss — durability over availability",
  "Supports end-to-end encryption for all payloads",
  "Full audit log required for every state change",
  "Cold start in < 2 seconds after idle scale-to-zero",
  "Budget hard cap: infra < $10K/month",
  "Single-tenant isolation per enterprise customer",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type Challenge = {
  problem: string;
  scale: (typeof SCALES)[number];
  spike: string;
  constraint: string;
};

function generateChallenge(): Challenge {
  return {
    problem:    pick(BASE_PROBLEMS),
    scale:      pick(SCALES),
    spike:      pick(SPIKES),
    constraint: pick(CONSTRAINTS),
  };
}

export default function ChallengeSpinner({ compact }: { compact?: boolean }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [spinning,  setSpinning]  = useState(false);
  const [revealed,  setRevealed]  = useState(false);
  const [copied,    setCopied]    = useState(false);

  const copyPrompt = () => {
    if (!challenge) return;
    const text = `Design a ${challenge.problem} that serves ${challenge.scale.label}. Account for: ${challenge.spike.toLowerCase()}. Key requirement: ${challenge.constraint.toLowerCase()}.`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setRevealed(false);
    setTimeout(() => {
      setChallenge(generateChallenge());
      setSpinning(false);
      setRevealed(true);
    }, 700);
  };

  /* ── Compact (mobile) ── */
  if (compact) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
        {/* Trigger row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
            <Shuffle size={13} className="text-rose-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-none">Challenge Spinner</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Scale · spike · constraints — all random</p>
          </div>
          <button
            onClick={spin}
            disabled={spinning}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all shrink-0",
              spinning
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                : "bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25",
            )}
          >
            <Shuffle size={11} className={spinning ? "animate-spin" : ""} />
            {spinning ? "…" : challenge ? "Re-spin" : "Spin!"}
          </button>
        </div>

        {/* Spinning indicator */}
        {spinning && (
          <div className="px-4 pb-3 flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}

        {/* Compact result — all four sections */}
        {challenge && revealed && (
          <div className="border-t border-neutral-800/60 px-4 py-3 space-y-2.5 animate-fade-up">
            {/* Problem */}
            <p className="text-sm font-bold text-white">Design a {challenge.problem}</p>

            {/* Scale */}
            <div className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium", challenge.scale.bg)}>
              <Users size={10} className={challenge.scale.color} />
              <span className={challenge.scale.color}>{challenge.scale.label}</span>
              <span className="text-neutral-500">— {challenge.scale.desc}</span>
            </div>

            {/* Traffic spike */}
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <AlertTriangle size={11} className="text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-0.5">Traffic spike</p>
                <p className="text-xs text-neutral-300">{challenge.spike}</p>
              </div>
            </div>

            {/* Special constraint */}
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
              <Globe size={11} className="text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-0.5">Special constraint</p>
                <p className="text-xs text-neutral-300">{challenge.constraint}</p>
              </div>
            </div>

            {/* Prompt */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock size={10} className="text-neutral-500" />
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 flex-1">Your prompt</p>
                <button onClick={copyPrompt} title="Copy" aria-label="Copy challenge prompt" className="text-neutral-500 hover:text-neutral-300 transition-colors">
                  {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                </button>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Design a <span className="text-white font-medium">{challenge.problem}</span> that serves{" "}
                <span className={cn("font-medium", challenge.scale.color)}>{challenge.scale.label}</span>.{" "}
                Account for: <span className="text-neutral-300">{challenge.spike.toLowerCase()}</span>.{" "}
                Key requirement: <span className="text-neutral-300">{challenge.constraint.toLowerCase()}</span>.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Full (desktop rail) ── */
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
            <Shuffle size={13} className="text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Challenge Spinner</p>
            <p className="text-[10px] text-neutral-500">Scale · spike · constraints — all random</p>
          </div>
        </div>
        <button
          onClick={spin}
          disabled={spinning}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 whitespace-nowrap shrink-0",
            spinning
              ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
              : "bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25 hover:border-rose-500/60",
          )}
        >
          <Shuffle size={12} className={spinning ? "animate-spin" : ""} />
          {spinning ? "Spinning…" : challenge ? "Re-spin" : "Spin!"}
        </button>
      </div>

      {/* Empty state */}
      {!challenge && !spinning && (
        <div className="px-5 py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <Zap size={22} className="text-rose-400" />
          </div>
          <p className="text-sm font-medium text-neutral-300">Ready for a random challenge?</p>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
            Hit Spin to get a problem, scale, traffic spike, and a special constraint — all randomised.
          </p>
        </div>
      )}

      {/* Spinning state */}
      {spinning && (
        <div className="px-5 py-12 text-center">
          <div className="flex justify-center gap-2 mb-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-rose-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-sm text-neutral-500">Generating your challenge…</p>
        </div>
      )}

      {/* Result */}
      {challenge && revealed && (
        <div className={cn("px-5 py-5 space-y-4 animate-fade-up")}>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1.5">Problem</p>
            <p className="text-xl font-bold text-white">Design a {challenge.problem}</p>
          </div>

          <div className={cn("inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold", challenge.scale.bg)}>
            <Users size={12} className={challenge.scale.color} />
            <span className={challenge.scale.color}>{challenge.scale.label}</span>
            <span className="text-neutral-500">— {challenge.scale.desc}</span>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-0.5">Traffic spike</p>
              <p className="text-sm text-neutral-300">{challenge.spike}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <Globe size={13} className="text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-0.5">Special constraint</p>
              <p className="text-sm text-neutral-300">{challenge.constraint}</p>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={11} className="text-neutral-500" />
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 flex-1">Your prompt</p>
              <button
                onClick={copyPrompt}
                title="Copy prompt"
                aria-label="Copy challenge prompt"
                className="text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Design a <span className="text-white font-medium">{challenge.problem}</span> that serves{" "}
              <span className={cn("font-medium", challenge.scale.color)}>{challenge.scale.label}</span>.{" "}
              Account for: <span className="text-neutral-300">{challenge.spike.toLowerCase()}</span>.{" "}
              Key requirement: <span className="text-neutral-300">{challenge.constraint.toLowerCase()}</span>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
