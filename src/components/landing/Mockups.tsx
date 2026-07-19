import { Check, Sparkles, GitPullRequest } from "lucide-react";

/** Browser-chrome frame — the device that makes each section feel like the real product. */
export function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-surface overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-2 border-b border-neutral-800 bg-white/3 px-3 py-2">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
        </span>
        <span className="ml-2 flex-1 truncate rounded-md bg-black/40 px-2.5 py-1 font-mono text-[11px] text-neutral-500">
          {url}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

const companyColor: Record<string, string> = {
  G: "bg-blue-500/20 text-blue-300",
  A: "bg-orange-500/20 text-orange-300",
  M: "bg-sky-500/20 text-sky-300",
  N: "bg-red-500/20 text-red-300",
};

/* ── DSA Sheets mockup ── */
export function DsaMockup() {
  const rows = [
    { title: "Two Sum", status: "done", diff: "Easy", cos: ["G", "A"] },
    { title: "Longest Substring Without Repeating", status: "solving", diff: "Medium", cos: ["A", "M"] },
    { title: "Trapping Rain Water", status: "todo", diff: "Hard", cos: ["G", "N"] },
  ];
  return (
    <BrowserFrame url="codeward.app/dashboard/dsa">
      <div className="space-y-3">
        {/* pattern header + progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-neutral-300 capitalize">arrays</span>
            <span className="font-mono text-[10px] text-neutral-500">14/22</span>
          </div>
          <div className="h-1 rounded-full bg-neutral-800 overflow-hidden">
            <div className="h-full w-[64%] rounded-full bg-emerald-500" />
          </div>
        </div>
        {/* rows */}
        <div className="divide-y divide-neutral-800/60 rounded-lg border border-neutral-800">
          {rows.map((r) => (
            <div key={r.title} className="flex items-center gap-3 px-3 py-2">
              <span className={`grid h-4 w-4 place-items-center rounded-full border ${
                r.status === "done" ? "border-emerald-500/60 bg-emerald-500/10"
                : r.status === "solving" ? "border-amber-500/60 bg-amber-500/10"
                : "border-neutral-700"
              }`}>
                {r.status === "done" && <Check size={9} strokeWidth={3} className="text-emerald-400" />}
                {r.status === "solving" && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
              </span>
              <span className="flex-1 truncate text-xs text-neutral-300">{r.title}</span>
              <span className="flex gap-1">
                {r.cos.map((c, i) => (
                  <span key={i} className={`grid h-4 w-4 place-items-center rounded-sm font-mono text-[9px] ${companyColor[c]}`}>{c}</span>
                ))}
              </span>
              <span className={`font-mono text-[10px] ${
                r.diff === "Easy" ? "text-emerald-400" : r.diff === "Medium" ? "text-amber-400" : "text-rose-400"
              }`}>{r.diff}</span>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ── AI Mentor mockup ── */
export function MentorMockup() {
  return (
    <BrowserFrame url="codeward.app/dashboard/mentor">
      <div className="space-y-3 font-sans">
        <div className="flex justify-end">
          <p className="max-w-[85%] rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-neutral-200">
            Prep me for Meta. I&apos;m ok at arrays but weak on trees and DP.
          </p>
        </div>
        <div className="flex gap-2">
          <Sparkles size={12} className="mt-0.5 shrink-0 text-emerald-400" />
          <p className="text-xs text-neutral-300 leading-relaxed">
            Building you a Meta sheet: trees first (10 must-dos), then DP (12 patterns),
            arrays as warm-up.
            <span className="ml-0.5 inline-block h-3 w-0.5 translate-y-0.5 bg-emerald-400 motion-safe:animate-pulse" />
          </p>
        </div>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
          <p className="font-mono text-[10px] text-emerald-400">✓ Sheet created · 34 problems</p>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ── Code Review mockup ── */
export function CodeReviewMockup() {
  const code = [
    "if cached, ok := store[key]; ok {",
    "  writeCached(w, cached)",
    "  return",
    "}",
    "result := psp.Charge(amount)",
    "store[key] = result",
  ];
  return (
    <BrowserFrame url="codeward.app/dashboard/code-review/idempotency-middleware">
      <div className="space-y-3">
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="text-neutral-300">idempotency.ts</span>
          <span className="text-rose-400">2 missed</span>
          <span className="text-neutral-600">·</span>
          <span className="text-emerald-400">3 caught</span>
        </div>
        <pre className="rounded-lg border border-neutral-800 bg-black/40 p-3 font-mono text-[11px] leading-5">
          {code.map((l, i) => (
            <div key={i} className="grid grid-cols-[2ch_1fr] gap-3">
              <span className="text-right text-neutral-600">{23 + i}</span>
              <span className="text-neutral-300 whitespace-pre">{l}</span>
            </div>
          ))}
        </pre>
        <div className="space-y-1.5">
          <div className="flex items-start gap-2 rounded-lg border border-rose-500/25 bg-rose-500/5 px-2.5 py-1.5">
            <span className="rounded bg-rose-500/15 px-1 font-mono text-[9px] font-bold text-rose-400">S5</span>
            <span className="text-[11px] text-neutral-300">Cache check isn&apos;t atomic with the charge — race window.</span>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-2.5 py-1.5">
            <span className="rounded bg-emerald-500/15 px-1 font-mono text-[9px] font-bold text-emerald-400">S4</span>
            <span className="text-[11px] text-neutral-300">In-memory store loses state on restart.</span>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ── Deep Dives mockup ── */
export function DeepDiveMockup() {
  const topics = ["Idempotency", "Caching at scale", "Rate limiting", "Kafka internals"];
  return (
    <BrowserFrame url="codeward.app/dashboard/deep-dives/idempotency-exactly-once">
      <div className="grid grid-cols-[1fr_1.4fr] gap-4">
        <div className="space-y-1">
          <p className="mb-1.5 font-mono text-[10px] text-neutral-500">6 topics</p>
          {topics.map((t, i) => (
            <div key={t} className={`rounded-md px-2 py-1 text-[11px] ${i === 0 ? "bg-white/6 text-white" : "text-neutral-500"}`}>
              {t}
            </div>
          ))}
        </div>
        <div>
          <p className="font-mono text-[10px] text-emerald-400 mb-1">Deep Dive 01</p>
          <p className="text-sm font-semibold text-white mb-1.5">Idempotency</p>
          <p className="text-[11px] text-neutral-400 leading-relaxed mb-2">
            A timeout is indistinguishable from a failure. Any retry that doesn&apos;t
            account for that double-charges.
          </p>
          <pre className="rounded-md border border-neutral-800 bg-black/40 p-2 font-mono text-[10px] leading-4 text-neutral-300">
{`if cached, ok := store.Get(key); ok {
  return cached // idempotent
}`}
          </pre>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ── Bug Hunt mockup ── */
export function BugHuntMockup() {
  return (
    <BrowserFrame url="codeward.app/dashboard/bug-hunt/double-charge-race">
      <div className="space-y-3">
        <div className="rounded-lg border border-neutral-800 bg-black/40 p-3 font-mono text-[11px] leading-5">
          <p className="text-neutral-500">=== RUN TestChargeIdempotency</p>
          <p className="text-rose-400">--- FAIL: duplicate charge on retry (2.31s)</p>
          <p className="text-neutral-400 pl-3">want: 1 charge · got: 2 (txn-4821, txn-4822)</p>
          <p className="text-rose-400 mt-1">DATA RACE: concurrent write to store[key]</p>
        </div>
        <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3">
          <p className="font-mono text-[10px] text-emerald-400 mb-1">Root cause</p>
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            The check and the store write aren&apos;t atomic — two concurrent requests both pass the guard before either writes.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">✓ root cause identified</span>
          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">100/100</span>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ── System Design mockup ── */
export function SystemDesignMockup() {
  return (
    <BrowserFrame url="codeward.app/dashboard/system-design">
      <div className="space-y-3">
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
          <p className="font-mono text-[10px] text-rose-400 mb-1">Challenge spinner</p>
          <p className="text-sm font-semibold text-white">Design a rate limiter</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">100M DAU · flash-sale 50× spike · &lt;5ms p99</p>
        </div>
        {[
          { t: "Design a URL shortener", d: "Easy", lvl: "Junior" },
          { t: "Design a distributed cache", d: "Medium", lvl: "Mid" },
          { t: "Design a payment ledger", d: "Hard", lvl: "Senior" },
        ].map((q) => (
          <div key={q.t} className="flex items-center gap-2 rounded-md border border-neutral-800 px-3 py-1.5">
            <span className="flex-1 truncate text-xs text-neutral-300">{q.t}</span>
            <span className={`font-mono text-[10px] ${q.d === "Easy" ? "text-emerald-400" : q.d === "Medium" ? "text-amber-400" : "text-rose-400"}`}>{q.d}</span>
            <span className="font-mono text-[10px] text-neutral-600">{q.lvl}</span>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

export const MODE_ICON = { GitPullRequest };
