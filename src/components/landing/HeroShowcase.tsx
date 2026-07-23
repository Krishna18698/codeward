import { Sparkles } from "lucide-react";
import { Ring } from "@/components/ui/Ring";
import { highlightTs } from "@/lib/highlightTs";

// A large, on-brand product mockup of Codeward's Code Review workspace — the
// "here's what we do" showcase under the hero. Floats gently and sits on an
// emerald backlight. Content is illustrative (marketing).

const modes: { label: string; count?: string; active?: boolean }[] = [
  { label: "DSA Sheets", count: "300+" },
  { label: "System Design" },
  { label: "Code Review", count: "15", active: true },
  { label: "Bug Hunt", count: "9" },
  { label: "Build It", count: "5" },
  { label: "Deep Dives", count: "13" },
];

const codeLines: { n: number; t: string; bug?: boolean }[] = [
  { n: 23, t: "export function handle(req: Request, res: Response) {" },
  { n: 24, t: '  const key = req.headers["idempotency-key"];' },
  { n: 25, t: "  const cached = store[key];", bug: true },
  { n: 26, t: "  if (cached) return res.json(cached);", bug: true },
  { n: 27, t: "  const result = psp.charge(req.amount);", bug: true },
  { n: 28, t: "  store[key] = result;" },
  { n: 29, t: "  return res.json(result);" },
  { n: 30, t: "}" },
];

const issues: { sev: string; state: "missed" | "caught"; text: string }[] = [
  { sev: "S5", state: "missed", text: "Race window: cache check isn't atomic with the charge call." },
  { sev: "S4", state: "missed", text: "In-memory store loses idempotency on restart." },
  { sev: "S4", state: "caught", text: "Float for money — precision drift on refunds." },
];

export default function HeroShowcase() {
  return (
    <section className="px-6 pb-10">
      <div className="relative isolate mx-auto max-w-6xl animate-float">
        {/* Emerald backlight around the ENTIRE card — a blurred emerald shape
            slightly larger than the card, so the glow bleeds out on all sides.
            isolate on the wrapper keeps this -z-10 layer in front of the page. */}
        <div aria-hidden className="pointer-events-none absolute -inset-6 -z-10 rounded-[36px] bg-emerald-500/25 blur-3xl" />

        <div className="overflow-hidden rounded-lg border border-neutral-800 bg-black shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
          {/* Title bar */}
          <div className="flex items-center gap-2.5 border-b border-neutral-800 bg-linear-to-b from-white/5 to-transparent px-3.5 py-2.5">
            <span className="flex shrink-0 gap-2" aria-hidden>
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </span>
            <span className="mx-auto rounded-md border border-neutral-800 bg-black/30 px-3 py-1 font-mono text-[11px] text-neutral-500">
              codeward · code-review / idempotency-middleware
            </span>
          </div>

          <div className="flex">
            {/* ── Sidebar ── */}
            <aside className="hidden w-48 shrink-0 flex-col border-r border-neutral-800 p-4 md:flex">
              <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                <Sparkles size={14} className="text-emerald-400" />
                Code<span className="text-emerald-400">ward</span>
              </span>
              <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-neutral-600">Practice</p>
              <nav className="mt-2 space-y-0.5">
                {modes.map((m) => (
                  <div
                    key={m.label}
                    className={`flex items-center justify-between rounded-md px-2.5 py-2 text-xs ${
                      m.active ? "bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-500/30" : "text-neutral-500"
                    }`}
                  >
                    <span>{m.label}</span>
                    {m.count && (
                      <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] ${
                        m.active ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-neutral-500"
                      }`}>
                        {m.count}
                      </span>
                    )}
                  </div>
                ))}
              </nav>
              <div className="mt-8">
                <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-600 mb-1.5">Your progress</p>
                <div className="h-1 overflow-hidden rounded-full bg-neutral-800">
                  <div className="h-full w-[45%] rounded-full bg-emerald-500" />
                </div>
                <p className="mt-1.5 font-mono text-[10px] text-neutral-600">19 of 42 done</p>
              </div>
              <div className="mt-auto flex items-center gap-2 pt-6">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 font-mono text-[10px] text-neutral-400">A</span>
                <span className="font-mono text-[10px] text-neutral-600">you@codeward.app</span>
              </div>
            </aside>

            {/* ── Code pane ── */}
            <div className="min-w-0 flex-1 border-r border-neutral-800">
              <div className="flex items-center gap-3 border-b border-neutral-800 px-4 py-2.5">
                <span className="font-mono text-[11px] font-medium text-white">
                  idempotency.ts
                  <span className="mt-1.5 block h-0.5 rounded-full bg-emerald-400" />
                </span>
                <span className="font-mono text-[11px] text-neutral-600">idempotency.test.ts</span>
                <span className="ml-auto flex gap-1.5">
                  <span className="rounded bg-rose-500/15 px-1.5 py-0.5 font-mono text-[9px] text-rose-400">2 missed</span>
                  <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9px] text-emerald-400">3 caught</span>
                </span>
              </div>
              <div className="py-3 font-mono text-[11.5px] leading-6">
                {codeLines.map((l) => (
                  <div
                    key={l.n}
                    className={`grid grid-cols-[3ch_1fr] gap-3 pr-3 ${
                      l.bug ? "border-l-2 border-rose-500 bg-rose-500/10" : "border-l-2 border-transparent"
                    }`}
                  >
                    <span className="select-none text-right text-neutral-600">{l.n}</span>
                    <code
                      className={`whitespace-pre ${l.bug ? "" : "opacity-55"}`}
                      dangerouslySetInnerHTML={{ __html: highlightTs(l.t) || " " }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Issues pane ── */}
            <aside className="hidden w-64 shrink-0 flex-col p-4 lg:flex">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <Ring pct={82} size={56} stroke={5} color="#34d399" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-sm font-bold text-white">82</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-400">Strong</p>
                  <p className="font-mono text-[10px] text-neutral-500 mt-0.5">Severity-weighted · /100</p>
                </div>
              </div>

              <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-neutral-600">Issues</p>
              <div className="mt-2 space-y-2">
                {issues.map((iss, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-2.5 ${
                      iss.state === "caught" ? "border-emerald-500/25 bg-emerald-500/5" : "border-rose-500/25 bg-rose-500/5"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className={`rounded px-1 font-mono text-[9px] font-bold ${iss.state === "caught" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
                        {iss.sev}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">{iss.state}</span>
                    </div>
                    <p className="text-[11px] leading-snug text-neutral-300">{iss.text}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
